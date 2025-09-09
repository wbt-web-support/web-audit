# SaaS Web Audit API Documentation

## Overview

The SaaS Web Audit API provides a comprehensive, multi-tenant web crawling and analysis platform. This API is designed to handle 500+ concurrent users with proper tenant isolation, rate limiting, and resource management.

## Base URL

```
https://your-domain.com/api/saas
```

## Authentication

All API requests require authentication using Supabase Auth. Include the authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

Rate limits are applied per tenant and endpoint:

- **Free Plan**: 60 requests/minute
- **Starter Plan**: 300 requests/minute  
- **Professional Plan**: 1000 requests/minute
- **Enterprise Plan**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 2024-01-01T12:00:00Z
```

## API Versioning

The API uses URL-based versioning:
- Current version: `v1` (default)
- Future versions: `v2`, `v3`, etc.

Example: `/api/saas/v1/tenants/my-tenant/projects`

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

## Tenant Management

### Get Tenant Information

```http
GET /tenants/{slug}
```

**Response:**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "name": "Company Name",
    "slug": "company-slug",
    "plan": {
      "name": "Professional",
      "tier": "professional",
      "limits": {
        "maxProjects": 50,
        "maxPagesPerProject": 1000,
        "maxConcurrentCrawls": 10,
        "maxWorkers": 20,
        "rateLimitPerMinute": 1000,
        "storageGB": 100
      }
    },
    "status": "active",
    "usage": {
      "currentProjects": 5,
      "currentPages": 250,
      "currentCrawls": 2,
      "currentWorkers": 8,
      "currentStorageGB": 15,
      "monthlyCrawls": 45
    }
  }
}
```

### Update Tenant Settings

```http
PUT /tenants/{slug}
```

**Request Body:**
```json
{
  "settings": {
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "webhook": false
    },
    "crawling": {
      "defaultMaxPages": 100,
      "defaultMaxDepth": 3,
      "respectRobotsTxt": true,
      "userAgent": "CustomBot/1.0"
    }
  }
}
```

## Project Management

### List Projects

