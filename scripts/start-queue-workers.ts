#!/usr/bin/env ts-node

/**
 * Queue Workers Startup Script
 * 
 * This script initializes and starts all queue workers for the web audit system.
 * Run this script to start processing queued jobs.
 * 
 * Usage:
 *   npm run start:workers
 *   or
 *   npx ts-node scripts/start-queue-workers.ts
 */

import { queueManager } from '../lib/queue/queue-manager';
import { getQueueConfig } from '../lib/queue/queue-config';
import { errorLogger } from '../lib/logging/error-logger';
import { memoryMonitor } from '../lib/monitoring/memory-monitor';

// Import job processors
import { WebScraper } from '../lib/services/web-scraper';
import { 
  processLinkExtractionJob 
} from '../lib/services/extract-resources';

class QueueWorkerManager {
  private isShuttingDown = false;

  async start() {
    try {
      console.log('🚀 Starting Queue Workers...');
      
      // Initialize all queues with their processors
      await this.initializeQueues();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      console.log('✅ All queue workers started successfully');
      console.log('📊 Workers are now processing jobs...');
      console.log('💡 Press Ctrl+C to stop workers gracefully');
      
      // Keep the process alive
      await this.keepAlive();
      
    } catch (error) {
      await errorLogger.logError('error', 'Failed to start queue workers', error as Error);
      console.error('❌ Failed to start queue workers:', error);
      process.exit(1);
    }
  }

  private async initializeQueues() {
    const queueConfigs = [
      {
        name: 'web-scraping',
        processor: this.createScrapingProcessor(),
      },
      {
        name: 'content-analysis',
        processor: processLinkExtractionJob,
      },
      {
        name: 'seo-analysis',
        processor: this.createSeoAnalysisProcessor(),
      },
      {
        name: 'performance-analysis',
        processor: this.createPerformanceAnalysisProcessor(),
      },
    ];

    for (const config of queueConfigs) {
      try {
        const queueConfig = await getQueueConfig(config.name);
        
        if (!queueConfig.isActive) {
          console.log(`⏸️ Queue '${config.name}' is disabled, skipping...`);
          continue;
        }

        await queueManager.createQueue(config.name, config.processor);
        console.log(`✅ Queue '${config.name}' initialized with ${queueConfig.concurrency} workers`);
        
      } catch (error) {
        await errorLogger.logError('error', `Failed to initialize queue ${config.name}`, error as Error);
        console.error(`❌ Failed to initialize queue '${config.name}':`, error);
      }
    }
  }

