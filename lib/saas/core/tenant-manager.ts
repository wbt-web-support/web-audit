/**
 * Tenant Manager
 * Handles multi-tenant operations, isolation, and resource management
 */

import { createClient } from '@/lib/supabase/server';
import { Tenant, TenantLimits, TenantUsage, SubscriptionPlan } from '../types';
import { dynamicScalingManager } from '../config/dynamic-scaling';

export class TenantManager {
  private static instance: TenantManager;
  private tenantCache = new Map<string, Tenant>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  /**
   * Get tenant by ID with caching
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    // Check cache first
    if (this.isCacheValid(tenantId)) {
      return this.tenantCache.get(tenantId) || null;
    }

    try {
      const supabase = await createClient();
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            tier,
            limits,
            features,
            price,
            billing_cycle
          )
        `)
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        return null;
      }

      const tenantData: Tenant = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.subscription_plans,
        status: tenant.status,
        settings: tenant.settings,
        limits: tenant.limits,
        usage: tenant.usage,
        createdAt: new Date(tenant.created_at),
        updatedAt: new Date(tenant.updated_at),
      };

      // Cache the result
      this.tenantCache.set(tenantId, tenantData);
      this.cacheExpiry.set(tenantId, Date.now() + this.CACHE_TTL);

      return tenantData;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const supabase = await createClient();
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            tier,
            limits,
            features,
            price,
            billing_cycle
          )
        `)
        .eq('slug', slug)
        .single();

      if (error || !tenant) {
        return null;
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.subscription_plans,
        status: tenant.status,
        settings: tenant.settings,
        limits: tenant.limits,
        usage: tenant.usage,
        createdAt: new Date(tenant.created_at),
        updatedAt: new Date(tenant.updated_at),
      };
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  /**
   * Check if tenant can perform an action based on limits
   */
  async checkTenantLimits(
    tenantId: string, 
    action: keyof TenantUsage,
    requestedAmount: number = 1
  ): Promise<{ allowed: boolean; reason?: string; currentUsage: number; limit: number }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found', currentUsage: 0, limit: 0 };
    }

    if (tenant.status !== 'active') {
      return { allowed: false, reason: 'Tenant is not active', currentUsage: 0, limit: 0 };
    }

    const currentUsage = tenant.usage[action] as number;
    
    // Map usage properties to their corresponding limit properties
    const limitPropertyMap: Record<keyof TenantUsage, keyof TenantLimits> = {
      currentProjects: 'maxProjects',
      currentPages: 'maxPagesPerProject',
      currentCrawls: 'maxConcurrentCrawls',
      currentWorkers: 'maxWorkers',
      currentStorageGB: 'storageGB',
      monthlyCrawls: 'monthlyCrawlLimit',
      lastResetDate: 'maxProjects', // This won't be used for limits
    };
    
    const limitProperty = limitPropertyMap[action];
    const limit = tenant.limits[limitProperty] as number;

    if (currentUsage + requestedAmount > limit) {
      return {
        allowed: false,
        reason: `Exceeds ${action} limit (${currentUsage + requestedAmount}/${limit})`,
        currentUsage,
        limit,
      };
    }

    return { allowed: true, currentUsage, limit };
  }

  /**
   * Update tenant usage
   */
  async updateTenantUsage(
    tenantId: string,
    updates: Partial<TenantUsage>
  ): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('tenants')
        .update({
          usage: updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant usage:', error);
        return false;
      }

      // Invalidate cache
      this.invalidateCache(tenantId);
      return true;
    } catch (error) {
      console.error('Error updating tenant usage:', error);
      return false;
    }
  }

  /**
   * Increment tenant usage for a specific metric
   */
  async incrementUsage(
    tenantId: string,
    metric: keyof TenantUsage,
    amount: number = 1
  ): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    const newUsage = {
      ...tenant.usage,
      [metric]: (tenant.usage[metric] as number) + amount,
    };

    return await this.updateTenantUsage(tenantId, newUsage);
  }

  /**
   * Decrement tenant usage for a specific metric
   */
  async decrementUsage(
    tenantId: string,
    metric: keyof TenantUsage,
    amount: number = 1
  ): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    const newUsage = {
      ...tenant.usage,
      [metric]: Math.max(0, (tenant.usage[metric] as number) - amount),
    };

    return await this.updateTenantUsage(tenantId, newUsage);
  }

  /**
   * Reset monthly usage (called by cron job)
   */
  async resetMonthlyUsage(tenantId: string): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    const newUsage = {
      ...tenant.usage,
      monthlyCrawls: 0,
      lastResetDate: new Date(),
    };

    return await this.updateTenantUsage(tenantId, newUsage);
  }

  /**
   * Get all active tenants
   */
  async getActiveTenants(): Promise<Tenant[]> {
    try {
      const supabase = await createClient();
      
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            tier,
            limits,
            features,
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching active tenants:', error);
        return [];
      }

      return tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.subscription_plans,
        status: tenant.status,
        settings: tenant.settings,
        limits: tenant.limits,
        usage: tenant.usage,
        createdAt: new Date(tenant.created_at),
        updatedAt: new Date(tenant.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching active tenants:', error);
      return [];
    }
  }

  /**
   * Create a new tenant with dynamic resource allocation
   */
  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const supabase = await createClient();
      
      // Get system resources for dynamic allocation
      const systemResources = dynamicScalingManager.getSystemResourceAllocation();
      const tenantLimits = dynamicScalingManager.getTenantResourceLimits(
        tenantData.plan.tier,
        systemResources
      );

      // Update tenant limits with dynamic allocation
      const updatedTenantData = {
        ...tenantData,
        limits: {
          ...tenantData.limits,
          ...tenantLimits,
        },
      };
      
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: updatedTenantData.name,
          slug: updatedTenantData.slug,
          plan_id: updatedTenantData.plan.id,
          status: updatedTenantData.status,
          settings: updatedTenantData.settings,
          limits: updatedTenantData.limits,
          usage: updatedTenantData.usage,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating tenant:', error);
        return null;
      }

      console.log(`✅ Tenant created with dynamic limits:`, {
        tenantId: data.id,
        plan: tenantData.plan.tier,
        limits: tenantLimits,
      });

      return data.id;
    } catch (error) {
      console.error('Error creating tenant:', error);
      return null;
    }
  }

  /**
   * Update tenant settings
   */
  async updateTenantSettings(
    tenantId: string,
    settings: Partial<Tenant['settings']>
  ): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('tenants')
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant settings:', error);
        return false;
      }

      this.invalidateCache(tenantId);
      return true;
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      return false;
    }
  }

  /**
   * Update all tenant limits based on current system resources
   */
  async updateAllTenantLimits(): Promise<{ updated: number; errors: string[] }> {
    try {
      const supabase = await createClient();
      const tenants = await this.getActiveTenants();
      const systemResources = dynamicScalingManager.getSystemResourceAllocation();
      
      let updated = 0;
      const errors: string[] = [];

      for (const tenant of tenants) {
        try {
          const newLimits = dynamicScalingManager.getTenantResourceLimits(
            tenant.plan.tier,
            systemResources
          );

          const { error } = await supabase
            .from('tenants')
            .update({
              limits: newLimits,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenant.id);

          if (error) {
            errors.push(`Failed to update tenant ${tenant.id}: ${error.message}`);
          } else {
            updated++;
            this.invalidateCache(tenant.id);
          }
        } catch (error) {
          errors.push(`Error updating tenant ${tenant.id}: ${error}`);
        }
      }

      console.log(`🔄 Updated limits for ${updated} tenants based on system resources`);
      return { updated, errors };
    } catch (error) {
      console.error('Error updating tenant limits:', error);
      return { updated: 0, errors: [error as string] };
    }
  }

  /**
   * Check cache validity
   */
  private isCacheValid(tenantId: string): boolean {
    const expiry = this.cacheExpiry.get(tenantId);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Invalidate cache for a tenant
   */
  private invalidateCache(tenantId: string): void {
    this.tenantCache.delete(tenantId);
    this.cacheExpiry.delete(tenantId);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.tenantCache.clear();
    this.cacheExpiry.clear();
  }
}

export const tenantManager = TenantManager.getInstance();