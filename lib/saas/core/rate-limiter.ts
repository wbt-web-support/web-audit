/**
 * Rate Limiter
 * Handles rate limiting for multi-tenant SaaS system
 */

import { createClient } from '@/lib/supabase/server';
import { RateLimitInfo } from '../types';

interface RateLimitRule {
  endpoint: string;
  limit: number;
  windowMs: number;
  keyGenerator?: (tenantId: string, userId?: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private memoryCache = new Map<string, RateLimitEntry>();
  private readonly DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Default rate limit rules
  private readonly DEFAULT_RULES: RateLimitRule[] = [
    {
      endpoint: '/api/scrape/start',
      limit: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    {
      endpoint: '/api/audit-projects',
      limit: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    {
      endpoint: '/api/audit-projects/*/analyze',
      limit: 50,
      windowMs: 60 * 1000, // 1 minute
    },
    {
      endpoint: '/api/admin/*',
      limit: 200,
      windowMs: 60 * 1000, // 1 minute
    },
  ];

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
      RateLimiter.instance.startCleanupInterval();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is within rate limits
   */
  async checkRateLimit(
    tenantId: string,
    endpoint: string,
    userId?: string,
    customLimit?: number
  ): Promise<RateLimitInfo> {
    try {
      // Get tenant-specific rate limit
      const tenantLimit = await this.getTenantRateLimit(tenantId, endpoint);
      const limit = customLimit || tenantLimit;

      // Generate cache key
      const key = this.generateKey(tenantId, endpoint, userId);
      
      // Get current entry
      let entry = this.memoryCache.get(key);
      const now = Date.now();

      // Initialize or reset if window expired
      if (!entry || now >= entry.resetTime) {
        entry = {
          count: 0,
          resetTime: now + this.DEFAULT_WINDOW_MS,
          blocked: false,
        };
      }

      // Check if blocked
      if (entry.blocked && now < entry.resetTime) {
        return {
          tenantId,
          endpoint,
          limit,
          remaining: 0,
          resetTime: new Date(entry.resetTime),
        };
      }

      // Increment count
      entry.count++;
      this.memoryCache.set(key, entry);

      const remaining = Math.max(0, limit - entry.count);
      const isBlocked = entry.count > limit;

      if (isBlocked) {
        entry.blocked = true;
        this.memoryCache.set(key, entry);
        
        // Log rate limit violation
        await this.logRateLimitViolation(tenantId, endpoint, userId, entry.count, limit);
      }

      return {
        tenantId,
        endpoint,
        limit,
        remaining,
        resetTime: new Date(entry.resetTime),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        tenantId,
        endpoint,
        limit: 1000,
        remaining: 999,
        resetTime: new Date(Date.now() + this.DEFAULT_WINDOW_MS),
      };
    }
  }

  /**
   * Get tenant-specific rate limit for endpoint
   */
  private async getTenantRateLimit(tenantId: string, endpoint: string): Promise<number> {
    try {
      const supabase = await createClient();
      
      // Get tenant's subscription plan
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          subscription_plans (
            limits
          )
        `)
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        return this.getDefaultLimit(endpoint);
      }

      // Get rate limit from subscription plan
      const planLimits = tenant.subscription_plans[0]?.limits;
      return planLimits?.rateLimitPerMinute || this.getDefaultLimit(endpoint);
    } catch (error) {
      console.error('Error getting tenant rate limit:', error);
      return this.getDefaultLimit(endpoint);
    }
  }

  /**
   * Get default rate limit for endpoint
   */
  private getDefaultLimit(endpoint: string): number {
    const rule = this.DEFAULT_RULES.find(r => 
      r.endpoint === endpoint || 
      (r.endpoint.includes('*') && endpoint.startsWith(r.endpoint.replace('*', '')))
    );
    
    return rule?.limit || 100; // Default limit
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateKey(tenantId: string, endpoint: string, userId?: string): string {
    const baseKey = `${tenantId}:${endpoint}`;
    return userId ? `${baseKey}:${userId}` : baseKey;
  }

  /**
   * Log rate limit violation
   */
  private async logRateLimitViolation(
    tenantId: string,
    endpoint: string,
    userId: string | undefined,
    count: number,
    limit: number
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          user_id: userId || 'system',
          action: 'rate_limit_exceeded',
          resource: 'api',
          resource_id: endpoint,
          metadata: {
            count,
            limit,
            endpoint,
          },
          ip_address: 'system',
          user_agent: 'rate_limiter',
        });
    } catch (error) {
      console.error('Error logging rate limit violation:', error);
    }
  }

  /**
   * Reset rate limit for tenant/endpoint
   */
  async resetRateLimit(tenantId: string, endpoint: string, userId?: string): Promise<void> {
    const key = this.generateKey(tenantId, endpoint, userId);
    this.memoryCache.delete(key);
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    tenantId: string,
    endpoint: string,
    userId?: string
  ): Promise<RateLimitInfo | null> {
    const key = this.generateKey(tenantId, endpoint, userId);
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    const limit = await this.getTenantRateLimit(tenantId, endpoint);
    const remaining = Math.max(0, limit - entry.count);

    return {
      tenantId,
      endpoint,
      limit,
      remaining,
      resetTime: new Date(entry.resetTime),
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now >= entry.resetTime) {
          this.memoryCache.delete(key);
        }
      }
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Get all rate limit entries for monitoring
   */
  getAllEntries(): Map<string, RateLimitEntry> {
    return new Map(this.memoryCache);
  }

  /**
   * Clear all rate limit entries
   */
  clearAll(): void {
    this.memoryCache.clear();
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let blockedEntries = 0;
    let activeEntries = 0;

    for (const entry of this.memoryCache.values()) {
      if (now < entry.resetTime) {
        activeEntries++;
        if (entry.blocked) {
          blockedEntries++;
        }
      }
    }

    return {
      totalEntries: this.memoryCache.size,
      blockedEntries,
      activeEntries,
    };
  }
}

export const rateLimiter = RateLimiter.getInstance();
