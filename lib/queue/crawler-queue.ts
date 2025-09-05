import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '@/lib/redis/client';
import { WebScraper } from '@/lib/services/web-scraper';
import { createClient } from '@/lib/supabase/server';
import { extractImagesFromHtmlAndText, extractLinksFromHtmlAndText } from '@/lib/services/extract-resources';
import pLimit from 'p-limit';

// Optimized queue configuration for 8GB server with 500+ users
const QUEUE_CONFIG = {
  name: 'crawler-queue',
  concurrency: 20, // Increased from 10 to 20 for faster processing
  maxJobs: 2000,   // Increased for 500+ users
  removeOnComplete: 200, // Keep more completed jobs for monitoring
  removeOnFail: 100,     // Keep more failed jobs for debugging
  // Memory optimization settings
  maxMemoryUsage: 6 * 1024 * 1024 * 1024, // 6GB max memory usage
  maxConcurrentPages: 8, // Process 8 pages concurrently per crawler
};

// Job data interface
interface CrawlerJobData {
  projectId: string;
  baseUrl: string;
  userId: string;
  crawlType: 'single' | 'full';
  scraperOptions: {
    maxPages: number;
    maxDepth: number;
    followExternal: boolean;
    respectRobotsTxt: boolean;
  };
  priority?: number; // Higher number = higher priority
}

// Create queue instance
let crawlerQueue: Queue<CrawlerJobData> | null = null;

export async function getCrawlerQueue(): Promise<Queue<CrawlerJobData>> {
  if (!crawlerQueue) {
    const redisClient = await getRedisClient();
    crawlerQueue = new Queue(QUEUE_CONFIG.name, {
      connection: redisClient,
      defaultJobOptions: {
        removeOnComplete: QUEUE_CONFIG.removeOnComplete,
        removeOnFail: QUEUE_CONFIG.removeOnFail,
        attempts: 2, // Reduced attempts for faster failure handling
        backoff: {
          type: 'exponential',
          delay: 1000, // Faster retry
        },
        // Memory optimization
        delay: 0,
        priority: 1,
      },
    });
  }
  return crawlerQueue;
}

// Add job to queue with priority
export async function addCrawlerJob(jobData: CrawlerJobData): Promise<{
  jobId: string;
  queuePosition: number;
  estimatedWaitTime: number;
}> {
  const queue = await getCrawlerQueue();
  
  // Check if job already exists for this project
  const existingJobs = await queue.getJobs(['waiting', 'active', 'delayed']);
  const existingJob = existingJobs.find(job => job.data.projectId === jobData.projectId);
  
  if (existingJob) {
    throw new Error('Crawling job already exists for this project');
  }
  
  // Calculate priority based on user tier (you can implement user tiers)
  const priority = jobData.priority || 1;
  
  const job = await queue.add('crawl-website', jobData, {
    priority,
    delay: 0,
    // Job options for memory optimization
    jobId: `crawl-${jobData.projectId}-${Date.now()}`,
  });
  
  // Get queue position
  const waitingJobs = await queue.getWaiting();
  const queuePosition = waitingJobs.findIndex(j => j.id === job.id) + 1;
  
  // Calculate estimated wait time (optimized for 20 concurrent workers)
  const estimatedWaitTime = Math.max(0, (queuePosition - 1) * 15); // 15 seconds per job with optimizations
  
  return {
    jobId: job.id!,
    queuePosition,
    estimatedWaitTime,
  };
}

// Get job status with progress
export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  data?: any;
  error?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}> {
  const queue = await getCrawlerQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return { status: 'not_found', progress: 0 };
  }
  
  const state = await job.getState();
  let queuePosition = 0;
  let estimatedWaitTime = 0;
  
  if (state === 'waiting') {
    const waitingJobs = await queue.getWaiting();
    queuePosition = waitingJobs.findIndex(j => j.id === job.id) + 1;
    estimatedWaitTime = Math.max(0, (queuePosition - 1) * 15);
  }
  
  return {
    status: state,
    progress: job.progress || 0,
    data: job.data,
    error: job.failedReason,
    queuePosition,
    estimatedWaitTime,
  };
}

// Get comprehensive queue statistics
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
  avgProcessingTime: number;
  estimatedWaitTime: number;
}> {
  const queue = await getCrawlerQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);
  
  const total = waiting.length + active.length + completed.length + failed.length + delayed.length;
  const estimatedWaitTime = Math.max(0, waiting.length * 15 / QUEUE_CONFIG.concurrency);
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
    total,
    avgProcessingTime: 75, // Optimized processing time
    estimatedWaitTime,
  };
}

