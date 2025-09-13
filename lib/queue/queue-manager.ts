import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getBullMQRedisConnection } from './redis-connection-bullmq';
import { getQueueConfig, QueueConfig } from './queue-config';
import { PLAN_HELPERS, USER_TIERS } from '@/lib/config/api';

export interface JobData {
  [key: string]: any;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  // Getter for queues (read-only access)
  get queueMap(): Map<string, Queue> {
    return this.queues;
  }

  async createQueue(queueName: string, processor?: (job: Job<JobData>) => Promise<JobResult>): Promise<Queue> {
    try {
      const config = await getQueueConfig(queueName);
      const redis = getBullMQRedisConnection();

      // Create queue
      const queue = new Queue(queueName, {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: config.retryAttempts,
          backoff: {
            type: 'exponential',
            delay: config.retryDelay,
          },
          delay: config.delayBetweenJobs,
        },
      });

      this.queues.set(queueName, queue);

      // Create worker if processor is provided
      if (processor) {
        await this.createWorker(queueName, processor, config);
      }

      // Create queue events for monitoring
      const queueEvents = new QueueEvents(queueName, { connection: redis });
      this.queueEvents.set(queueName, queueEvents);

      // Set up event listeners
      this.setupQueueEventListeners(queueName, queueEvents);

      console.log(`✅ Queue '${queueName}' created successfully`);
      return queue;
    } catch (error) {
      console.error(`❌ Error creating queue '${queueName}':`, error);
      throw error;
    }
  }

  async createWorker(
    queueName: string, 
    processor: (job: Job<JobData>) => Promise<JobResult>,
    config: QueueConfig
  ): Promise<Worker> {
    try {
      const redis = getBullMQRedisConnection();

      const worker = new Worker(
        queueName,
        async (job: Job<JobData>) => {
          const startTime = Date.now();
          console.log(`🔄 Processing job ${job.id} in queue '${queueName}'`);
          
          try {
            const result = await processor(job);
            const duration = Date.now() - startTime;
            
            console.log(`✅ Job ${job.id} completed in ${duration}ms`);
            return { ...result, duration };
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            console.error(`❌ Job ${job.id} failed after ${duration}ms:`, errorMessage);
            throw error;
          }
        },
        {
          connection: redis,
          concurrency: config.concurrency,
          limiter: {
            max: config.maxWorkers,
            duration: 60000, // 1 minute
          },
        }
      );

      // Set up worker event listeners
      this.setupWorkerEventListeners(queueName, worker);

      this.workers.set(queueName, worker);
      console.log(`✅ Worker for queue '${queueName}' created with concurrency ${config.concurrency}`);
      return worker;
    } catch (error) {
      console.error(`❌ Error creating worker for queue '${queueName}':`, error);
      throw error;
    }
  }

  private setupQueueEventListeners(queueName: string, queueEvents: QueueEvents): void {
    queueEvents.on('waiting', ({ jobId }) => {
      console.log(`⏳ Job ${jobId} is waiting in queue '${queueName}'`);
    });

    queueEvents.on('active', ({ jobId }) => {
      console.log(`🔄 Job ${jobId} is now active in queue '${queueName}'`);
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`✅ Job ${jobId} completed in queue '${queueName}'`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed in queue '${queueName}':`, failedReason);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ Job ${jobId} stalled in queue '${queueName}'`);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📊 Job ${jobId} progress in queue '${queueName}':`, data);
    });
  }

  private setupWorkerEventListeners(queueName: string, worker: Worker): void {
    worker.on('ready', () => {
      console.log(`✅ Worker for queue '${queueName}' is ready`);
    });

    worker.on('error', (error) => {
      console.error(`❌ Worker error in queue '${queueName}':`, error);
    });

    worker.on('completed', async (job) => {
      console.log(`✅ Job ${job.id} completed in queue '${queueName}'`);
      
      // Resume lower priority jobs when high priority job completes
      await this.resumeLowerPriorityJobs();
    });

    worker.on('failed', async (job, error) => {
      console.error(`❌ Worker job failed in queue '${queueName}':`, {
        jobId: job?.id,
        error: error.message
      });
      
      // Resume lower priority jobs even if high priority job fails
      await this.resumeLowerPriorityJobs();
    });

    worker.on('stalled', (jobId) => {
      console.warn(`⚠️ Worker job stalled in queue '${queueName}':`, jobId);
    });
  }

  async addJob(queueName: string, jobData: JobData, options?: any): Promise<Job<JobData>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const config = await getQueueConfig(queueName);
      
      // Check queue size before adding job
      const waiting = await queue.getWaiting();
      if (waiting.length >= config.maxQueueSize) {
        throw new Error(`Queue '${queueName}' is full (${config.maxQueueSize} jobs)`);
      }

      const job = await queue.add(queueName, jobData, {
        ...options,
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      console.log(`📝 Job ${job.id} added to queue '${queueName}'`);
      return job;
    } catch (error) {
      console.error(`❌ Error adding job to queue '${queueName}':`, error);
      throw error;
    }
  }

  async getQueueStats(queueName: string): Promise<any> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      };
    } catch (error) {
      console.error(`❌ Error getting stats for queue '${queueName}':`, error);
      throw error;
    }
  }

  async getAllQueueStats(): Promise<any[]> {
    const stats = [];
    for (const queueName of this.queues.keys()) {
      try {
        const queueStats = await this.getQueueStats(queueName);
        stats.push(queueStats);
      } catch (error) {
        console.error(`❌ Error getting stats for queue '${queueName}':`, error);
      }
    }
    return stats;
  }

  async pauseQueue(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.pause();
      console.log(`⏸️ Queue '${queueName}' paused`);
    } catch (error) {
      console.error(`❌ Error pausing queue '${queueName}':`, error);
      throw error;
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.resume();
      console.log(`▶️ Queue '${queueName}' resumed`);
    } catch (error) {
      console.error(`❌ Error resuming queue '${queueName}':`, error);
      throw error;
    }
  }

  async clearQueue(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.obliterate({ force: true });
      console.log(`🗑️ Queue '${queueName}' cleared`);
    } catch (error) {
      console.error(`❌ Error clearing queue '${queueName}':`, error);
      throw error;
    }
  }

  async closeQueue(queueName: string): Promise<void> {
    try {
      const worker = this.workers.get(queueName);
      if (worker) {
        await worker.close();
        this.workers.delete(queueName);
      }

      const queue = this.queues.get(queueName);
      if (queue) {
        await queue.close();
        this.queues.delete(queueName);
      }

      const queueEvents = this.queueEvents.get(queueName);
      if (queueEvents) {
        await queueEvents.close();
        this.queueEvents.delete(queueName);
      }

      console.log(`🔒 Queue '${queueName}' closed`);
    } catch (error) {
      console.error(`❌ Error closing queue '${queueName}':`, error);
      throw error;
    }
  }

  async closeAllQueues(): Promise<void> {
    const queueNames = Array.from(this.queues.keys());
    for (const queueName of queueNames) {
      await this.closeQueue(queueName);
    }
    console.log('🔒 All queues closed');
  }

  /**
   * Add job to priority-based queue with automatic lower priority job pausing
   */
  async addPriorityJob(
    planUniqName: string,
    queueName: string,
    jobData: JobData,
    options?: any
  ): Promise<Job<JobData>> {
    const priority = PLAN_HELPERS.getPriorityFromPlan(planUniqName);
    const tierConfig = PLAN_HELPERS.getTierConfig(planUniqName);
    const priorityQueueName = PLAN_HELPERS.getQueueNameByPriority(priority);
    
    // Use the priority-specific queue name
    const queue = this.queues.get(priorityQueueName) || this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Priority queue '${priorityQueueName}' not found`);
    }

    // Set job priority based on plan
    const jobOptions = {
      priority: priority === 1 ? 10 : priority === 2 ? 5 : 1, // Higher number = higher priority
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...options,
    };

    console.log(`[PRIORITY QUEUE] Adding job to ${priorityQueueName} with priority ${jobOptions.priority} for plan ${planUniqName}`);
    
    // Pause lower priority jobs when higher priority job arrives
    await this.pauseLowerPriorityJobs(priority);
    
    return await queue.add(queueName, jobData, jobOptions);
  }

  /**
   * Pause lower priority jobs when higher priority job arrives
   */
  async pauseLowerPriorityJobs(currentPriority: number): Promise<void> {
    try {
      // Pause jobs in lower priority queues
      if (currentPriority === 1) { // Enterprise - pause Pro and Free
        await this.pauseQueueJobs('pro-queue');
        await this.pauseQueueJobs('free-queue');
        console.log(`[PRIORITY PAUSE] Enterprise job arrived - paused Pro and Free queue jobs`);
      } else if (currentPriority === 2) { // Pro - pause Free only
        await this.pauseQueueJobs('free-queue');
        console.log(`[PRIORITY PAUSE] Pro job arrived - paused Free queue jobs`);
      }
      // Free priority (3) doesn't pause anything
    } catch (error) {
      console.error('[PRIORITY PAUSE] Error pausing lower priority jobs:', error);
    }
  }

  /**
   * Pause all active jobs in a specific queue
   */
  async pauseQueueJobs(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return;

      // Get all active jobs in the queue
      const activeJobs = await queue.getActive();
      
      for (const job of activeJobs) {
        try {
          // Pause the job (this will stop processing but keep it in the queue)
          await job.updateProgress(0);
          console.log(`[JOB PAUSED] Paused job ${job.id} in queue ${queueName}`);
        } catch (jobError) {
          console.error(`[JOB PAUSE ERROR] Failed to pause job ${job.id}:`, jobError);
        }
      }
    } catch (error) {
      console.error(`[QUEUE PAUSE ERROR] Failed to pause jobs in queue ${queueName}:`, error);
    }
  }

  /**
   * Resume lower priority jobs when higher priority jobs complete
   */
  async resumeLowerPriorityJobs(): Promise<void> {
    try {
      // Check if there are any high priority jobs running
      const enterpriseActive = await this.getQueueStats('enterprise-queue');
      const proActive = await this.getQueueStats('pro-queue');
      
      // Only resume if no higher priority jobs are active
      if (enterpriseActive.active === 0) {
        if (proActive.active === 0) {
          // No Enterprise or Pro jobs - resume Free jobs
          await this.resumeQueueJobs('free-queue');
          console.log(`[PRIORITY RESUME] No high priority jobs - resumed Free queue jobs`);
        } else {
          // Only Pro jobs running - resume Free jobs
          await this.resumeQueueJobs('free-queue');
          console.log(`[PRIORITY RESUME] Only Pro jobs running - resumed Free queue jobs`);
        }
      }
      // If Enterprise jobs are running, don't resume anything
    } catch (error) {
      console.error('[PRIORITY RESUME] Error resuming lower priority jobs:', error);
    }
  }

  /**
   * Resume all paused jobs in a specific queue
   */
  async resumeQueueJobs(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return;

      // Get all waiting jobs in the queue
      const waitingJobs = await queue.getWaiting();
      
      for (const job of waitingJobs) {
        try {
          // Jobs will automatically resume when workers are available
          console.log(`[JOB RESUME] Job ${job.id} in queue ${queueName} will resume when workers available`);
        } catch (jobError) {
          console.error(`[JOB RESUME ERROR] Failed to resume job ${job.id}:`, jobError);
        }
      }
    } catch (error) {
      console.error(`[QUEUE RESUME ERROR] Failed to resume jobs in queue ${queueName}:`, error);
    }
  }

  /**
   * Create priority-based worker with plan-specific concurrency
   */
  async createPriorityWorker(
    planUniqName: string,
    queueName: string,
    processor: (job: Job<JobData>) => Promise<JobResult>,
    config?: Partial<QueueConfig>
  ): Promise<Worker> {
    const priority = PLAN_HELPERS.getPriorityFromPlan(planUniqName);
    const tierConfig = PLAN_HELPERS.getTierConfig(planUniqName);
    const priorityQueueName = PLAN_HELPERS.getQueueNameByPriority(priority);
    const concurrency = PLAN_HELPERS.getWorkerConcurrency(planUniqName);
    
    // Merge with default config
    const defaultConfig = await getQueueConfig(priorityQueueName);
    const workerConfig: QueueConfig = {
      ...defaultConfig,
      concurrency: concurrency,
      maxWorkers: tierConfig.CONCURRENT_ANALYSES,
      ...config,
    };

    console.log(`[PRIORITY WORKER] Creating worker for ${priorityQueueName} with concurrency ${concurrency} for plan ${planUniqName}`);
    
    return await this.createWorker(priorityQueueName, processor, workerConfig);
  }

  /**
   * Get priority-based queue statistics
   */
  async getPriorityQueueStats(): Promise<{
    enterprise: any;
    pro: any;
    free: any;
    total: any;
  }> {
    const enterpriseStats = await this.getQueueStats('enterprise-queue').catch(() => ({ waiting: 0, active: 0, completed: 0, failed: 0, total: 0 }));
    const proStats = await this.getQueueStats('pro-queue').catch(() => ({ waiting: 0, active: 0, completed: 0, failed: 0, total: 0 }));
    const freeStats = await this.getQueueStats('free-queue').catch(() => ({ waiting: 0, active: 0, completed: 0, failed: 0, total: 0 }));

    return {
      enterprise: enterpriseStats,
      pro: proStats,
      free: freeStats,
      total: {
        waiting: enterpriseStats.waiting + proStats.waiting + freeStats.waiting,
        active: enterpriseStats.active + proStats.active + freeStats.active,
        completed: enterpriseStats.completed + proStats.completed + freeStats.completed,
        failed: enterpriseStats.failed + proStats.failed + freeStats.failed,
        total: enterpriseStats.total + proStats.total + freeStats.total,
      }
    };
  }
}

// Global queue manager instance
export const queueManager = new QueueManager();
