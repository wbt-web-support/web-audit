/**
 * System Monitor
 * Comprehensive monitoring and analytics for the SaaS platform
 */

import { createClient } from '@/lib/supabase/server';
import { tenantManager } from '../core/tenant-manager';
import { tenantQueueManager } from '../queue/tenant-queue-manager';
import { SystemMetrics, Tenant } from '../types';

export class SystemMonitor {
  private static instance: SystemMonitor;
  private metricsCache = new Map<string, any>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const supabase = await createClient();
      
      // Get basic counts
      const [
        { count: totalTenants },
        { count: activeTenants },
        { count: totalUsers },
        { count: totalProjects },
        { count: activeCrawls },
        { count: totalPages }
      ] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'crawling'),
        supabase.from('scraped_pages').select('*', { count: 'exact', head: true })
      ]);

      // Get queue statistics
      const queueStats = await tenantQueueManager.getAllQueueStats();
      const totalQueueJobs = queueStats.reduce((sum, stat) => sum + stat.total, 0);
      const activeQueueJobs = queueStats.reduce((sum, stat) => sum + stat.active, 0);
      const waitingQueueJobs = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);
      const completedQueueJobs = queueStats.reduce((sum, stat) => sum + stat.completed, 0);
      const failedQueueJobs = queueStats.reduce((sum, stat) => sum + stat.failed, 0);

      // Get system load (simplified - in production, use proper system monitoring)
      const systemLoad = await this.getSystemLoad();

      return {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalProjects: totalProjects || 0,
        activeCrawls: activeCrawls || 0,
        queueStats: {
          waiting: waitingQueueJobs,
          active: activeQueueJobs,
          completed: completedQueueJobs,
          failed: failedQueueJobs,
        },
        systemLoad,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get tenant-specific metrics
   */
  async getTenantMetrics(tenantId: string): Promise<any> {
    try {
      const supabase = await createClient();
      
      // Get tenant info
      const tenant = await tenantManager.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get project counts by status
      const { data: projectStats } = await supabase
        .from('projects')
        .select('status')
        .eq('tenant_id', tenantId);

      const projectCounts = projectStats?.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get page counts
      const { count: totalPages } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true })
        .in('project_id', 
          supabase
            .from('projects')
            .select('id')
            .eq('tenant_id', tenantId)
        );

      // Get analysis results
      const { count: completedAnalyses } = await supabase
        .from('analysis_results')
        .select('*', { count: 'exact', head: true })
        .in('page_id',
          supabase
            .from('scraped_pages')
            .select('id')
            .in('project_id',
              supabase
                .from('projects')
                .select('id')
                .eq('tenant_id', tenantId)
            )
        );

      // Get queue stats for tenant
      const tenantQueueStats = await tenantQueueManager.getTenantQueueStats(tenantId, 'web-scraping');

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('audit_logs')
        .select('action, timestamp')
        .eq('tenant_id', tenantId)
        .order('timestamp', { ascending: false })
        .limit(10);

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          status: tenant.status,
        },
        usage: tenant.usage,
        limits: tenant.limits,
        projects: {
          total: Object.values(projectCounts).reduce((sum, count) => sum + count, 0),
          byStatus: projectCounts,
        },
        pages: {
          total: totalPages || 0,
          analyzed: completedAnalyses || 0,
        },
        queue: tenantQueueStats,
        recentActivity: recentActivity || [],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting tenant metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const supabase = await createClient();
      
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      };

      const hoursBack = timeRanges[timeRange];
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Get system metrics over time
      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      // Get queue performance
      const { data: queueMetrics } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'queue')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      // Get error rates
      const { data: errorMetrics } = await supabase
        .from('error_logs')
        .select('level, timestamp')
        .gte('timestamp', startTime.toISOString());

      // Calculate error rates by hour
      const errorRates = this.calculateErrorRates(errorMetrics || [], hoursBack);

      // Get tenant growth
      const { data: tenantGrowth } = await supabase
        .from('tenants')
        .select('created_at')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      return {
        timeRange,
        systemMetrics: metrics || [],
        queueMetrics: queueMetrics || [],
        errorRates,
        tenantGrowth: tenantGrowth || [],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get resource utilization
   */
  async getResourceUtilization(): Promise<any> {
    try {
      const supabase = await createClient();
      
      // Get all active tenants
      const tenants = await tenantManager.getActiveTenants();
      
      const utilization = {
        tenants: tenants.length,
        totalUsage: {
          projects: 0,
          pages: 0,
          crawls: 0,
          workers: 0,
          storage: 0,
        },
        totalLimits: {
          projects: 0,
          pages: 0,
          crawls: 0,
          workers: 0,
          storage: 0,
        },
        utilizationPercentages: {
          projects: 0,
          pages: 0,
          crawls: 0,
          workers: 0,
          storage: 0,
        },
        topTenants: [] as any[],
      };

      // Calculate totals
      for (const tenant of tenants) {
        utilization.totalUsage.projects += tenant.usage.currentProjects;
        utilization.totalUsage.pages += tenant.usage.currentPages;
        utilization.totalUsage.crawls += tenant.usage.currentCrawls;
        utilization.totalUsage.workers += tenant.usage.currentWorkers;
        utilization.totalUsage.storage += tenant.usage.currentStorageGB;

        // Handle unlimited limits (-1)
        const addToLimits = (key: keyof typeof utilization.totalLimits, value: number) => {
          if (value !== -1) {
            utilization.totalLimits[key] += value;
          }
        };

        addToLimits('projects', tenant.limits.maxProjects);
        addToLimits('pages', tenant.limits.maxPagesPerProject);
        addToLimits('crawls', tenant.limits.maxConcurrentCrawls);
        addToLimits('workers', tenant.limits.maxWorkers);
        addToLimits('storage', tenant.limits.storageGB);

        // Calculate tenant utilization
        const tenantUtilization = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          plan: tenant.plan.tier,
          utilization: {
            projects: tenant.limits.maxProjects === -1 ? 0 : (tenant.usage.currentProjects / tenant.limits.maxProjects) * 100,
            pages: tenant.limits.maxPagesPerProject === -1 ? 0 : (tenant.usage.currentPages / tenant.limits.maxPagesPerProject) * 100,
            crawls: tenant.limits.maxConcurrentCrawls === -1 ? 0 : (tenant.usage.currentCrawls / tenant.limits.maxConcurrentCrawls) * 100,
            workers: tenant.limits.maxWorkers === -1 ? 0 : (tenant.usage.currentWorkers / tenant.limits.maxWorkers) * 100,
            storage: tenant.limits.storageGB === -1 ? 0 : (tenant.usage.currentStorageGB / tenant.limits.storageGB) * 100,
          },
        };

        utilization.topTenants.push(tenantUtilization);
      }

      // Calculate overall utilization percentages
      Object.keys(utilization.utilizationPercentages).forEach(key => {
        const usageKey = key as keyof typeof utilization.totalUsage;
        const limitsKey = key as keyof typeof utilization.totalLimits;
        
        if (utilization.totalLimits[limitsKey] > 0) {
          utilization.utilizationPercentages[usageKey] = 
            (utilization.totalUsage[usageKey] / utilization.totalLimits[limitsKey]) * 100;
        }
      });

      // Sort tenants by utilization
      utilization.topTenants.sort((a, b) => {
        const aAvg = Object.values(a.utilization).reduce((sum, val) => sum + val, 0) / 5;
        const bAvg = Object.values(b.utilization).reduce((sum, val) => sum + val, 0) / 5;
        return bAvg - aAvg;
      });

      return utilization;
    } catch (error) {
      console.error('Error getting resource utilization:', error);
      throw error;
    }
  }

  /**
   * Record system metric
   */
  async recordMetric(
    metricType: string,
    metricName: string,
    metricValue: number,
    tenantId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('system_metrics')
        .insert({
          metric_type: metricType,
          metric_name: metricName,
          metric_value: metricValue,
          tenant_id: tenantId,
          metadata: metadata || {},
        });
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Get system load (simplified implementation)
   */
  private async getSystemLoad(): Promise<{ cpu: number; memory: number; disk: number }> {
    // In a real implementation, you would use system monitoring tools
    // For now, we'll return mock data
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
    };
  }

  /**
   * Calculate error rates by hour
   */
  private calculateErrorRates(errorMetrics: any[], hoursBack: number): any[] {
    const errorRates = [];
    
    for (let i = 0; i < hoursBack; i++) {
      const hourStart = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(Date.now() - i * 60 * 60 * 1000);
      
      const hourErrors = errorMetrics.filter(error => {
        const errorTime = new Date(error.timestamp);
        return errorTime >= hourStart && errorTime < hourEnd;
      });
      
      const errorCounts = hourErrors.reduce((acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      errorRates.push({
        hour: hourStart.toISOString(),
        errors: errorCounts,
        total: hourErrors.length,
      });
    }
    
    return errorRates.reverse();
  }

  /**
   * Get health check status
   */
  async getHealthCheck(): Promise<any> {
    try {
      const checks = {
        database: false,
        redis: false,
        queues: false,
        tenants: false,
        timestamp: new Date(),
      };

      // Check database
      try {
        const supabase = await createClient();
        await supabase.from('tenants').select('id').limit(1);
        checks.database = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      // Check Redis (simplified)
      try {
        const { getRedisConnection } = await import('@/lib/queue/redis-connection');
        const redis = getRedisConnection();
        await redis.ping();
        checks.redis = true;
      } catch (error) {
        console.error('Redis health check failed:', error);
      }

      // Check queues
      try {
        const queueStats = await tenantQueueManager.getAllQueueStats();
        checks.queues = queueStats.length > 0;
      } catch (error) {
        console.error('Queue health check failed:', error);
      }

      // Check tenants
      try {
        const tenants = await tenantManager.getActiveTenants();
        checks.tenants = tenants.length > 0;
      } catch (error) {
        console.error('Tenant health check failed:', error);
      }

      const allHealthy = Object.values(checks).every(check => 
        typeof check === 'boolean' ? check : true
      );

      return {
        ...checks,
        status: allHealthy ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      console.error('Error getting health check:', error);
      return {
        database: false,
        redis: false,
        queues: false,
        tenants: false,
        status: 'unhealthy',
        timestamp: new Date(),
      };
    }
  }
}

export const systemMonitor = SystemMonitor.getInstance();
