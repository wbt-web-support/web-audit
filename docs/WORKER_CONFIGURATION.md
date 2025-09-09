# Current Worker Configuration

## 📊 **Total Workers Working Together**

### **Current Default Configuration**

| **Queue Type** | **Workers** | **Concurrency** | **Total Concurrent Jobs** | **Purpose** |
|----------------|-------------|-----------------|---------------------------|-------------|
| **Web Scraping** | 5 | 3 | **15** | Website crawling |
| **Image Extraction** | 3 | 2 | **6** | Image analysis |
| **Content Analysis** | 2 | 1 | **2** | Link extraction |
| **SEO Analysis** | 2 | 1 | **2** | SEO analysis |
| **Performance Analysis** | 1 | 1 | **1** | Performance metrics |
| **TOTAL** | **13** | - | **26** | **All queues combined** |

### **How Workers Work Together**

#### **1. Web Scraping Queue (Primary)**
- **5 Workers** × **3 Concurrency** = **15 concurrent scraping jobs**
- Each worker can process 3 websites simultaneously
- Total capacity: 15 websites being scraped at the same time

#### **2. Image Extraction Queue**
- **3 Workers** × **2 Concurrency** = **6 concurrent image jobs**
- Each worker can process 2 image extraction tasks simultaneously
- Total capacity: 6 image extraction tasks running at the same time

#### **3. Content Analysis Queue**
- **2 Workers** × **1 Concurrency** = **2 concurrent content jobs**
- Each worker processes 1 content analysis task at a time
- Total capacity: 2 content analysis tasks running simultaneously

#### **4. SEO Analysis Queue**
- **2 Workers** × **1 Concurrency** = **2 concurrent SEO jobs**
- Each worker processes 1 SEO analysis task at a time
- Total capacity: 2 SEO analysis tasks running simultaneously

#### **5. Performance Analysis Queue**
- **1 Worker** × **1 Concurrency** = **1 concurrent performance job**
- Single worker processes 1 performance analysis task at a time
- Total capacity: 1 performance analysis task running

## 🔄 **Processing Flow**

### **For 100 Users Requesting Website Crawling:**

```
Step 1: Web Scraping (15 concurrent jobs)
├── Users 1-15:   Processed immediately
├── Users 16-30:  Wait for first batch to complete
├── Users 31-45:  Wait for second batch to complete
├── Users 46-60:  Wait for third batch to complete
├── Users 61-75:  Wait for fourth batch to complete
├── Users 76-90:  Wait for fifth batch to complete
└── Users 91-100: Wait for sixth batch to complete

Step 2: Image Extraction (6 concurrent jobs)
├── Process images from scraped pages
└── 6 pages processed simultaneously

Step 3: Content Analysis (2 concurrent jobs)
├── Extract links and analyze content
└── 2 pages processed simultaneously

Step 4: SEO Analysis (2 concurrent jobs)
├── Perform SEO analysis
└── 2 pages processed simultaneously

Step 5: Performance Analysis (1 concurrent job)
├── Analyze performance metrics
└── 1 page processed at a time
```

## ⚡ **Optimized Configuration (200+ Users in 10 minutes)**

### **Ultra-Optimized Worker Setup**

| **Queue Type** | **Workers** | **Concurrency** | **Total Concurrent Jobs** | **Memory Usage** |
|----------------|-------------|-----------------|---------------------------|------------------|
| **Web Scraping** | 50 | 2 | **100** | ~2GB |
| **Image Extraction** | 25 | 1 | **25** | ~1.5GB |
| **Content Analysis** | 20 | 1 | **20** | ~1GB |
| **SEO Analysis** | 10 | 1 | **10** | ~0.5GB |
| **Performance Analysis** | 5 | 1 | **5** | ~0.3GB |
| **TOTAL** | **110** | - | **160** | **~5.3GB** |

### **Performance Comparison**

