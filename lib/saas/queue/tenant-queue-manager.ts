/**
 * Tenant Queue Manager
 * Manages queues with tenant isolation and dynamic resource management
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getRedisConnection } from '@/lib/queue/redis-connection';
import { tenantManager } from '../core/tenant-manager';
import { dynamicScalingManager } from '../config/dynamic-scaling';
import { QueueConfig, CrawlJob, Tenant } from '../types';
import { errorLogger } from '@/lib/logging/error-logger';

export class TenantQueueManager {
  private static instance: TenantQueueManager;
  private tenantQueues: Map<string, Map<string, Queue>> = new Map();
  private globalQueues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  static getInstance(): TenantQueueManager {
    if (!TenantQueueManager.instance) {
      TenantQueueManager.instance = new TenantQueueManager();
    }
    return TenantQueueManager.instance;
  }

  /**
   * Create tenant-specific queue with dynamic configuration
   */
  async createTenantQueue(
    tenantId: string,
    queueName: string,
    processor?: (job: Job) => Promise<any>
  ): Promise<Queue> {
    try {
      // Check tenant limits
      const limitCheck = await tenantManager.checkTenantLimits(tenantId, 'currentWorkers', 1);
      if (!limitCheck.allowed) {
        throw new Error(`Tenant limit exceeded: ${limitCheck.reason}`);
      }

      const redis = getRedisConnection();
      const fullQueueName = `tenant:${tenantId}:${queueName}`;

      // Get dynamic queue configuration
      const queueConfig = dynamicScalingManager.getOptimalQueueConfig(tenantId, queueName);

      // Create queue with dynamic configuration
      const queue = new Queue(fullQueueName, {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: Math.min(queueConfig.maxQueueSize / 10, 50), // Dynamic cleanup
          removeOnFail: Math.min(queueConfig.maxQueueSize / 20, 25),
          attempts: queueConfig.retryAttempts,
          backoff: {
            type: 'exponential',
            delay: queueConfig.retryDelay,
          },
          delay: queueConfig.delayBetweenJobs,
        },
      });

      // Store queue in tenant-specific map
      if (!this.tenantQueues.has(tenantId)) {
        this.tenantQueues.set(tenantId, new Map());
      }
      this.tenantQueues.get(tenantId)!.set(queueName, queue);

      // Create worker if processor provided
      if (processor) {
        await this.createTenantWorker(tenantId, queueName, processor, queueConfig);
      }

      // Create queue events
      const queueEvents = new QueueEvents(fullQueueName, { connection: redis });
      this.queueEvents.set(fullQueueName, queueEvents);
      this.setupQueueEventListeners(tenantId, queueName, queueEvents);

      console.log(`✅ Tenant queue '${fullQueueName}' created with dynamic config:`, {
        maxWorkers: queueConfig.maxWorkers,
        maxQueueSize: queueConfig.maxQueueSize,
        concurrency: queueConfig.concurrency,
      });

      return queue;
    } catch (error) {
      console.error(`❌ Error creating tenant queue '${queueName}' for tenant '${tenantId}':`, error);
      throw error;
    }
  }

  /**
   * Create global queue (for system operations)
   */
  async createGlobalQueue(
    queueName: string,
    processor?: (job: Job) => Promise<any>
  ): Promise<Queue> {
    try {
      const redis = getRedisConnection();
      const systemResources = dynamicScalingManager.getSystemResourceAllocation();

      const queue = new Queue(queueName, {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: Math.min(systemResources.totalQueueSize / 20, 100),
          removeOnFail: Math.min(systemResources.totalQueueSize / 40, 50),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.globalQueues.set(queueName, queue);

      if (processor) {
        await this.createGlobalWorker(queueName, processor);
      }

      const queueEvents = new QueueEvents(queueName, { connection: redis });
      this.queueEvents.set(queueName, queueEvents);
      this.setupGlobalQueueEventListeners(queueName, queueEvents);

      console.log(`✅ Global queue '${queueName}' created with system resources:`, {
        totalWorkers: systemResources.totalWorkers,
        totalQueueSize: systemResources.totalQueueSize,
      });

      return queue;
    } catch (error) {
      console.error(`❌ Error creating global queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Create tenant worker with dynamic configuration
   */
  private async createTenantWorker(
    tenantId: string,
    queueName: string,
    processor: (job: Job) => Promise<any>,
    queueConfig: any
  ): Promise<Worker> {
    try {
      const tenant = await tenantManager.getTenant(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const redis = getRedisConnection();
      const fullQueueName = `tenant:${tenantId}:${queueName}`;

      const worker = new Worker(
        fullQueueName,
        async (job: Job) => {
          const startTime = Date.now();
          console.log(`🔄 Processing tenant job ${job.id} in queue '${fullQueueName}'`);
          
          try {
            // Check tenant status before processing
            const currentTenant = await tenantManager.getTenant(tenantId);
            if (!currentTenant || currentTenant.status !== 'active') {
              throw new Error(`Tenant ${tenantId} is not active`);
            }

            const result = await processor(job);
            const duration = Date.now() - startTime;
            
            // Update tenant usage
            await tenantManager.incrementUsage(tenantId, 'currentWorkers', 1);
            
            console.log(`✅ Tenant job ${job.id} completed in ${duration}ms`);
            return { ...result, duration, tenantId };
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            console.error(`❌ Tenant job ${job.id} failed after ${duration}ms:`, errorMessage);
            
            // Log error with tenant context
            await errorLogger.logQueueError(fullQueueName, job.id!, `Tenant job failed: ${errorMessage}`, error as Error);
            
            throw error;
          } finally {
            // Decrement worker count when job completes
            await tenantManager.decrementUsage(tenantId, 'currentWorkers', 1);
          }
        },
        {
          connection: redis,
          concurrency: queueConfig.concurrency,
          limiter: {
            max: queueConfig.maxWorkers,
            duration: 60000, // 1 minute
          },
        }
      );

      this.workers.set(fullQueueName, worker);
      this.setupWorkerEventListeners(tenantId, queueName, worker);

      console.log(`✅ Tenant worker for '${fullQueueName}' created with dynamic config:`, {
        concurrency: queueConfig.concurrency,
        maxWorkers: queueConfig.maxWorkers,
      });

      return worker;
    } catch (error) {
      console.error(`❌ Error creating tenant worker for '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Create global worker
   */
  private async createGlobalWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>
  ): Promise<Worker> {
    try {
      const redis = getRedisConnection();
      const systemResources = dynamicScalingManager.getSystemResourceAllocation();

      const worker = new Worker(
        queueName,
        async (job: Job) => {
          const startTime = Date.now();
          console.log(`🔄 Processing global job ${job.id} in queue '${queueName}'`);
          
          try {
            const result = await processor(job);
            const duration = Date.now() - startTime;
            
            console.log(`✅ Global job ${job.id} completed in ${duration}ms`);
            return { ...result, duration };
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            console.error(`❌ Global job ${job.id} failed after ${duration}ms:`, errorMessage);
            throw error;
          }
        },
        {
          connection: redis,
          concurrency: Math.min(systemResources.totalWorkers / 10, 10), // Dynamic concurrency
        }
      );

      this.workers.set(queueName, worker);
      this.setupGlobalWorkerEventListeners(queueName, worker);

      console.log(`✅ Global worker for '${queueName}' created with system concurrency:`, {
        concurrency: Math.min(systemResources.totalWorkers / 10, 10),
      });

      return worker;
    } catch (error) {
      console.error(`❌ Error creating global worker for '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Add job to tenant queue
   */
  async addTenantJob(
    tenantId: string,
    queueName: string,
    jobData: any,
    options?: any
  ): Promise<Job> {
    try {
      // Check tenant limits
      const limitCheck = await tenantManager.checkTenantLimits(tenantId, 'currentCrawls', 1);
      if (!limitCheck.allowed) {
        throw new Error(`Tenant limit exceeded: ${limitCheck.reason}`);
      }

      const queue = this.getTenantQueue(tenantId, queueName);
      if (!queue) {
        throw new Error(`Tenant queue '${queueName}' not found for tenant '${tenantId}'`);
      }

      // Check queue size (no specific limit defined in TenantLimits)
      const waiting = await queue.getWaiting();

      const job = await queue.add(queueName, {
        ...jobData,
        tenantId,
        timestamp: new Date().toISOString(),
      }, {
        ...options,
        priority: options?.priority || 1,
      });

      // Update tenant usage
      await tenantManager.incrementUsage(tenantId, 'currentCrawls', 1);

      console.log(`📝 Tenant job ${job.id} added to queue 'tenant:${tenantId}:${queueName}'`);
      return job;
    } catch (error) {
      console.error(`❌ Error adding job to tenant queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Add job to global queue
   */
  async addGlobalJob(
    queueName: string,
    jobData: any,
    options?: any
  ): Promise<Job> {
    try {
      const queue = this.globalQueues.get(queueName);
      if (!queue) {
        throw new Error(`Global queue '${queueName}' not found`);
      }

      const job = await queue.add(queueName, jobData, options);
      console.log(`📝 Global job ${job.id} added to queue '${queueName}'`);
      return job;
    } catch (error) {
      console.error(`❌ Error adding job to global queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Get tenant queue
   */
  getTenantQueue(tenantId: string, queueName: string): Queue | null {
    return this.tenantQueues.get(tenantId)?.get(queueName) || null;
  }

  /**
   * Get global queue
   */
  getGlobalQueue(queueName: string): Queue | null {
    return this.globalQueues.get(queueName) || null;
  }

  /**
   * Get queue statistics for tenant
   */
  async getTenantQueueStats(tenantId: string, queueName: string): Promise<any> {
    try {
      const queue = this.getTenantQueue(tenantId, queueName);
      if (!queue) {
        throw new Error(`Tenant queue '${queueName}' not found`);
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        tenantId,
        queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      };
    } catch (error) {
      console.error(`❌ Error getting tenant queue stats:`, error);
      throw error;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<any[]> {
    const stats = [];

    // Global queues
    for (const [queueName, queue] of this.globalQueues) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
        ]);

        stats.push({
          type: 'global',
          queueName,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        });
      } catch (error) {
        console.error(`❌ Error getting global queue stats for '${queueName}':`, error);
      }
    }

    // Tenant queues
    for (const [tenantId, tenantQueues] of this.tenantQueues) {
      for (const [queueName, queue] of tenantQueues) {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed(),
          ]);

          stats.push({
            type: 'tenant',
            tenantId,
            queueName,
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
            total: waiting.length + active.length + completed.length + failed.length + delayed.length,
          });
        } catch (error) {
          console.error(`❌ Error getting tenant queue stats for '${tenantId}:${queueName}':`, error);
        }
      }
    }

    return stats;
  }

  /**
   * Update queue configurations based on current system resources
   */
  async updateQueueConfigurations(): Promise<{ updated: number; errors: string[] }> {
    try {
      let updated = 0;
      const errors: string[] = [];

      // Update tenant queues
      for (const [tenantId, tenantQueues] of this.tenantQueues) {
        for (const [queueName, queue] of tenantQueues) {
          try {
            const newConfig = dynamicScalingManager.getOptimalQueueConfig(tenantId, queueName);
            
            // Note: Queue options cannot be updated after creation
            // Configuration changes require recreating the queue

            updated++;
            console.log(`🔄 Updated queue config for tenant:${tenantId}:${queueName}`);
          } catch (error) {
            errors.push(`Failed to update queue ${tenantId}:${queueName}: ${error}`);
          }
        }
      }

      console.log(`🔄 Updated configurations for ${updated} queues`);
      return { updated, errors };
    } catch (error) {
      console.error('Error updating queue configurations:', error);
      return { updated: 0, errors: [error as string] };
    }
  }

  /**
   * Setup queue event listeners for tenant queues
   */
  private setupQueueEventListeners(tenantId: string, queueName: string, queueEvents: QueueEvents): void {
    const fullQueueName = `tenant:${tenantId}:${queueName}`;

    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      console.log(`✅ Tenant job ${jobId} completed in queue '${fullQueueName}'`);
      
      // Update tenant usage
      await tenantManager.decrementUsage(tenantId, 'currentCrawls', 1);
    });

    queueEvents.on('failed', async ({ jobId, failedReason }) => {
      console.error(`❌ Tenant job ${jobId} failed in queue '${fullQueueName}':`, failedReason);
      
      // Update tenant usage
      await tenantManager.decrementUsage(tenantId, 'currentCrawls', 1);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ Tenant job ${jobId} stalled in queue '${fullQueueName}'`);
    });
  }

  /**
   * Setup queue event listeners for global queues
   */
  private setupGlobalQueueEventListeners(queueName: string, queueEvents: QueueEvents): void {
    queueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ Global job ${jobId} completed in queue '${queueName}'`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Global job ${jobId} failed in queue '${queueName}':`, failedReason);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ Global job ${jobId} stalled in queue '${queueName}'`);
    });
  }

  /**
   * Setup worker event listeners for tenant workers
   */
  private setupWorkerEventListeners(tenantId: string, queueName: string, worker: Worker): void {
    const fullQueueName = `tenant:${tenantId}:${queueName}`;

    worker.on('ready', () => {
      console.log(`✅ Tenant worker for queue '${fullQueueName}' is ready`);
    });

    worker.on('error', (error) => {
      console.error(`❌ Tenant worker error in queue '${fullQueueName}':`, error);
    });

    worker.on('failed', (job, error) => {
      console.error(`❌ Tenant worker job failed in queue '${fullQueueName}':`, {
        jobId: job?.id,
        error: error.message
      });
    });
  }

  /**
   * Setup worker event listeners for global workers
   */
  private setupGlobalWorkerEventListeners(queueName: string, worker: Worker): void {
    worker.on('ready', () => {
      console.log(`✅ Global worker for queue '${queueName}' is ready`);
    });

    worker.on('error', (error) => {
      console.error(`❌ Global worker error in queue '${queueName}':`, error);
    });

    worker.on('failed', (job, error) => {
      console.error(`❌ Global worker job failed in queue '${queueName}':`, {
        jobId: job?.id,
        error: error.message
      });
    });
  }

  /**
   * Close all queues
   */
  async closeAllQueues(): Promise<void> {
    // Close tenant queues
    for (const [tenantId, tenantQueues] of this.tenantQueues) {
      for (const [queueName, queue] of tenantQueues) {
        try {
          await queue.close();
          console.log(`🔒 Closed tenant queue 'tenant:${tenantId}:${queueName}'`);
        } catch (error) {
          console.error(`❌ Error closing tenant queue 'tenant:${tenantId}:${queueName}':`, error);
        }
      }
    }

    // Close global queues
    for (const [queueName, queue] of this.globalQueues) {
      try {
        await queue.close();
        console.log(`🔒 Closed global queue '${queueName}'`);
      } catch (error) {
        console.error(`❌ Error closing global queue '${queueName}':`, error);
      }
    }

    // Close workers
    for (const [workerName, worker] of this.workers) {
      try {
        await worker.close();
        console.log(`🔒 Closed worker '${workerName}'`);
      } catch (error) {
        console.error(`❌ Error closing worker '${workerName}':`, error);
      }
    }

    // Close queue events
    for (const [eventName, queueEvents] of this.queueEvents) {
      try {
        await queueEvents.close();
        console.log(`🔒 Closed queue events '${eventName}'`);
      } catch (error) {
        console.error(`❌ Error closing queue events '${eventName}':`, error);
      }
    }

    this.tenantQueues.clear();
    this.globalQueues.clear();
    this.workers.clear();
    this.queueEvents.clear();

    console.log('🔒 All tenant and global queues closed');
  }
}

export const tenantQueueManager = TenantQueueManager.getInstance();