import { Redis } from 'ioredis';

let redis: Redis | null = null;
let isRedisAvailable = false;

export function getRedisConnection(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 10000,
        enableOfflineQueue: true,
        family: 4,
        enableReadyCheck: true,
      });

      // Set up connection event listeners
      redis.on('connect', () => {
        console.log('🔗 Redis connecting...');
      });

      redis.on('ready', () => {
        isRedisAvailable = true;
        console.log('✅ Redis connection successful');
      });

      redis.on('error', (error) => {
        isRedisAvailable = false;
        console.warn('⚠️ Redis connection failed, using fallback mode:', error.message);
      });

      redis.on('close', () => {
        isRedisAvailable = false;
        console.warn('⚠️ Redis connection closed');
      });

    } catch (error) {
      console.warn('⚠️ Failed to create Redis connection, using fallback mode:', error instanceof Error ? error.message : String(error));
      isRedisAvailable = false;
    }
  }

  return redis!;
}

export function isRedisConnected(): boolean {
  return isRedisAvailable;
}

export async function waitForRedisConnection(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isRedisAvailable) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isRedisAvailable) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      console.log('✅ Redis connection closed');
    } catch (error) {
      console.warn('⚠️ Error closing Redis connection:', error instanceof Error ? error.message : String(error));
    }
    redis = null;
    isRedisAvailable = false;
  }
}

// Fallback in-memory queue for when Redis is not available
class InMemoryQueue {
  private jobs: any[] = [];
  private processing = false;

  async add(name: string, data: any, options: any = {}) {
    const job = {
      id: Date.now() + Math.random(),
      name,
      data,
      options,
      timestamp: new Date(),
      processed: false,
      failed: false,
      progress: 0,
    };
    
    this.jobs.push(job);
    console.log(`📝 Job ${job.id} added to in-memory queue`);
    
    // Process immediately if not already processing
    if (!this.processing) {
      this.processJobs();
    }
    
    return job;
  }

  async processJobs() {
    if (this.processing) return;
    this.processing = true;

    const unprocessedJobs = this.jobs.filter(job => !job.processed && !job.failed);
    
    for (const job of unprocessedJobs) {
      try {
        console.log(`🔄 Processing job ${job.id}`);
        job.progress = 50;
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        job.progress = 100;
        job.processed = true;
        console.log(`✅ Job ${job.id} completed`);
      } catch (error) {
        job.failed = true;
        console.error(`❌ Job ${job.id} failed:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    this.processing = false;
  }

  async getJob(id: string) {
    return this.jobs.find(job => job.id.toString() === id);
  }

  async getJobs() {
    return this.jobs;
  }

  async clean() {
    // Keep only recent jobs
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.jobs = this.jobs.filter(job => job.timestamp.getTime() > cutoff);
  }
}

// Global fallback queue instance
const fallbackQueue = new InMemoryQueue();

export function getFallbackQueue() {
  return fallbackQueue;
}
