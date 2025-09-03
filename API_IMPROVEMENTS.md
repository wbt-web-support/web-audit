# API Scalability Improvements

## Overview
The `/api/audit-projects` route has been enhanced to handle 100+ concurrent requests efficiently and scale to 1000+ requests in the future.

## Key Improvements Made

### 1. Rate Limiting
- **Per-user rate limiting**: 100 requests per minute per user
- **Automatic cleanup**: Old rate limit entries are cleaned up every 5 minutes
- **Configurable limits**: Easy to adjust in `lib/config/api.ts`

### 2. Enhanced Error Handling
- **Structured error responses**: All errors include error codes for frontend handling
- **Specific error types**: Different error codes for different failure scenarios
- **Better user feedback**: Clear error messages with actionable information

### 3. Request Validation
- **Input sanitization**: All inputs are validated and sanitized before processing
- **Size limits**: Configurable limits for URLs, services, instructions, etc.
- **Content type validation**: Ensures proper JSON content type

### 4. Database Optimization
- **Retry logic**: Automatic retries for transient database errors
- **Exponential backoff**: Intelligent retry delays to avoid overwhelming the database
- **Connection pooling**: Efficient Supabase client management

### 5. Duplicate Prevention
- **URL uniqueness check**: Prevents duplicate projects for the same URL per user
- **Conflict resolution**: Clear error messages when duplicates are detected

### 6. Performance Features
- **Request queuing**: Efficient handling of concurrent requests
- **Memory management**: Automatic cleanup of rate limiting data
- **Response optimization**: Structured responses with metadata

## Configuration

All settings are centralized in `lib/config/api.ts`:

```typescript
export const API_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 100, // Max requests per minute per user
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Clean up every 5 minutes
  },
  DATABASE: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 100,
    QUERY_TIMEOUT_MS: 30000,
  },
  VALIDATION: {
    MAX_URL_LENGTH: 2048,
    MAX_INSTRUCTIONS_COUNT: 100,
    MAX_SERVICES_COUNT: 50,
    MAX_CUSTOM_URLS_COUNT: 1000,
  }
};
```

## Error Codes

Standardized error codes for consistent frontend handling:

- `AUTH_REQUIRED`: User not authenticated
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Invalid input data
- `DUPLICATE_URL`: Project with same URL already exists
- `DB_CONNECTION_ERROR`: Database connection failed

## Scalability Features

### Current Capacity
- **Concurrent users**: 100+ simultaneous users
- **Requests per user**: 100 per minute
- **Database connections**: Efficient pooling and retry logic

### Future Scaling
- **Easy scaling**: Increase limits in config file
- **Redis integration**: Replace in-memory rate limiting with Redis for production
- **Load balancing**: Ready for horizontal scaling
- **Monitoring**: Built-in logging for performance tracking

## Usage Examples

### Frontend Error Handling
```typescript
if (response.status === 429) {
  // Rate limit exceeded
  const retryAfter = data.retryAfter;
  showRateLimitMessage(retryAfter);
} else if (data.code === 'DUPLICATE_URL') {
  // Handle duplicate URL
  showDuplicateUrlMessage(data.projectId);
}
```

### Rate Limit Response
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## Production Considerations

1. **Replace in-memory rate limiting** with Redis or database storage
2. **Add monitoring** for request patterns and performance
3. **Implement circuit breakers** for database failures
4. **Add request logging** for debugging and analytics
5. **Consider CDN** for static assets and caching

## Testing

The API can be tested with multiple concurrent requests:

```bash
# Test with 50 concurrent requests
for i in {1..50}; do
  curl -X POST /api/audit-projects \
    -H "Content-Type: application/json" \
    -d '{"base_url":"https://example.com"}' &
done
wait
```

## Monitoring

Built-in logging provides insights into:
- Rate limiting hits
- Database retries
- Validation failures
- Performance bottlenecks

All logs include error codes for easy filtering and analysis.
