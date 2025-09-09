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
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: false,
        maxLoadingTimeout: 10000,
        // Connection pool settings
        family: 4, // IPv4
        // Error handling
        onError: (error: Error) => {
          console.error('Redis connection error:', error);
        },
        onConnect: () => {
          console.log('✅ Redis connected successfully');
        },
        onReady: () => {
          console.log('✅ Redis ready for operations');
        },
        onClose: () => {
          console.log('⚠️ Redis connection closed');
        },
        onReconnecting: () => {
          console.log('🔄 Redis reconnecting...');
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
