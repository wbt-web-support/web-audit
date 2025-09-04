import { checkRedisHealth, getRedisClient } from '@/lib/redis/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Redis connection...');
    
    // Check if Redis is healthy
    const isHealthy = await checkRedisHealth();
    
    if (isHealthy) {
      console.log('Redis health check passed, testing operations...');
      
      // Test a simple operation
      const client = await getRedisClient();
      
      // Test SET operation
      await client.set('test_key', 'connection_works');
      
      // Test GET operation
      const value = await client.get('test_key');
      
      // Test INCR operation (for rate limiting)
      await client.set('test_counter', '0');
      await client.incr('test_counter');
      const counterValue = await client.get('test_counter');
      
      // Clean up test data
      await client.del('test_key');
      await client.del('test_counter');
      
      return NextResponse.json({
        status: 'connected',
        message: 'Redis is working properly',
        tests: {
          setGet: value === 'connection_works',
          increment: counterValue === '1',
          operations: 'All Redis operations working'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Redis health check failed');
      return NextResponse.json({
        status: 'disconnected',
        message: 'Redis health check failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Test rate limiting functionality
    const client = await getRedisClient();
    
    // Simulate rate limiting test
    const testUserId = 'test-user-123';
    const rateLimitKey = `rate_limit:${testUserId}:main`;
    
    // Set a test rate limit
    await client.setEx(rateLimitKey, 60, '5'); // 5 requests in 60 seconds
    
    // Get current count
    const currentCount = await client.get(rateLimitKey);
    
    // Test increment
    await client.incr(rateLimitKey);
    const newCount = await client.get(rateLimitKey);
    
    // Get TTL
    const ttl = await client.ttl(rateLimitKey);
    
    // Clean up
    await client.del(rateLimitKey);
    
    return NextResponse.json({
      status: 'success',
      message: 'Rate limiting test completed',
      test: {
        initialCount: currentCount,
        afterIncrement: newCount,
        ttl: ttl,
        rateLimitKey: rateLimitKey
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rate limiting test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Rate limiting test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
