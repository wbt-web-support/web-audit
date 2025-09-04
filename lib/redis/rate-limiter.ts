import { getRedisClient } from './client';
import { USER_TIERS } from '@/lib/config/api';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60 * 1000, // 1 minute
  BURST_WINDOW_MS: 10 * 1000, // 10 seconds
  CLEANUP_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes
};

// Rate limit result interface
interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  burstRetryAfter?: number;
  remaining?: number;
  resetTime?: number;
}

// Redis-based rate limiting
export class RedisRateLimiter {
  private static instance: RedisRateLimiter;
  
  private constructor() {}
  
  public static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
  }

  // Check rate limit for user
  async checkRateLimit(userId: string, userTier: keyof typeof USER_TIERS = 'BASIC'): Promise<RateLimitResult> {
    try {
      const client = await getRedisClient();
      const now = Date.now();
      const tierConfig = USER_TIERS[userTier];
      
      // Redis keys
      const mainKey = `rate_limit:${userId}:main`;
      const burstKey = `rate_limit:${userId}:burst`;
      
      // Use Redis pipeline for atomic operations
      const pipeline = client.multi();
      
      // Get current counts
      pipeline.get(mainKey);
      pipeline.get(burstKey);
      pipeline.ttl(mainKey);
      pipeline.ttl(burstKey);
      
      const results = await pipeline.exec();
      
      if (!results || results.some((result: any) => result[0] !== null)) {
        // Pipeline failed, fallback to individual commands
        return await this.fallbackRateLimit(userId, userTier);
      }
      
      const mainCount = parseInt((results[0] as any)[1] as string) || 0;
      const burstCount = parseInt((results[1] as any)[1] as string) || 0;
      const mainTtl = (results[2] as any)[1] as number;
      const burstTtl = (results[3] as any)[1] as number;
      
      // Check burst limit (first 10 seconds)
      if (burstTtl > 0 && burstCount >= tierConfig.BURST_LIMIT) {
        return {
          allowed: false,
          burstRetryAfter: burstTtl,
          remaining: 0
        };
      }
      
      // Check main rate limit
      if (mainTtl > 0 && mainCount >= tierConfig.MAX_REQUESTS_PER_WINDOW) {
        return {
          allowed: false,
          retryAfter: mainTtl,
          remaining: 0
        };
      }
      
      // Increment counters
      const newPipeline = client.multi();
      
      if (burstTtl <= 0) {
        // Reset burst counter
        newPipeline.setEx(burstKey, Math.ceil(RATE_LIMIT_CONFIG.BURST_WINDOW_MS / 1000), '1');
      } else {
        newPipeline.incr(burstKey);
      }
      
      if (mainTtl <= 0) {
        // Reset main counter
        newPipeline.setEx(mainKey, Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000), '1');
      } else {
        newPipeline.incr(mainKey);
      }
      
      await newPipeline.exec();
      
      return {
        allowed: true,
        remaining: tierConfig.MAX_REQUESTS_PER_WINDOW - (mainCount + 1),
        resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS
      };
      
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to allowing the request if Redis fails
      return { allowed: true };
    }
  }

  // Fallback rate limiting (if Redis fails)
  private async fallbackRateLimit(userId: string, userTier: keyof typeof USER_TIERS): Promise<RateLimitResult> {
    console.warn('Redis rate limiting failed, using fallback');
    return { allowed: true };
  }

  // Get rate limit info for user
  async getRateLimitInfo(userId: string, userTier: keyof typeof USER_TIERS = 'BASIC'): Promise<{
    remaining: number;
    resetTime: number;
    burstRemaining: number;
    burstResetTime: number;
  }> {
    try {
      const client = await getRedisClient();
      const tierConfig = USER_TIERS[userTier];
      
      const mainKey = `rate_limit:${userId}:main`;
      const burstKey = `rate_limit:${userId}:burst`;
      
      const [mainCount, burstCount, mainTtl, burstTtl] = await Promise.all([
        client.get(mainKey),
        client.get(burstKey),
        client.ttl(mainKey),
        client.ttl(burstKey)
      ]);
      
      const now = Date.now();
      
      return {
        remaining: Math.max(0, tierConfig.MAX_REQUESTS_PER_WINDOW - (parseInt(mainCount || '0'))),
        resetTime: mainTtl > 0 ? now + (mainTtl * 1000) : now + RATE_LIMIT_CONFIG.WINDOW_MS,
        burstRemaining: Math.max(0, tierConfig.BURST_LIMIT - (parseInt(burstCount || '0'))),
        burstResetTime: burstTtl > 0 ? now + (burstTtl * 1000) : now + RATE_LIMIT_CONFIG.BURST_WINDOW_MS
      };
      
    } catch (error) {
      console.error('Error getting rate limit info:', error);
      return {
        remaining: USER_TIERS[userTier].MAX_REQUESTS_PER_WINDOW,
        resetTime: Date.now() + RATE_LIMIT_CONFIG.WINDOW_MS,
        burstRemaining: USER_TIERS[userTier].BURST_LIMIT,
        burstResetTime: Date.now() + RATE_LIMIT_CONFIG.BURST_WINDOW_MS
      };
    }
  }
}

// Export singleton instance
export const redisRateLimiter = RedisRateLimiter.getInstance();