```http
GET /tenants/{slug}/projects?page=1&limit=10&status=active
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (pending, crawling, completed, failed, paused)

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "name": "Website Audit",
      "baseUrl": "https://example.com",
      "status": "completed",
      "settings": {
        "maxPages": 100,
        "maxDepth": 3,
        "followExternal": false,
        "respectRobotsTxt": true,
        "userAgent": "WebAuditBot/1.0",
        "timeout": 30000,
        "analysisTypes": ["seo", "performance", "accessibility"],
        "customUrls": []
      },
      "metrics": {
        "pagesCrawled": 85,
        "totalPages": 100,
        "totalImages": 150,
        "totalLinks": 200,
        "internalLinks": 180,
        "externalLinks": 20,
        "averageLoadTime": 2.5,
        "lastCrawledAt": "2024-01-01T12:00:00Z"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z",
      "createdBy": "user-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Create Project

```http
POST /tenants/{slug}/projects
```

**Request Body:**
```json
{
  "name": "New Website Audit",
  "baseUrl": "https://example.com",
  "settings": {
    "maxPages": 50,
    "maxDepth": 2,
    "followExternal": false,
    "respectRobotsTxt": true,
    "userAgent": "CustomBot/1.0",
    "timeout": 30000,
    "analysisTypes": ["seo", "performance"],
    "customUrls": ["https://example.com/special-page"]
  }
}
```

### Start Crawling

```http
POST /tenants/{slug}/projects/{projectId}/start-crawl
```

**Request Body:**
```json
{
  "background": true
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-uuid",
  "queueName": "tenant:tenant-uuid:web-scraping",
  "estimated_time_sec": 300,
  "message": "Background crawling started successfully"
}
```

### Stop Crawling

```http
POST /tenants/{slug}/projects/{projectId}/stop
```

### Get Crawl Status

```http
GET /tenants/{slug}/projects/{projectId}/crawl-status
```

**Response:**
```json
{
  "success": true,
  "is_crawling": true,
  "project": {
    "id": "uuid",
    "status": "crawling",
    "pages_crawled": 25,
    "total_pages": 100,
    "total_images": 45,
    "total_links": 60,
    "internal_links": 55,
    "external_links": 5
  },
  "recent_pages": [
    {
      "id": "page-uuid",
      "url": "https://example.com/page1",
      "title": "Page Title",
      "status_code": 200
    }
  ]
}
```

## Analysis Results

### Get Project Results

```http
GET /tenants/{slug}/projects/{projectId}/results
```

**Response:**
```json
{
  "success": true,
  "pageResults": [
    {
      "page": {
        "id": "uuid",
        "url": "https://example.com/page1",
        "title": "Page Title",
        "status_code": 200,
        "analysis_status": "completed"
      },
      "results": {
        "seo_analysis": {
          "score": 85,
          "issues": ["Missing meta description"],
          "recommendations": ["Add meta description"]
        },
        "performance_analysis": {
          "score": 78,
          "metrics": {
            "loadTime": 2.5,
            "firstContentfulPaint": 1.2
          }
        },
        "overall_score": 82,
        "overall_status": "good"
      }
    }
  ]
}
```

### Start Analysis

```http
POST /tenants/{slug}/projects/{projectId}/analyze
```

**Request Body:**
```json
{
  "page_ids": ["page-uuid-1", "page-uuid-2"],
  "background": false,
  "analysis_types": ["seo", "performance", "accessibility"]
}
```

## Queue Management

### Get Queue Statistics

```http
GET /admin/queue-dashboard
```

**Response:**
```json
{
  "success": true,
  "queues": [
    {
      "queueName": "tenant:tenant-uuid:web-scraping",
      "tenantId": "tenant-uuid",
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3,
      "delayed": 0,
      "total": 160
    }
  ],
  "systemStats": {
    "totalQueues": 25,
    "totalJobs": 500,
    "activeJobs": 15,
    "completedJobs": 450,
    "failedJobs": 35
  }
}
```

### Pause Queue

```http
POST /admin/queue-control
```

**Request Body:**
```json
{
  "action": "pause",
  "queueName": "tenant:tenant-uuid:web-scraping"
}
```

## System Monitoring

### Get System Metrics

```http
GET /admin/system-metrics
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalTenants": 150,
    "activeTenants": 120,
    "totalProjects": 500,
    "activeCrawls": 25,
    "queueStats": {
      "waiting": 50,
      "active": 15,
      "completed": 2000,
      "failed": 25
    },
    "systemLoad": {
      "cpu": 45.2,
      "memory": 67.8,
      "disk": 23.1
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Get Health Check

```http
GET /admin/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "queues": true,
    "tenants": true
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Webhooks

### Configure Webhook

```http
POST /tenants/{slug}/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["crawl.completed", "analysis.completed", "error.occurred"],
  "secret": "webhook-secret-key"
}
```

### Webhook Payload Example

```json
{
  "event": "crawl.completed",
  "tenantId": "tenant-uuid",
  "projectId": "project-uuid",
  "data": {
    "pagesCrawled": 85,
    "totalPages": 100,
    "duration": 300,
    "status": "completed"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "signature": "sha256=..."
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @web-audit/saas-sdk
```

```typescript
import { WebAuditClient } from '@web-audit/saas-sdk';

const client = new WebAuditClient({
  apiKey: 'your-api-key',
  tenantSlug: 'your-tenant-slug'
});

// Create a project
const project = await client.projects.create({
  name: 'My Website Audit',
  baseUrl: 'https://example.com'
});

// Start crawling
const crawlJob = await client.projects.startCrawl(project.id, {
  background: true
});

// Get results
const results = await client.projects.getResults(project.id);
```

### Python

```bash
pip install web-audit-saas
```

```python
from web_audit_saas import WebAuditClient

client = WebAuditClient(
    api_key='your-api-key',
    tenant_slug='your-tenant-slug'
)

# Create a project
project = client.projects.create(
    name='My Website Audit',
    base_url='https://example.com'
)

# Start crawling
crawl_job = client.projects.start_crawl(
    project.id, 
    background=True
)

# Get results
results = client.projects.get_results(project.id)
```

## Best Practices

### 1. Error Handling

Always implement proper error handling:

```typescript
try {
  const response = await fetch('/api/saas/tenants/my-tenant/projects', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
} catch (error) {
  console.error('API Error:', error);
}
```

### 2. Rate Limiting

Implement exponential backoff for rate-limited requests:

```typescript
async function makeRequestWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 3. Pagination

Always handle pagination for list endpoints:

```typescript
async function getAllProjects(tenantSlug: string) {
  const allProjects = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `/api/saas/tenants/${tenantSlug}/projects?page=${page}&limit=100`
    );
    const data = await response.json();
    
    allProjects.push(...data.projects);
    hasMore = page < data.pagination.totalPages;
    page++;
  }
  
  return allProjects;
}
```

### 4. Webhook Security

Always verify webhook signatures:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Support

For API support and questions:
- Email: api-support@web-audit.com
- Documentation: https://docs.web-audit.com
- Status Page: https://status.web-audit.com
