import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getRedisConnection } from './redis-connection';
import { getQueueConfig, QueueConfig } from './queue-config';

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
      const redis = getRedisConnection();

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
      const redis = getRedisConnection();

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

    worker.on('failed', (job, error) => {
      console.error(`❌ Worker job failed in queue '${queueName}':`, {
        jobId: job?.id,
        error: error.message
      });
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
}

// Global queue manager instance
export const queueManager = new QueueManager();
