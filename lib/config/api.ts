// API Configuration for 500+ Active Users (Optimized)
export const API_CONFIG = {
  // Rate limiting settings - Optimized for 500+ active users
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 500, // Increased for high concurrency
    CLEANUP_INTERVAL_MS: 2 * 60 * 1000, // Clean up every 2 minutes for better memory management
    BURST_LIMIT: 100, // Allow burst of 100 requests in first 10 seconds
    BURST_WINDOW_MS: 10 * 1000, // 10 seconds burst window
  },
  
  // Database settings - Optimized for 500+ concurrent users
  DATABASE: {
    MAX_RETRIES: 2, // Reduced retries for faster failure handling
    RETRY_DELAY_MS: 25, // Faster retry delay
    QUERY_TIMEOUT_MS: 10000, // Reduced to 10 seconds for better responsiveness
    CONNECTION_POOL_SIZE: 50, // Increased pool size for high concurrency
    MAX_CONCURRENT_QUERIES: 200, // Increased limit for concurrent operations
  },
  
  // Validation settings - Balanced for user experience
  VALIDATION: {
    MAX_URL_LENGTH: 2048,
    MAX_INSTRUCTIONS_COUNT: 200, // Increased for power users
    MAX_SERVICES_COUNT: 100, // Increased service selection
    MAX_CUSTOM_URLS_COUNT: 2000, // Increased for comprehensive audits
    MAX_COMPANY_INFO_LENGTH: 500, // Limit company info length
  },
  
  // Response settings - Optimized for user load
  RESPONSE: {
    MAX_PROJECTS_PER_REQUEST: 2000, // Increased for users with many projects
    DEFAULT_PAGE_SIZE: 100, // Larger default page size
    CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes cache for GET requests
  },
  
  // Performance settings for 500+ users
  PERFORMANCE: {
    MAX_CONCURRENT_REQUESTS: 1000, // Handle 1000+ concurrent requests
    REQUEST_TIMEOUT_MS: 15000, // Reduced to 15 seconds for faster responses
    MEMORY_LIMIT_MB: 256, // Reduced memory limit per request
    CPU_TIMEOUT_MS: 10000, // Reduced CPU timeout for better responsiveness
  },
  
  // User experience settings
  USER_EXPERIENCE: {
    GRACE_PERIOD_MS: 5 * 1000, // 5 seconds grace period for rate limits
    RETRY_AFTER_MULTIPLIER: 1.5, // Progressive backoff for rate limits
    MAX_USER_PROJECTS: 1000, // Maximum projects per user
    PROJECT_CREATION_COOLDOWN_MS: 1000, // 1 second cooldown between project creation
  }
};

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  DATA_TOO_LARGE: 'DATA_TOO_LARGE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BURST_LIMIT_EXCEEDED: 'BURST_LIMIT_EXCEEDED',
  TOO_MANY_PROJECTS: 'TOO_MANY_PROJECTS',
  
  // Database errors
  DB_ERROR: 'DB_ERROR',
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_INSERT_ERROR: 'DB_INSERT_ERROR',
  DB_CHECK_ERROR: 'DB_CHECK_ERROR',
  DB_TIMEOUT: 'DB_TIMEOUT',
  DUPLICATE_PROJECT: 'DUPLICATE_PROJECT',
  DUPLICATE_URL: 'DUPLICATE_URL',
  INVALID_DATA_FORMAT: 'INVALID_DATA_FORMAT',
  NO_PROJECT_RETURNED: 'NO_PROJECT_RETURNED',
  
  // Method errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  
  // Performance errors
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  CPU_TIMEOUT: 'CPU_TIMEOUT',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SUCCESS: 'SUCCESS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// HTTP status codes mapping
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// User tiers for different rate limits
export const USER_TIERS = {
  FREE: {
    MAX_REQUESTS_PER_WINDOW: 100,
    MAX_PROJECTS: 50,
    BURST_LIMIT: 20,
  },
  BASIC: {
    MAX_REQUESTS_PER_WINDOW: 200,
    MAX_PROJECTS: 200,
    BURST_LIMIT: 50,
  },
  PREMIUM: {
    MAX_REQUESTS_PER_WINDOW: 500,
    MAX_PROJECTS: 1000,
    BURST_LIMIT: 100,
  },
  ENTERPRISE: {
    MAX_REQUESTS_PER_WINDOW: 1000,
    MAX_PROJECTS: 5000,
    BURST_LIMIT: 200,
  },
} as const;

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_MS: {
    EXCELLENT: 100,
    GOOD: 300,
    ACCEPTABLE: 1000,
    POOR: 3000,
  },
  MEMORY_USAGE_MB: {
    LOW: 50,
    MEDIUM: 200,
    HIGH: 400,
    CRITICAL: 512,
  },
  CONCURRENT_USERS: {
    OPTIMAL: 500,
    HIGH: 800,
    CRITICAL: 1000,
  },
} as const;
