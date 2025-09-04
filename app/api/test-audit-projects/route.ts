import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { AuditProject } from '@/lib/types/database';
import { ERROR_CODES, HTTP_STATUS, USER_TIERS, PERFORMANCE_THRESHOLDS } from '@/lib/config/api';
import { redisRateLimiter } from '@/lib/redis/rate-limiter';

// TEST VERSION - NO AUTHENTICATION REQUIRED
// This endpoint is for load testing only

// Helper function to get user tier (default to BASIC for now)
function getUserTier(userId: string): keyof typeof USER_TIERS {
  // TODO: Implement user tier detection from database/subscription
  // For now, return BASIC tier
  return 'BASIC';
}

// Performance monitoring helper
function logPerformanceMetrics(userId: string, operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  const performance = duration <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS.EXCELLENT ? 'EXCELLENT' :
                     duration <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS.GOOD ? 'GOOD' :
                     duration <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS.ACCEPTABLE ? 'ACCEPTABLE' : 'POOR';
  
  console.log(`Performance [${performance}]: ${operation} for user ${userId} took ${duration}ms`);
  
  if (duration > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS.POOR) {
    console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
  }
}

export async function GET() {
  const startTime = Date.now();
  let userId: string | undefined;
  
  try {
    const supabase = await createClient();
    
    // TEST MODE: Use a fixed test user ID instead of authentication
    userId = '00000000-0000-0000-0000-000000000001'; // Fixed test UUID

    const { data: projects, error } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2000); // Max projects per request

    if (error) {
      console.error('Database error in GET:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', code: ERROR_CODES.DB_ERROR }, 
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    logPerformanceMetrics(userId!, 'GET projects', startTime);
    
    // Get rate limit info from Redis
    const userTier = getUserTier(userId!);
    const rateLimitInfo = await redisRateLimiter.getRateLimitInfo(userId!, userTier);
    
    return NextResponse.json({ 
      projects: projects || [],
      count: projects?.length || 0,
      userTier,
      rateLimitInfo: {
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
        burstRemaining: rateLimitInfo.burstRemaining,
        burstResetTime: rateLimitInfo.burstResetTime
      },
      testMode: true,
      testUserId: userId
    });
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: ERROR_CODES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let supabase;
  let userId: string | undefined;
  
  try {
    // Check request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: ERROR_CODES.METHOD_NOT_ALLOWED },
        { status: HTTP_STATUS.METHOD_NOT_ALLOWED }
      );
    }

    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json', code: ERROR_CODES.INVALID_CONTENT_TYPE },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Basic payload size check (256MB limit)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 256 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Payload too large', code: ERROR_CODES.DATA_TOO_LARGE },
        { status: HTTP_STATUS.PAYLOAD_TOO_LARGE }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: ERROR_CODES.INVALID_JSON },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Create Supabase client
    supabase = await createClient();
    
    // TEST MODE: Use a fixed test user ID instead of authentication
    userId = '00000000-0000-0000-0000-000000000001'; // Fixed test UUID

    // Check Redis-based rate limiting
    const userTier = getUserTier(userId);
    const rateLimitCheck = await redisRateLimiter.checkRateLimit(userId, userTier);
    
    if (!rateLimitCheck.allowed) {
      const retryAfter = rateLimitCheck.retryAfter || rateLimitCheck.burstRetryAfter;
      const errorCode = rateLimitCheck.burstRetryAfter ? ERROR_CODES.BURST_LIMIT_EXCEEDED : ERROR_CODES.RATE_LIMIT_EXCEEDED;
      
      return NextResponse.json(
        { 
          error: rateLimitCheck.burstRetryAfter 
            ? 'Burst limit exceeded. Please slow down your requests.'
            : 'Rate limit exceeded. Please try again later.',
          code: errorCode,
          retryAfter,
          userTier,
          limits: USER_TIERS[userTier],
          remaining: rateLimitCheck.remaining || 0,
          testMode: true,
          testUserId: userId
        },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    }

    // Basic validation - detailed validation handled by database function
    if (!body.base_url || typeof body.base_url !== 'string') {
      return NextResponse.json(
        { 
          error: 'base_url is required and must be a string', 
          code: ERROR_CODES.VALIDATION_ERROR
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // User tier already obtained above for rate limiting
    
    // Prepare data for optimized database function
    const {
      base_url,
      crawlType = 'full',
      services = [],
      companyDetails = {},
      instructions = [],
      custom_urls = [],
      stripe_key_urls = []
    } = body;

    const {
      companyName,
      phoneNumber,
      email,
      address,
      customInfo
    } = companyDetails;

    // Single optimized database call using the new function
    const { data: result, error: dbError } = await supabase.rpc('create_audit_project_optimized', {
      p_user_id: userId,
      p_base_url: base_url.trim().toLowerCase(),
      p_crawl_type: crawlType,
      p_instructions: instructions.length > 0 ? instructions : null,
      p_services: services.length > 0 ? services : null,
      p_company_name: companyName?.trim() || null,
      p_phone_number: phoneNumber?.trim() || null,
      p_email: email?.trim() || null,
      p_address: address?.trim() || null,
      p_custom_info: customInfo?.trim() || null,
      p_custom_urls: custom_urls && Array.isArray(custom_urls) && custom_urls.filter((url: string) => url && url.trim()).length > 0 
        ? custom_urls.filter((url: string) => url && url.trim()) 
        : null,
      p_stripe_key_urls: stripe_key_urls && Array.isArray(stripe_key_urls) && stripe_key_urls.filter((url: string) => url && url.trim()).length > 0 
        ? stripe_key_urls.filter((url: string) => url && url.trim()) 
        : null,
      p_user_tier: userTier
    });

    if (dbError) {
      console.error('Database function error:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed', code: ERROR_CODES.DB_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Check if the function returned an error
    if (!result.success) {
      const errorCode = result.error_code;
      const statusCode = errorCode === 'DUPLICATE_URL' ? HTTP_STATUS.CONFLICT :
                        errorCode === 'TOO_MANY_PROJECTS' ? HTTP_STATUS.FORBIDDEN :
                        HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      return NextResponse.json(
        { 
          error: result.error,
          code: errorCode,
          ...(result.project_id && { projectId: result.project_id }),
          ...(result.current_count && { currentCount: result.current_count }),
          ...(result.max_allowed && { maxAllowed: result.max_allowed }),
          ...(result.user_tier && { userTier: result.user_tier }),
          testMode: true,
          testUserId: userId
        },
        { status: statusCode }
      );
    }

    const project = result.project;

    logPerformanceMetrics(userId!, 'POST project creation', startTime);

    // Get updated rate limit info from Redis
    const rateLimitInfo = await redisRateLimiter.getRateLimitInfo(userId, userTier);

    // Success response with enhanced information
    return NextResponse.json(
      { 
        project,
        message: 'Project created successfully',
        code: ERROR_CODES.SUCCESS,
        userTier,
        rateLimitInfo: {
          remaining: rateLimitInfo.remaining,
          resetTime: rateLimitInfo.resetTime,
          burstRemaining: rateLimitInfo.burstRemaining,
          burstResetTime: rateLimitInfo.burstResetTime
        },
        testMode: true,
        testUserId: userId
      },
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    console.error('Unexpected error in POST:', error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Database connection failed', code: ERROR_CODES.DB_CONNECTION_ERROR },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout', code: ERROR_CODES.REQUEST_TIMEOUT },
        { status: HTTP_STATUS.REQUEST_TIMEOUT }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: ERROR_CODES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
