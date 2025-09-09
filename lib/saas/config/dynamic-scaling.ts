/**
 * Dynamic Scaling Configuration
 * Automatically adjusts queue size and worker count based on max users
 */

import { saasConfig } from './saas-config';

export interface ScalingConfig {
  maxUsers: number;
  queueSizePerUser: number;
  workersPerUser: number;
  concurrencyPerWorker: number;
  memoryPerWorker: number;
  cpuPerWorker: number;
}

export class DynamicScalingManager {
  private static instance: DynamicScalingManager;
  private scalingConfig: ScalingConfig;

  constructor() {
    this.scalingConfig = this.calculateScalingConfig();
  }

  static getInstance(): DynamicScalingManager {
    if (!DynamicScalingManager.instance) {
      DynamicScalingManager.instance = new DynamicScalingManager();
    }
    return DynamicScalingManager.instance;
  }

  /**
   * Calculate scaling configuration based on environment variables
   */
  private calculateScalingConfig(): ScalingConfig {
    const maxUsers = parseInt(process.env.MAX_USERS || '500');
    const queueSizePerUser = parseInt(process.env.QUEUE_SIZE_PER_USER || '2');
    const workersPerUser = parseFloat(process.env.WORKERS_PER_USER || '0.1');
    const concurrencyPerWorker = parseInt(process.env.CONCURRENCY_PER_WORKER || '3');
    const memoryPerWorker = parseInt(process.env.MEMORY_PER_WORKER || '256'); // MB
    const cpuPerWorker = parseFloat(process.env.CPU_PER_WORKER || '0.1');

    return {
      maxUsers,
      queueSizePerUser,
      workersPerUser,
      concurrencyPerWorker,
      memoryPerWorker,
      cpuPerWorker,
    };
  }

  /**
   * Get optimal queue configuration for a tenant based on current system load
   */
  getOptimalQueueConfig(tenantId: string, queueName: string): {
    maxWorkers: number;
    maxQueueSize: number;
    concurrency: number;
    delayBetweenJobs: number;
    retryAttempts: number;
    retryDelay: number;
  } {
    const { maxUsers, queueSizePerUser, workersPerUser, concurrencyPerWorker } = this.scalingConfig;
    
    // Calculate base values
    const baseQueueSize = Math.max(100, maxUsers * queueSizePerUser);
    const baseWorkers = Math.max(2, Math.ceil(maxUsers * workersPerUser));
    const baseConcurrency = Math.max(1, concurrencyPerWorker);

    // Adjust based on queue type
    const queueMultipliers = {
      'web-scraping': { queueSize: 1.0, workers: 1.0, concurrency: 1.0 },
      'image-extraction': { queueSize: 0.5, workers: 0.8, concurrency: 0.8 },
      'content-analysis': { queueSize: 0.3, workers: 0.6, concurrency: 0.6 },
      'seo-analysis': { queueSize: 0.2, workers: 0.5, concurrency: 0.5 },
      'performance-analysis': { queueSize: 0.1, workers: 0.3, concurrency: 0.3 },
    };

    const multiplier = queueMultipliers[queueName as keyof typeof queueMultipliers] || queueMultipliers['web-scraping'];

    return {
      maxWorkers: Math.ceil(baseWorkers * multiplier.workers),
      maxQueueSize: Math.ceil(baseQueueSize * multiplier.queueSize),
      concurrency: Math.ceil(baseConcurrency * multiplier.concurrency),
      delayBetweenJobs: this.calculateDelayBetweenJobs(queueName),
      retryAttempts: 3,
      retryDelay: 5000,
    };
  }

  /**
   * Get system-wide resource allocation
   */
  getSystemResourceAllocation(): {
    totalWorkers: number;
    totalQueueSize: number;
    memoryAllocation: number;
    cpuAllocation: number;
    recommendedInstances: number;
  } {
    const { maxUsers, workersPerUser, memoryPerWorker, cpuPerWorker } = this.scalingConfig;
    
    const totalWorkers = Math.ceil(maxUsers * workersPerUser);
    const totalQueueSize = maxUsers * 2; // 2 jobs per user on average
    const memoryAllocation = totalWorkers * memoryPerWorker;
    const cpuAllocation = totalWorkers * cpuPerWorker;
    
    // Calculate recommended instances based on resource limits
    const maxMemoryPerInstance = 2048; // 2GB per instance
    const maxCpuPerInstance = 2.0; // 2 CPU cores per instance
    const recommendedInstances = Math.max(
      Math.ceil(memoryAllocation / maxMemoryPerInstance),
      Math.ceil(cpuAllocation / maxCpuPerInstance),
      1
    );

    return {
      totalWorkers,
      totalQueueSize,
      memoryAllocation,
      cpuAllocation,
      recommendedInstances,
    };
  }

