import { Redis } from 'ioredis';

let redis: Redis | null = null;

export function getBullMQRedisConnection(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    try {
      // BullMQ requires specific Redis configuration
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 30000, // Increased from 10s to 30s for slow connections
        commandTimeout: 15000, // Increased from 5s to 15s for slow Redis
        enableOfflineQueue: false,
        family: 4, // IPv4
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      // Test connection
      redis.ping().then(() => {
        console.log('✅ BullMQ Redis connection successful');
      }).catch((error) => {
        console.error('❌ BullMQ Redis connection failed:', error);
      });

    } catch (error) {
      console.error('❌ Failed to create BullMQ Redis connection:', error);
      throw error;
    }
  }

  return redis;
}

export async function closeBullMQRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      console.log('✅ BullMQ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing BullMQ Redis connection:', error);
    }
  }
}