// Optimized worker function with concurrent page processing
export async function startCrawlerWorker(): Promise<void> {
  const redisClient = await getRedisClient();
  
  const worker = new Worker(
    QUEUE_CONFIG.name,
    async (job: Job<CrawlerJobData>) => {
      const { projectId, baseUrl, userId, crawlType, scraperOptions } = job.data;
      
      try {
        console.log(`🚀 Starting optimized crawl job ${job.id} for project ${projectId}`);
        
        // Update job progress
        await job.updateProgress(5);
        
        // Create Supabase client
        const supabase = await createClient();
        
        // Update project status to crawling
        await supabase
          .from('audit_projects')
          .update({ 
            status: 'crawling',
            pages_crawled: 0,
            total_pages: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
        
        await job.updateProgress(10);
        
        // Create optimized scraper instance
        const scraper = new WebScraper(baseUrl, {
          ...scraperOptions,
          // Optimize for speed
          timeout: 15000, // Reduced timeout
          maxPages: Math.min(scraperOptions.maxPages, 50), // Cap at 50 pages for speed
        });
        
        const existingUrls = new Set<string>();
        
        // Memory-optimized data structures
        const allImages: Array<{
          src: string;
          alt: string;
          format: string;
          size: number | null;
          is_small: boolean | null;
          page_url: string;
        }> = [];
        
        const allLinks: Array<{
          href: string;
          type: "internal" | "external";
          text: string;
          page_url: string;
        }> = [];
        
        let pagesCrawled = 0;
        const startTime = Date.now();
        
        // Create concurrent page processor
        const pageLimit = pLimit(QUEUE_CONFIG.maxConcurrentPages);
        
        // Start optimized crawling
        await scraper.crawl(async (pageData) => {
          // Check if job was cancelled
          if (await job.isStopped()) {
            throw new Error('Job was cancelled');
          }
          
          const normalizedUrl = normalizeUrl(pageData.url);
          
          // Skip unwanted URLs
          if (shouldSkipUrl(normalizedUrl)) {
            return;
          }
          
          // Process page concurrently
          await pageLimit(async () => {
            // Check if page already exists
            const pageExists = existingUrls.has(normalizedUrl);
            
            if (pageExists) {
              // Update existing page
              await supabase
                .from('scraped_pages')
                .update({
                  title: pageData.title,
                  content: pageData.content.substring(0, 50000), // Limit content size
                  html: pageData.html.substring(0, 100000), // Limit HTML size
                  status_code: pageData.statusCode,
                  scraped_at: new Date().toISOString(),
                })
                .eq('audit_project_id', projectId)
                .eq('url', normalizedUrl);
            } else {
              // Insert new page with size limits
              await supabase.from('scraped_pages').insert({
                audit_project_id: projectId,
                url: normalizedUrl,
                title: pageData.title,
                content: pageData.content.substring(0, 50000), // Limit content size
                html: pageData.html.substring(0, 100000), // Limit HTML size
                status_code: pageData.statusCode,
              });
              existingUrls.add(normalizedUrl);
            }
            
            pagesCrawled++;
            
            // Extract images and links concurrently
            const [allPageImages, allPageLinks] = await Promise.all([
              extractImagesFromHtmlAndText(pageData.html, normalizedUrl),
              Promise.resolve(extractLinksFromHtmlAndText(pageData.html, normalizedUrl))
            ]);
            
            allImages.push(...allPageImages);
            allLinks.push(...allPageLinks);
            
            // Update project with progress (batch updates for performance)
            if (pagesCrawled % 5 === 0) { // Update every 5 pages
              await supabase
                .from('audit_projects')
                .update({ 
                  pages_crawled: pagesCrawled,
                  all_image_analysis: allImages.slice(-100), // Keep only last 100 images
                  all_links_analysis: allLinks.slice(-200), // Keep only last 200 links
                  updated_at: new Date().toISOString()
                })
                .eq('id', projectId);
            }
            
            // Update job progress
            const progress = Math.min(95, 10 + (pagesCrawled / scraperOptions.maxPages) * 85);
            await job.updateProgress(progress);
          });
        });
        
        // Final update
        await supabase
          .from('audit_projects')
          .update({
            status: 'completed',
            total_pages: pagesCrawled,
            all_image_analysis: allImages,
            all_links_analysis: allLinks,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
        
        await job.updateProgress(100);
        
        const processingTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Completed crawl job ${job.id} for project ${projectId}: ${pagesCrawled} pages in ${processingTime}s`);
        
      } catch (error: any) {
        console.error(`❌ Crawl job ${job.id} failed:`, error);
        
        // Update project status to failed
        const supabase = await createClient();
        await supabase
          .from('audit_projects')
          .update({
            status: 'failed',
            error_message: error.message || 'Crawling failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
        
        throw error;
      }
    },
    {
      connection: redisClient,
      concurrency: QUEUE_CONFIG.concurrency,
      limiter: {
        max: QUEUE_CONFIG.concurrency,
        duration: 1000, // 1 second
      },
      // Memory optimization
      maxStalledCount: 1,
      stalledInterval: 30000,
    }
  );
  
  // Handle worker events
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
  });
  
  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });
  
  worker.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled`);
  });
  
  console.log(`🚀 Optimized crawler worker started with concurrency: ${QUEUE_CONFIG.concurrency}`);
}

// Helper functions (optimized)
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = "";
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    urlObj.searchParams.sort();
    return urlObj.href;
  } catch {
    return url;
  }
}

function shouldSkipUrl(url: string): boolean {
  const SKIP_EXTENSIONS = [
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".pdf",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".rar", ".7z", ".tar", ".gz",
    ".mp3", ".mp4", ".avi", ".mov", ".wmv",
  ];
  
  const lowerUrl = url.toLowerCase();
  if (SKIP_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext))) return true;
  if (lowerUrl.includes("/wp-content/uploads/")) return true;
  return false;
}