  /**
   * Get tenant-specific resource limits based on plan
   */
  getTenantResourceLimits(planTier: string, totalResources: any): {
    maxWorkers: number;
    maxQueueSize: number;
    maxConcurrentCrawls: number;
    rateLimitPerMinute: number;
  } {
    const { totalWorkers, totalQueueSize } = totalResources;
    
    const planMultipliers = {
      'free': { workers: 0.02, queueSize: 0.01, crawls: 0.01, rateLimit: 0.01 },
      'starter': { workers: 0.05, queueSize: 0.02, crawls: 0.02, rateLimit: 0.05 },
      'professional': { workers: 0.1, queueSize: 0.05, crawls: 0.05, rateLimit: 0.1 },
      'enterprise': { workers: 0.2, queueSize: 0.1, crawls: 0.1, rateLimit: 0.2 },
    };

    const multiplier = planMultipliers[planTier as keyof typeof planMultipliers] || planMultipliers['free'];

    return {
      maxWorkers: Math.max(1, Math.ceil(totalWorkers * multiplier.workers)),
      maxQueueSize: Math.max(10, Math.ceil(totalQueueSize * multiplier.queueSize)),
      maxConcurrentCrawls: Math.max(1, Math.ceil(totalWorkers * multiplier.crawls)),
      rateLimitPerMinute: Math.max(10, Math.ceil(1000 * multiplier.rateLimit)),
    };
  }

  /**
   * Calculate delay between jobs based on queue type and system load
   */
  private calculateDelayBetweenJobs(queueName: string): number {
    const baseDelays = {
      'web-scraping': 1000,
      'image-extraction': 2000,
      'content-analysis': 3000,
      'seo-analysis': 2000,
      'performance-analysis': 5000,
    };

    const baseDelay = baseDelays[queueName as keyof typeof baseDelays] || 1000;
    
    // Adjust based on system load (simplified calculation)
    const systemLoad = this.getSystemLoad();
    return Math.ceil(baseDelay * (1 + systemLoad));
  }

  /**
   * Get current system load (simplified implementation)
   */
  private getSystemLoad(): number {
    // In a real implementation, you would check actual system metrics
    // For now, return a value between 0 and 1 based on max users
    const maxUsers = this.scalingConfig.maxUsers;
    if (maxUsers <= 100) return 0.1;
    if (maxUsers <= 300) return 0.3;
    if (maxUsers <= 500) return 0.5;
    return 0.7;
  }

  /**
   * Update scaling configuration and recalculate all settings
   */
  updateScalingConfig(newConfig: Partial<ScalingConfig>): void {
    this.scalingConfig = { ...this.scalingConfig, ...newConfig };
    
    // Log the new configuration
    console.log('🔄 Dynamic scaling configuration updated:', {
      maxUsers: this.scalingConfig.maxUsers,
      totalWorkers: this.getSystemResourceAllocation().totalWorkers,
      totalQueueSize: this.getSystemResourceAllocation().totalQueueSize,
    });
  }

  /**
   * Get current scaling configuration
   */
  getScalingConfig(): ScalingConfig {
    return { ...this.scalingConfig };
  }

  /**
   * Generate environment variables for deployment
   */
  generateEnvironmentConfig(): Record<string, string> {
    const resources = this.getSystemResourceAllocation();
    
    return {
      MAX_USERS: this.scalingConfig.maxUsers.toString(),
      QUEUE_SIZE_PER_USER: this.scalingConfig.queueSizePerUser.toString(),
      WORKERS_PER_USER: this.scalingConfig.workersPerUser.toString(),
      CONCURRENCY_PER_WORKER: this.scalingConfig.concurrencyPerWorker.toString(),
      MEMORY_PER_WORKER: this.scalingConfig.memoryPerWorker.toString(),
      CPU_PER_WORKER: this.scalingConfig.cpuPerWorker.toString(),
      TOTAL_WORKERS: resources.totalWorkers.toString(),
      TOTAL_QUEUE_SIZE: resources.totalQueueSize.toString(),
      RECOMMENDED_INSTANCES: resources.recommendedInstances.toString(),
    };
  }

  /**
   * Validate scaling configuration
   */
  validateScalingConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { maxUsers, queueSizePerUser, workersPerUser, concurrencyPerWorker } = this.scalingConfig;

    if (maxUsers < 1) {
      errors.push('MAX_USERS must be at least 1');
    }

    if (maxUsers > 10000) {
      errors.push('MAX_USERS should not exceed 10000 for optimal performance');
    }

    if (queueSizePerUser < 1) {
      errors.push('QUEUE_SIZE_PER_USER must be at least 1');
    }

    if (workersPerUser < 0.01) {
      errors.push('WORKERS_PER_USER must be at least 0.01');
    }

    if (workersPerUser > 1) {
      errors.push('WORKERS_PER_USER should not exceed 1 for resource efficiency');
    }

    if (concurrencyPerWorker < 1) {
      errors.push('CONCURRENCY_PER_WORKER must be at least 1');
    }

    if (concurrencyPerWorker > 10) {
      errors.push('CONCURRENCY_PER_WORKER should not exceed 10 for stability');
    }

    // Check resource limits
    const resources = this.getSystemResourceAllocation();
    if (resources.memoryAllocation > 8192) { // 8GB
      errors.push('Total memory allocation exceeds 8GB limit');
    }

    if (resources.cpuAllocation > 16) { // 16 CPU cores
      errors.push('Total CPU allocation exceeds 16 cores limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const dynamicScalingManager = DynamicScalingManager.getInstance();
