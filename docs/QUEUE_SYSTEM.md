# Queue System Documentation

## Overview

The web audit system now includes a comprehensive Redis-based queue system using BullMQ for managing web scraping, image extraction, and content analysis operations. This system provides scalability, reliability, and monitoring capabilities.

## Architecture

### Components

1. **Redis Connection** (`lib/queue/redis-connection.ts`)
   - Manages Redis connection with proper error handling
   - Health check functionality
   - Connection pooling and retry logic

2. **Queue Manager** (`lib/queue/queue-manager.ts`)
   - Centralized queue management
   - Job processing and monitoring
   - Queue statistics and control

3. **Queue Configuration** (`lib/queue/queue-config.ts`)
   - Database-driven queue configuration
   - Admin-configurable settings
   - Default fallback configurations

4. **Error Logging** (`lib/logging/error-logger.ts`)
   - Comprehensive server-side logging
   - Queue-specific error tracking
   - Performance monitoring

## Queue Types

### 1. Web Scraping Queue (`web-scraping`)
- **Purpose**: Crawl and scrape website pages
- **Default Workers**: 5
- **Concurrency**: 3
- **Retry Attempts**: 3
- **Priority**: High

### 2. Image Extraction Queue (`image-extraction`)
- **Purpose**: Extract and analyze images from pages
- **Default Workers**: 3
- **Concurrency**: 2
- **Retry Attempts**: 2
- **Priority**: Medium

### 3. Content Analysis Queue (`content-analysis`)
- **Purpose**: Extract and analyze links and content
- **Default Workers**: 2
- **Concurrency**: 1
- **Retry Attempts**: 3
- **Priority**: Medium

### 4. SEO Analysis Queue (`seo-analysis`)
- **Purpose**: Perform SEO analysis on pages
- **Default Workers**: 2
- **Concurrency**: 1
- **Retry Attempts**: 2
- **Priority**: Low

### 5. Performance Analysis Queue (`performance-analysis`)
- **Purpose**: Analyze page performance metrics
- **Default Workers**: 1
- **Concurrency**: 1
- **Retry Attempts**: 2
- **Priority**: Low

## Database Tables

### Redis Queue Management Table

```sql
CREATE TABLE redis_queue_management (
  id UUID PRIMARY KEY,
  queue_name VARCHAR(100) UNIQUE,
  max_workers INTEGER DEFAULT 5,
  max_queue_size INTEGER DEFAULT 1000,
  concurrency INTEGER DEFAULT 3,
  delay_between_jobs INTEGER DEFAULT 1000,
  retry_attempts INTEGER DEFAULT 3,
  retry_delay INTEGER DEFAULT 5000,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Error Logs Table

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  level VARCHAR(10) CHECK (level IN ('error', 'warning', 'info', 'debug')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  user_id UUID,
  project_id UUID,
  job_id VARCHAR(255),
  queue_name VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID
);
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
# or for production:
REDIS_URL=redis://username:password@host:port/database
```

### 2. Database Setup

Run the SQL scripts to create the necessary tables:

```bash
# Run in your Supabase SQL editor or database client
psql -f scripts/create-redis-queue-table.sql
psql -f scripts/create-error-logs-table.sql
```

### 3. Install Dependencies

```bash
npm install bullmq ioredis @types/ioredis
```

### 4. Start Queue Workers

```bash
# Start workers in production
npm run start:workers

# Start workers in development with auto-reload
npm run start:workers:dev
```

## Usage Examples

### Web Scraping with Queue

```typescript
import { WebScraper } from '@/lib/services/web-scraper';

const scraper = new WebScraper('https://example.com', {
  maxPages: 50,
  maxDepth: 3,
});

// Queue the scraping job
const { jobId, queueName } = await scraper.crawlWithQueue(
  async (page) => {
    console.log(`Scraped: ${page.url}`);
  },
  'project-id'
);

// Check job status
const status = await WebScraper.getScrapingJobStatus(jobId);
console.log('Job status:', status);
```

### Image Extraction with Queue

```typescript
import { extractImagesWithQueue } from '@/lib/services/extract-resources';

const { jobId, queueName } = await extractImagesWithQueue(
  htmlContent,
  'https://example.com',
  'project-id',
  'page-id'
);

// Check job status
const status = await getImageExtractionJobStatus(jobId);
console.log('Image extraction status:', status);
```

### Link Extraction with Queue

```typescript
import { extractLinksWithQueue } from '@/lib/services/extract-resources';

const { jobId, queueName } = await extractLinksWithQueue(
  htmlContent,
  'https://example.com',
  'project-id',
  'page-id'
);

// Check job status
const status = await getLinkExtractionJobStatus(jobId);
console.log('Link extraction status:', status);
```

