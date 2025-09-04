import { createClient, RedisClientType } from 'redis';

// Redis client instance
let redisClient: RedisClientType | null = null;

// Redis configuration
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
  // Connection timeout
  connectTimeout: 10000,
  // Command timeout
  commandTimeout: 5000,
};

// Create Redis client
export async function createRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient(REDIS_CONFIG);
    
    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    redisClient.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
}

// Get Redis client (with connection check)
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    return await createRedisClient();
  }
  return redisClient;
}

// Close Redis connection
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Health check for Redis
export async function checkRedisHealth(): Promise<boolean> {
  try {
    console.log('Redis URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
    console.log('Redis URL (first 20 chars):', process.env.REDIS_URL?.substring(0, 20) + '...');
    
    const client = await getRedisClient();
    const pong = await client.ping();
    console.log('Redis PING response:', pong);
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set'
    });
    return false;
  }
}









