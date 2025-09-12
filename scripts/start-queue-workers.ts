#!/usr/bin/env tsx

/**
 * Queue Workers Starter Script
 * Initializes background workers for web scraping, image extraction, and link analysis
 */

import { queueManager } from '../lib/queue/queue-manager';
import { getRedisConnection, isRedisConnected, waitForRedisConnection, getFallbackQueue } from '../lib/queue/redis-connection-fallback';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Web scraping job processor
async function processWebScrapingJob(job: any): Promise<any> {
  try {
    const { url, options = {} } = job.data;
    console.log(`🕷️ Starting web scraping for: ${url}`);
    
    // Simulate web scraping process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Web scraping completed for: ${url}`);
    return {
      success: true,
      data: {
        url,
        title: `Scraped: ${url}`,
        content: 'Sample content',
        links: [],
        images: [],
        statusCode: 200
      },
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Web scraping failed for: ${job.data.url}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: job.data.url
    };
  }
}

// Image extraction job processor
async function processImageExtractionJob(job: any): Promise<any> {
  try {
    const { html, baseUrl, pageUrl } = job.data;
    console.log(`🖼️ Starting image extraction for: ${pageUrl}`);
    
    // Simulate image extraction process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`✅ Image extraction completed for: ${pageUrl}`);
    return {
      success: true,
      data: {
        pageUrl,
        images: [],
        totalImages: 0,
        imagesWithAlt: 0,
        imagesWithoutAlt: 0
      },
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Image extraction failed for: ${job.data.pageUrl}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pageUrl: job.data.pageUrl
    };
  }
}

// Link extraction job processor
async function processLinkExtractionJob(job: any): Promise<any> {
  try {
    const { html, baseUrl, pageUrl } = job.data;
    console.log(`🔗 Starting link extraction for: ${pageUrl}`);
    
    // Simulate link extraction process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Link extraction completed for: ${pageUrl}`);
    return {
      success: true,
      data: {
        pageUrl,
        links: [],
        internalLinks: 0,
        externalLinks: 0,
        totalLinks: 0
      },
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Link extraction failed for: ${job.data.pageUrl}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pageUrl: job.data.pageUrl
    };
  }
}

// Initialize queue workers
async function initializeWorkers() {
  try {
    console.log('🚀 Initializing queue workers...');
    
    // Try Redis connection with shorter timeout
    console.log('⏳ Testing Redis connection...');
    const redisConnected = await waitForRedisConnection(5000); // 5 second timeout
    console.log(`📊 Redis available: ${redisConnected}`);
    
    if (redisConnected) {
      console.log('✅ Using BullMQ with Redis');
      
      // Create web scraping queue and worker
      await queueManager.createQueue('web-scraping', processWebScrapingJob);
      
      // Create image extraction queue and worker
      await queueManager.createQueue('image-extraction', processImageExtractionJob);
      
      // Create link extraction queue and worker
      await queueManager.createQueue('link-extraction', processLinkExtractionJob);
      
      console.log('✅ All BullMQ queues initialized successfully');
      
    } else {
      console.log('⚠️ Redis not available, using fallback in-memory queues');
      
      // Use fallback queue for development
      const fallbackQueue = getFallbackQueue();
      
      // Add some sample jobs to demonstrate functionality
      await fallbackQueue.add('web-scraping', { 
        url: 'https://example.com',
        options: { maxPages: 10 }
      });
      
      await fallbackQueue.add('image-extraction', { 
        html: '<html><body><img src="test.jpg" alt="test"></body></html>',
        baseUrl: 'https://example.com',
        pageUrl: 'https://example.com'
      });
      
      await fallbackQueue.add('link-extraction', { 
        html: '<html><body><a href="/test">Test Link</a></body></html>',
        baseUrl: 'https://example.com',
        pageUrl: 'https://example.com'
      });
      
      console.log('✅ Fallback queues initialized with sample jobs');
    }
    
    // Set up periodic status logging
    setInterval(async () => {
      try {
        if (isRedisConnected()) {
          const stats = await queueManager.getAllQueueStats();
          console.log('📊 Queue Stats:', stats);
        } else {
          const jobs = await getFallbackQueue().getJobs();
          const stats = {
            total: jobs.length,
            processed: jobs.filter(j => j.processed).length,
            failed: jobs.filter(j => j.failed).length,
            pending: jobs.filter(j => !j.processed && !j.failed).length
          };
          console.log('📊 Fallback Queue Stats:', stats);
        }
      } catch (error) {
        console.error('❌ Error getting queue stats:', error);
      }
    }, 30000); // Log every 30 seconds
    
    console.log('🎉 Queue workers are ready and running!');
    
  } catch (error) {
    console.error('❌ Error initializing workers:', error);
    console.log('🔄 Continuing with fallback mode...');
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down workers...');
  try {
    if (isRedisConnected()) {
      await queueManager.closeAllQueues();
    }
    console.log('✅ Workers shut down gracefully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGUSR2', shutdown); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the workers
console.log('🚀 Starting queue workers...');
console.log('📝 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Redis URL:', process.env.REDIS_URL ? 'Configured' : 'Not configured');

initializeWorkers().catch((error) => {
  console.error('❌ Failed to initialize workers:', error);
  process.exit(1);
});
