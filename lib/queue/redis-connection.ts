import { Redis } from 'ioredis';

let redis: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    try {
            redis = new Redis(redisUrl, {
              maxRetriesPerRequest: null, // Required by BullMQ for workers
              lazyConnect: true,
              keepAlive: 30000,
              connectTimeout: 30000, // Increased for slow connections
              commandTimeout: 15000, // Increased for slow Redis
              enableOfflineQueue: false,
              family: 4, // IPv4
              tls: {
                rejectUnauthorized: false // Allow self-signed certificates
              }
            });

      // Test connection
      redis.ping().then(() => {
        console.log('✅ Redis ping successful');
      }).catch((error) => {
        console.error('❌ Redis ping failed:', error);
      });

    } catch (error) {
      console.error('❌ Failed to create Redis connection:', error);
      throw error;
    }
  }

  return redis;
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
    }
  }
}

// Health check function
export async function checkRedisHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    const redis = getRedisConnection();
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