| **Metric** | **Current (13 workers)** | **Optimized (110 workers)** | **Improvement** |
|------------|-------------------------|------------------------------|-----------------|
| **Total Workers** | 13 | 110 | **8.5x increase** |
| **Concurrent Jobs** | 26 | 160 | **6.2x increase** |
| **100 Users Time** | 3.5 hours | 10 minutes | **21x faster** |
| **200 Users Time** | 7+ hours | 10 minutes | **42x faster** |
| **Memory Usage** | 2-4GB | 5.3GB | **Optimized for 8GB** |

## 🎯 **Worker Distribution Strategy**

### **Current Strategy (Conservative)**
- **Low worker count** for stability
- **Higher concurrency** per worker
- **Memory efficient** but slower processing
- **Good for** 10-50 concurrent users

### **Optimized Strategy (Aggressive)**
- **High worker count** for speed
- **Lower concurrency** per worker (memory efficiency)
- **Ultra-fast processing** with memory monitoring
- **Good for** 200+ concurrent users

## 🔧 **How to Change Worker Configuration**

### **1. Using the Optimization Script**
```bash
# For 100 users optimization
npm run optimize:100-users

# For 200+ users with 8GB RAM
npx ts-node scripts/optimize-for-200-users-8gb.ts
```

### **2. Manual Configuration Update**
```typescript
import { updateQueueConfig } from '@/lib/queue/queue-config';

// Increase web scraping workers
await updateQueueConfig('web-scraping', {
  maxWorkers: 50,    // Increase from 5 to 50
  concurrency: 2,    // Reduce from 3 to 2 (memory efficiency)
  delayBetweenJobs: 100, // Ultra-fast processing
});
```

### **3. Database Direct Update**
```sql
UPDATE redis_queue_management 
SET max_workers = 50, concurrency = 2, delay_between_jobs = 100
WHERE queue_name = 'web-scraping';
```

## 📈 **Real-Time Worker Monitoring**

### **Check Current Worker Status**
```typescript
import { queueManager } from '@/lib/queue/queue-manager';

// Get all queue statistics
const stats = await queueManager.getAllQueueStats();

// Get specific queue stats
const scrapingStats = await queueManager.getQueueStats('web-scraping');
console.log(`Web scraping: ${scrapingStats.active} active, ${scrapingStats.waiting} waiting`);
```

### **API Endpoints for Monitoring**
- `GET /api/admin/queue-dashboard` - Real-time worker statistics
- `GET /api/admin/memory-monitor` - Memory usage per worker
- `POST /api/admin/queue-control` - Control worker operations

## 🚨 **Worker Management Best Practices**

### **1. Memory Management**
- Monitor memory usage per worker
- Set memory thresholds (6GB warning, 7GB critical)
- Automatically pause queues if memory > 7.5GB

### **2. Load Balancing**
- Distribute workers across different queues
- Prioritize web scraping (highest demand)
- Scale image extraction based on scraping output

### **3. Error Handling**
- Automatic retry for failed jobs
- Worker health monitoring
- Graceful shutdown on errors

### **4. Performance Tuning**
- Adjust worker count based on load
- Optimize concurrency for memory usage
- Monitor processing times and adjust delays

## 💡 **Recommendations**

### **For Current Load (10-50 users)**
- Keep current configuration (13 workers)
- Monitor performance and scale gradually
- Focus on stability over speed

### **For High Load (100+ users)**
- Use optimized configuration (110 workers)
- Implement memory monitoring
- Set up automatic scaling

### **For Enterprise Load (500+ users)**
- Consider horizontal scaling
- Use multiple server instances
- Implement load balancing across servers

## 🔍 **Monitoring Commands**

```bash
# Start workers with monitoring
npm run start:workers

# Check worker status
curl http://localhost:3000/api/admin/queue-dashboard

# Monitor memory usage
curl http://localhost:3000/api/admin/memory-monitor

# Get queue statistics
curl -X POST http://localhost:3000/api/admin/queue-control \
  -H "Content-Type: application/json" \
  -d '{"action": "get_stats"}'
```

This configuration allows your system to handle massive concurrent loads while staying within memory constraints and maintaining system stability! 🚀
