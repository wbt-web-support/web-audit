import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { AuditProject } from '@/lib/types/database';
import { API_CONFIG, ERROR_CODES, HTTP_STATUS, USER_TIERS, PERFORMANCE_THRESHOLDS } from '@/lib/config/api';

// Enhanced rate limiting store with burst support and user tiers
interface RateLimitData {
  count: number;
  burstCount: number;
  resetTime: number;
  burstResetTime: number;
  lastRequestTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

// Cleanup old rate limit entries every 2 minutes for better memory management
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime && now > data.burstResetTime) {
      rateLimitStore.delete(userId);
    }
  }
}, API_CONFIG.RATE_LIMIT.CLEANUP_INTERVAL_MS);

// Helper function to get user tier (default to BASIC for now)
function getUserTier(userId: string): keyof typeof USER_TIERS {
  // TODO: Implement user tier detection from database/subscription
  // For now, return BASIC tier
  return 'BASIC';
}

// Enhanced rate limiting with burst support and user tiers
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number; burstRetryAfter?: number } {
  const now = Date.now();
  const userTier = getUserTier(userId);
  const tierConfig = USER_TIERS[userTier];
  
  let userLimit = rateLimitStore.get(userId);
  
  if (!userLimit) {
    userLimit = {
      count: 1,
      burstCount: 1,
      resetTime: now + API_CONFIG.RATE_LIMIT.WINDOW_MS,
      burstResetTime: now + API_CONFIG.RATE_LIMIT.BURST_WINDOW_MS,
      lastRequestTime: now
    };
    rateLimitStore.set(userId, userLimit);
    return { allowed: true };
  }
  
  // Check burst limit (first 10 seconds)
  if (now <= userLimit.burstResetTime) {
    if (userLimit.burstCount >= tierConfig.BURST_LIMIT) {
      return { 
        allowed: false, 
        burstRetryAfter: Math.ceil((userLimit.burstResetTime - now) / 1000)
      };
    }
    userLimit.burstCount++;
  } else {
    // Reset burst counter for new window
    userLimit.burstResetTime = now + API_CONFIG.RATE_LIMIT.BURST_WINDOW_MS;
    userLimit.burstCount = 1;
  }
  
  // Check main rate limit
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + API_CONFIG.RATE_LIMIT.WINDOW_MS;
  } else if (userLimit.count >= tierConfig.MAX_REQUESTS_PER_WINDOW) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    };
  } else {
    userLimit.count++;
  }
  
  userLimit.lastRequestTime = now;
  return { allowed: true };
}