## Admin Management

### Queue Configuration

Admins can modify queue settings through the database or API:

```typescript
import { updateQueueConfig } from '@/lib/queue/queue-config';

await updateQueueConfig('web-scraping', {
  maxWorkers: 10,
  concurrency: 5,
  retryAttempts: 5,
});
```

### Queue Monitoring

```typescript
import { queueManager } from '@/lib/queue/queue-manager';

// Get all queue statistics
const stats = await queueManager.getAllQueueStats();

// Get specific queue stats
const scrapingStats = await queueManager.getQueueStats('web-scraping');

// Pause a queue
await queueManager.pauseQueue('web-scraping');

// Resume a queue
await queueManager.resumeQueue('web-scraping');

// Clear a queue
await queueManager.clearQueue('web-scraping');
```

## API Endpoints

### Admin Queue Management

- `GET /api/admin/queue-management` - Get queue configurations and statistics
- `PUT /api/admin/queue-management` - Update queue configuration
- `GET /api/admin/queue-dashboard` - Get comprehensive dashboard data
- `POST /api/admin/queue-control` - Control queues (pause, resume, clear, cancel jobs)

### Queue Control Actions

```typescript
// Pause a queue
POST /api/admin/queue-control
{
  "action": "pause",
  "queueName": "web-scraping"
}

// Cancel a job
POST /api/admin/queue-control
{
  "action": "cancel_job",
  "queueName": "web-scraping",
  "jobId": "job-123"
}

// Get queue statistics
POST /api/admin/queue-control
{
  "action": "get_stats",
  "queueName": "web-scraping" // optional
}
```

## Error Handling and Logging

### Error Logging

```typescript
import { errorLogger } from '@/lib/logging/error-logger';

// Log general errors
await errorLogger.logError('error', 'Something went wrong', error);

// Log queue-specific errors
await errorLogger.logQueueError('web-scraping', 'job-123', 'Job failed', error);

// Log performance metrics
await errorLogger.logPerformance('scraping', 5000, { pages: 10 });
```

### Error Monitoring

The system provides comprehensive error monitoring:

- Real-time error tracking
- Error rate calculations
- Queue health monitoring
- Performance metrics
- Automatic log cleanup (30 days for info/debug, 90 days for errors/warnings)

## Scaling Considerations

### Horizontal Scaling

1. **Multiple Worker Instances**: Run multiple instances of the worker script
2. **Load Balancing**: Distribute workers across multiple servers
3. **Redis Clustering**: Use Redis Cluster for high availability

### Vertical Scaling

1. **Increase Workers**: Adjust `maxWorkers` in queue configuration
2. **Increase Concurrency**: Adjust `concurrency` per queue
3. **Optimize Resources**: Monitor and adjust based on server capacity

### Monitoring

1. **Queue Statistics**: Monitor queue sizes and processing rates
2. **Error Rates**: Track error rates and failed jobs
3. **Performance Metrics**: Monitor job processing times
4. **Resource Usage**: Track CPU, memory, and Redis usage

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Check REDIS_URL environment variable
   - Verify Redis server is running
   - Check network connectivity

2. **Queue Not Processing**
   - Verify workers are running
   - Check queue configuration
   - Review error logs

3. **High Memory Usage**
   - Reduce `maxQueueSize` settings
   - Implement job cleanup policies
   - Monitor Redis memory usage

4. **Slow Processing**
   - Increase worker count
   - Optimize job processing logic
   - Check for bottlenecks in Redis

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor

# Check queue keys
redis-cli keys "*queue*"

# Get queue statistics
redis-cli hgetall "bull:web-scraping:stats"
```

## Best Practices

1. **Job Design**
   - Keep jobs atomic and idempotent
   - Include proper error handling
   - Set appropriate timeouts

2. **Queue Configuration**
   - Start with conservative settings
   - Monitor and adjust based on load
   - Use different queues for different priorities

3. **Error Handling**
   - Log all errors with context
   - Implement retry logic
   - Monitor error rates

4. **Performance**
   - Use connection pooling
   - Implement rate limiting
   - Monitor resource usage

5. **Security**
   - Secure Redis connections
   - Validate job data
   - Implement access controls

## Future Enhancements

1. **Job Scheduling**: Add cron-based job scheduling
2. **Job Dependencies**: Implement job dependency chains
3. **Dead Letter Queues**: Handle permanently failed jobs
4. **Metrics Dashboard**: Real-time monitoring interface
5. **Auto-scaling**: Dynamic worker scaling based on load
6. **Job Prioritization**: Advanced priority handling
7. **Batch Processing**: Process multiple jobs together
8. **Job Persistence**: Long-term job storage and replay