  private createScrapingProcessor() {
    return async (job: any) => {
      const startTime = Date.now();
      const { baseUrl, options, initialUrl, projectId } = job.data;
      
      try {
        console.log(`🔄 Processing scraping job ${job.id} for ${baseUrl}`);
        
        // Recreate scraper instance with job data
        const scraper = new WebScraper(baseUrl, options);
        scraper.urlQueue = [initialUrl];
        
        const pages: any[] = [];
        let processedCount = 0;
        const maxPages = options.maxPages || 50;

        // Process pages with progress updates
        const onPageScraped = async (page: any) => {
          pages.push(page);
          processedCount++;
          
          // Update job progress
          const progress = Math.round((processedCount / maxPages) * 100);
          await job.updateProgress(progress);
          
          console.log(`📊 Scraping progress: ${processedCount}/${maxPages} pages (${progress}%)`);
        };

        // Perform the actual crawling
        const crawledPages = await scraper.crawl(onPageScraped);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Scraping job ${job.id} completed: ${crawledPages.length} pages in ${duration}ms`);

        return {
          success: true,
          data: {
            pages: crawledPages,
            totalPages: crawledPages.length,
            duration,
            projectId,
          },
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await errorLogger.logQueueError('web-scraping', job.id, `Scraping job failed: ${errorMessage}`, error as Error);
        console.error(`❌ Scraping job ${job.id} failed after ${duration}ms:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          duration,
        };
      }
    };
  }

  private createSeoAnalysisProcessor() {
    return async (job: any) => {
      const startTime = Date.now();
      const { html, baseUrl, projectId, pageId } = job.data;
      
      try {
        console.log(`🔄 Processing SEO analysis job ${job.id} for ${baseUrl}`);
        
        // Update job progress
        await job.updateProgress(10);
        
        // TODO: Implement SEO analysis logic
        // This is a placeholder for future SEO analysis implementation
        
        await job.updateProgress(50);
        
        // Simulate SEO analysis work
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await job.updateProgress(90);
        
        const duration = Date.now() - startTime;
        console.log(`✅ SEO analysis job ${job.id} completed in ${duration}ms`);

        return {
          success: true,
          data: {
            seoScore: 85,
            issues: [],
            recommendations: [],
            duration,
            projectId,
            pageId,
          },
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await errorLogger.logQueueError('seo-analysis', job.id, `SEO analysis job failed: ${errorMessage}`, error as Error);
        console.error(`❌ SEO analysis job ${job.id} failed after ${duration}ms:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          duration,
        };
      }
    };
  }

  private createPerformanceAnalysisProcessor() {
    return async (job: any) => {
      const startTime = Date.now();
      const { html, baseUrl, projectId, pageId } = job.data;
      
      try {
        console.log(`🔄 Processing performance analysis job ${job.id} for ${baseUrl}`);
        
        // Update job progress
        await job.updateProgress(10);
        
        // TODO: Implement performance analysis logic
        // This is a placeholder for future performance analysis implementation
        
        await job.updateProgress(50);
        
        // Simulate performance analysis work
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await job.updateProgress(90);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Performance analysis job ${job.id} completed in ${duration}ms`);

        return {
          success: true,
          data: {
            performanceScore: 78,
            metrics: {
              loadTime: 2.5,
              firstContentfulPaint: 1.2,
              largestContentfulPaint: 2.1,
            },
            issues: [],
            recommendations: [],
            duration,
            projectId,
            pageId,
          },
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await errorLogger.logQueueError('performance-analysis', job.id, `Performance analysis job failed: ${errorMessage}`, error as Error);
        console.error(`❌ Performance analysis job ${job.id} failed after ${duration}ms:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          duration,
        };
      }
    };
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        console.log('⚠️ Shutdown already in progress...');
        return;
      }

      this.isShuttingDown = true;
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Close all queues
        await queueManager.closeAllQueues();
        console.log('✅ All queues closed successfully');
        
        // Close Redis connection
        const { closeRedisConnection } = await import('../lib/queue/redis-connection');
        await closeRedisConnection();
        console.log('✅ Redis connection closed');
        
        console.log('👋 Queue workers stopped gracefully');
        process.exit(0);
        
      } catch (error) {
        await errorLogger.logError('error', 'Error during graceful shutdown', error as Error);
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }

  private async keepAlive() {
    // Keep the process alive and log status periodically
    setInterval(async () => {
      try {
        const stats = await queueManager.getAllQueueStats();
        const totalJobs = stats.reduce((sum, stat) => sum + stat.total, 0);
        
        console.log(`📊 Queue Status: ${totalJobs} total jobs across ${stats.length} queues`);
        
        // Log queue statistics
        await errorLogger.logQueueStats('system', {
          waiting: stats.reduce((sum, stat) => sum + stat.waiting, 0),
          active: stats.reduce((sum, stat) => sum + stat.active, 0),
          completed: stats.reduce((sum, stat) => sum + stat.completed, 0),
          failed: stats.reduce((sum, stat) => sum + stat.failed, 0),
          delayed: stats.reduce((sum, stat) => sum + stat.delayed, 0),
        });
        
      } catch (error) {
        console.error('❌ Error logging queue status:', error);
      }
    }, 60000); // Log every minute

    // Keep the process alive
    return new Promise(() => {});
  }
}

// Start the workers if this script is run directly
if (require.main === module) {
  const workerManager = new QueueWorkerManager();
  workerManager.start().catch((error) => {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  });
}

export { QueueWorkerManager };