// Enhanced validation with new limits
function validateProjectData(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body.base_url || typeof body.base_url !== 'string') {
    errors.push('base_url is required and must be a string');
  }
  
  if (body.base_url) {
    if (body.base_url.length > API_CONFIG.VALIDATION.MAX_URL_LENGTH) {
      errors.push(`URL is too long. Maximum length is ${API_CONFIG.VALIDATION.MAX_URL_LENGTH} characters`);
    }
    
    try {
      const url = new URL(body.base_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Invalid URL format');
    }
  }
  
  if (body.crawlType && !['full', 'single'].includes(body.crawlType)) {
    errors.push('crawlType must be either "full" or "single"');
  }
  
  if (body.services) {
    if (!Array.isArray(body.services)) {
      errors.push('services must be an array');
    } else if (body.services.length > API_CONFIG.VALIDATION.MAX_SERVICES_COUNT) {
      errors.push(`Too many services. Maximum allowed is ${API_CONFIG.VALIDATION.MAX_SERVICES_COUNT}`);
    }
  }
  
  if (body.instructions) {
    if (!Array.isArray(body.instructions)) {
      errors.push('instructions must be an array');
    } else if (body.instructions.length > API_CONFIG.VALIDATION.MAX_INSTRUCTIONS_COUNT) {
      errors.push(`Too many instructions. Maximum allowed is ${API_CONFIG.VALIDATION.MAX_INSTRUCTIONS_COUNT}`);
    }
  }
  
  if (body.custom_urls) {
    if (!Array.isArray(body.custom_urls)) {
      errors.push('custom_urls must be an array');
    } else if (body.custom_urls.length > API_CONFIG.VALIDATION.MAX_CUSTOM_URLS_COUNT) {
      errors.push(`Too many custom URLs. Maximum allowed is ${API_CONFIG.VALIDATION.MAX_CUSTOM_URLS_COUNT}`);
    }
  }
  
  if (body.stripe_key_urls) {
    if (!Array.isArray(body.stripe_key_urls)) {
      errors.push('stripe_key_urls must be an array');
    } else if (body.stripe_key_urls.length > API_CONFIG.VALIDATION.MAX_CUSTOM_URLS_COUNT) {
      errors.push(`Too many Stripe key URLs. Maximum allowed is ${API_CONFIG.VALIDATION.MAX_CUSTOM_URLS_COUNT}`);
    }
  }
  
  // Check company info length
  if (body.companyDetails) {
    const { companyName, phoneNumber, email, address, customInfo } = body.companyDetails;
    const totalLength = [companyName, phoneNumber, email, address, customInfo]
      .filter(Boolean)
      .join('').length;
    
    if (totalLength > API_CONFIG.VALIDATION.MAX_COMPANY_INFO_LENGTH) {
      errors.push(`Company information is too long. Maximum allowed is ${API_CONFIG.VALIDATION.MAX_COMPANY_INFO_LENGTH} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced data preparation with validation
function prepareProjectData(body: any, userId: string) {
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

  return {
    user_id: userId,
    base_url: base_url.trim().toLowerCase(),
    crawl_type: crawlType,
    instructions: instructions.length > 0 ? instructions : null,
    services: services.length > 0 ? services : null,
    status: 'pending',
    company_name: companyName?.trim() || null,
    phone_number: phoneNumber?.trim() || null,
    email: email?.trim() || null,
    address: address?.trim() || null,
    custom_info: customInfo?.trim() || null,
    custom_urls: custom_urls.filter((url: string) => url && url.trim()).length > 0 
      ? custom_urls.filter((url: string) => url && url.trim()) 
      : null,
    stripe_key_urls: stripe_key_urls.filter((url: string) => url && url.trim()).length > 0 
      ? stripe_key_urls.filter((url: string) => url && url.trim()) 
      : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.AUTH_REQUIRED }, 
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    userId = user.id;

    const { data: projects, error } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(API_CONFIG.RESPONSE.MAX_PROJECTS_PER_REQUEST);

    if (error) {
      console.error('Database error in GET:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', code: ERROR_CODES.DB_ERROR }, 
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    logPerformanceMetrics(userId, 'GET projects', startTime);
    
    return NextResponse.json({ 
      projects: projects || [],
      count: projects?.length || 0,
      userTier: getUserTier(userId),
      rateLimitInfo: {
        remaining: USER_TIERS[getUserTier(userId)].MAX_REQUESTS_PER_WINDOW - (rateLimitStore.get(userId)?.count || 0),
        resetTime: rateLimitStore.get(userId)?.resetTime || Date.now() + API_CONFIG.RATE_LIMIT.WINDOW_MS
      }
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

    // Check payload size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > API_CONFIG.PERFORMANCE.MEMORY_LIMIT_MB * 1024 * 1024) {
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
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.AUTH_REQUIRED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    userId = user.id;

    // Check rate limiting with enhanced features
    const rateLimitCheck = checkRateLimit(user.id);
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
          userTier: getUserTier(user.id),
          limits: USER_TIERS[getUserTier(user.id)]
        },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    }

    // Validate request data
    const validation = validateProjectData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: ERROR_CODES.VALIDATION_ERROR,
          details: validation.errors 
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check user project limit
    const userTier = getUserTier(user.id);
    const { data: projectCount, error: countError } = await supabase
      .from('audit_projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting user projects:', countError);
    } else if (projectCount && projectCount.length >= USER_TIERS[userTier].MAX_PROJECTS) {
      return NextResponse.json(
        { 
          error: 'Project limit reached for your tier',
          code: ERROR_CODES.TOO_MANY_PROJECTS,
          currentCount: projectCount.length,
          maxAllowed: USER_TIERS[userTier].MAX_PROJECTS,
          userTier
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Check if user already has a project with the same URL
    const { data: existingProject, error: checkError } = await supabase
      .from('audit_projects')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('base_url', body.base_url.trim().toLowerCase())
      .limit(1)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing project:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing projects', code: ERROR_CODES.DB_CHECK_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (existingProject) {
      return NextResponse.json(
        { 
          error: 'A project with this URL already exists',
          code: ERROR_CODES.DUPLICATE_URL,
          projectId: existingProject.id,
          status: existingProject.status
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Prepare data for database insertion
    const projectData = prepareProjectData(body, user.id);

    // Create audit project with enhanced retry logic
    let project;
    let insertError;
    const maxRetries = API_CONFIG.DATABASE.MAX_RETRIES;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('audit_projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        insertError = error;
        
        // Retry on specific database errors
        if (error.code === '23505' && attempt < maxRetries) { // Unique constraint violation
          console.warn(`Retry attempt ${attempt} for duplicate constraint:`, error);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.DATABASE.RETRY_DELAY_MS * attempt));
          continue;
        }
        
        if (error.code === '57014' && attempt < maxRetries) { // Query cancelled
          console.warn(`Retry attempt ${attempt} for cancelled query:`, error);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.DATABASE.RETRY_DELAY_MS * 2 * attempt));
          continue;
        }
        
        break; // Don't retry for other errors
      }
      
      project = data;
      break;
    }

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Handle specific database errors
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Project already exists', code: ERROR_CODES.DUPLICATE_PROJECT },
          { status: HTTP_STATUS.CONFLICT }
        );
      }
      
      if (insertError.code === '23514') {
        return NextResponse.json(
          { error: 'Invalid data format', code: ERROR_CODES.INVALID_DATA_FORMAT },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      
      if (insertError.code === '57014') {
        return NextResponse.json(
          { error: 'Database query timeout', code: ERROR_CODES.DB_TIMEOUT },
          { status: HTTP_STATUS.REQUEST_TIMEOUT }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create project', code: ERROR_CODES.DB_INSERT_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Failed to create project', code: ERROR_CODES.NO_PROJECT_RETURNED },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    logPerformanceMetrics(userId, 'POST project creation', startTime);

    // Success response with enhanced information
    return NextResponse.json(
      { 
        project,
        message: 'Project created successfully',
        code: ERROR_CODES.SUCCESS,
        userTier,
        rateLimitInfo: {
          remaining: USER_TIERS[userTier].MAX_REQUESTS_PER_WINDOW - (rateLimitStore.get(user.id)?.count || 0),
          resetTime: rateLimitStore.get(user.id)?.resetTime || Date.now() + API_CONFIG.RATE_LIMIT.WINDOW_MS
        }
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


