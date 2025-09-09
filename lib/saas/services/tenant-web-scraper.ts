/**
 * Tenant Web Scraper
 * Multi-tenant web scraping service with resource management
 */

import axios from 'axios';
import { parse } from 'node-html-parser';
import { URL } from 'url';
import { tenantQueueManager } from '../queue/tenant-queue-manager';
import { tenantManager } from '../core/tenant-manager';
import { rateLimiter } from '../core/rate-limiter';
import { errorLogger } from '@/lib/logging/error-logger';
import { CrawlOptions, PageData, CrawlJob, Tenant } from '../types';

export interface TenantCrawlOptions extends CrawlOptions {
  tenantId: string;
  projectId: string;
  priority?: number;
  background?: boolean;
}

export class TenantWebScraper {
  private baseUrl: URL;
  private options: Required<CrawlOptions>;
  private visitedUrls: Set<string>;
  private urlQueue: string[];
  private tenantId: string;
  private projectId: string;

  constructor(
    baseUrl: string, 
    tenantId: string,
    projectId: string,
    options: CrawlOptions = {}
  ) {
    this.baseUrl = new URL(baseUrl);
    this.tenantId = tenantId;
    this.projectId = projectId;
    this.options = {
      maxPages: options.maxPages || 50,
      maxDepth: options.maxDepth || 3,
      followExternal: options.followExternal || false,
      respectRobotsTxt: options.respectRobotsTxt || true,
      userAgent: options.userAgent || 'WebAuditBot/1.0',
      timeout: options.timeout || 30000,
    };
    this.visitedUrls = new Set();
    this.urlQueue = [this.normalizeUrl(baseUrl)];
  }

  /**
   * Start crawling with tenant queue system
   */
  async crawlWithQueue(
    options: TenantCrawlOptions,
    onPageScraped?: (page: PageData) => Promise<void>
  ): Promise<{ jobId: string; queueName: string; estimatedTime?: number }> {
    try {
      // Check rate limits
      const rateLimitInfo = await rateLimiter.checkRateLimit(
        this.tenantId,
        '/api/scrape/start'
      );

      if (rateLimitInfo.remaining <= 0) {
        throw new Error(`Rate limit exceeded. Try again at ${rateLimitInfo.resetTime.toISOString()}`);
      }

      // Check tenant limits
      const limitCheck = await tenantManager.checkTenantLimits(
        this.tenantId,
        'currentCrawls',
        1
      );

      if (!limitCheck.allowed) {
        throw new Error(`Tenant limit exceeded: ${limitCheck.reason}`);
      }

      // Get tenant configuration
      const tenant = await tenantManager.getTenant(this.tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Create tenant-specific queue if it doesn't exist
      const queueName = 'web-scraping';
      let queue = tenantQueueManager.getTenantQueue(this.tenantId, queueName);
      
      if (!queue) {
        queue = await tenantQueueManager.createTenantQueue(
          this.tenantId,
          queueName,
          this.processScrapingJob.bind(this)
        );
      }

      // Prepare job data
      const jobData = {
        baseUrl: this.baseUrl.href,
        options: this.options,
        initialUrl: this.urlQueue[0],
        tenantId: this.tenantId,
        projectId: this.projectId,
        onPageScraped: !!onPageScraped,
        timestamp: new Date().toISOString(),
        priority: options.priority || 1,
      };

      // Add job to queue
      const job = await tenantQueueManager.addTenantJob(
        this.tenantId,
        queueName,
        jobData,
        {
          priority: options.priority || 1,
          delay: 0,
        }
      );

      // Calculate estimated time based on tenant limits and queue size
      const estimatedTime = this.calculateEstimatedTime(tenant, options);

      // Update tenant usage
      await tenantManager.incrementUsage(this.tenantId, 'monthlyCrawls', 1);

      console.log(`📝 Tenant scraping job ${job.id} queued for ${this.tenantId}:${this.baseUrl.href}`);
      
      return {
        jobId: job.id!,
        queueName: `tenant:${this.tenantId}:${queueName}`,
        estimatedTime,
      };
    } catch (error) {
      console.error('❌ Error queuing tenant scraping job:', error);
      throw error;
    }
  }

  /**
   * Process scraping job with tenant isolation
   */
  private async processScrapingJob(job: any): Promise<any> {
    const startTime = Date.now();
    const { baseUrl, options, initialUrl, tenantId, projectId } = job.data;
    
    try {
      console.log(`🔄 Processing tenant scraping job ${job.id} for ${tenantId}:${baseUrl}`);
      
      // Verify tenant is still active
      const tenant = await tenantManager.getTenant(tenantId);
      if (!tenant || tenant.status !== 'active') {
        throw new Error(`Tenant ${tenantId} is not active`);
      }

      // Recreate scraper instance with job data
      const scraper = new TenantWebScraper(baseUrl, tenantId, projectId, options);
      scraper.urlQueue = [initialUrl];
      
      const pages: PageData[] = [];
      let processedCount = 0;
      const maxPages = Math.min(options.maxPages || 50, tenant.limits.maxPagesPerProject);

      // Process pages with progress updates and tenant limits
      const onPageScraped = async (page: PageData) => {
        pages.push(page);
        processedCount++;
        
        // Update job progress
        const progress = Math.round((processedCount / maxPages) * 100);
        await job.updateProgress(progress);
        
        console.log(`📊 Tenant scraping progress: ${processedCount}/${maxPages} pages (${progress}%)`);
        
        // Check tenant limits during processing
        if (processedCount >= tenant.limits.maxPagesPerProject) {
          console.log(`⚠️ Reached tenant page limit (${tenant.limits.maxPagesPerProject})`);
          return;
        }
      };

      // Perform the actual crawling
      const crawledPages = await scraper.crawl(onPageScraped);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Tenant scraping job ${job.id} completed: ${crawledPages.length} pages in ${duration}ms`);

      // Update tenant usage
      await tenantManager.updateTenantUsage(tenantId, {
        currentPages: tenant.usage.currentPages + crawledPages.length,
      });

      return {
        success: true,
        data: {
          pages: crawledPages,
          totalPages: crawledPages.length,
          duration,
          tenantId,
          projectId,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Tenant scraping job ${job.id} failed after ${duration}ms:`, errorMessage);
      
      // Log error with tenant context
      await errorLogger.logQueueError(
        `tenant:${tenantId}:web-scraping`,
        job.id!,
        `Tenant scraping job failed: ${errorMessage}`,
        error as Error
      );
      
      return {
        success: false,
        error: errorMessage,
        duration,
        tenantId,
      };
    }
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedTime(tenant: Tenant, options: TenantCrawlOptions): number {
    const maxPages = Math.min(options.maxPages || 50, tenant.limits.maxPagesPerProject);
    const avgTimePerPage = 2000; // 2 seconds per page
    const concurrency = Math.min(tenant.limits.maxWorkers, 5);
    
    return Math.ceil((maxPages * avgTimePerPage) / concurrency / 1000); // in seconds
  }

  /**
   * Get scraping job status
   */
  static async getScrapingJobStatus(tenantId: string, jobId: string): Promise<any> {
    try {
      const queueName = 'web-scraping';
      const queue = tenantQueueManager.getTenantQueue(tenantId, queueName);
      
      if (!queue) {
        throw new Error('Tenant scraping queue not found');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const state = await job.getState();
      const progress = job.progress;
      const returnValue = job.returnvalue;
      const failedReason = job.failedReason;

      return {
        jobId,
        tenantId,
        state,
        progress,
        returnValue,
        failedReason,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      console.error(`❌ Error getting tenant scraping job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel scraping job
   */
  static async cancelScrapingJob(tenantId: string, jobId: string): Promise<boolean> {
    try {
      const queueName = 'web-scraping';
      const queue = tenantQueueManager.getTenantQueue(tenantId, queueName);
      
      if (!queue) {
        throw new Error('Tenant scraping queue not found');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await job.remove();
      
      // Update tenant usage
      await tenantManager.decrementUsage(tenantId, 'currentCrawls', 1);
      
      console.log(`🗑️ Tenant scraping job ${jobId} cancelled for tenant ${tenantId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error cancelling tenant scraping job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get scraping queue stats for tenant
   */
  static async getScrapingQueueStats(tenantId: string): Promise<any> {
    try {
      return await tenantQueueManager.getTenantQueueStats(tenantId, 'web-scraping');
    } catch (error) {
      console.error('❌ Error getting tenant scraping queue stats:', error);
      throw error;
    }
  }

  /**
   * Traditional crawl method (for backward compatibility)
   */
  async crawl(onPageScraped?: (page: PageData) => Promise<void>): Promise<PageData[]> {
    const pages: PageData[] = [];

    console.log(`🚀 Starting tenant crawl with maxPages: ${this.options.maxPages}, maxDepth: ${this.options.maxDepth}`);
    console.log(`📍 Base URL: ${this.baseUrl.href}`);
    console.log(`🏢 Tenant ID: ${this.tenantId}`);
    console.log(`📋 Initial queue: ${this.urlQueue.length} URLs`);

    while (this.urlQueue.length > 0 && this.visitedUrls.size < this.options.maxPages) {
      const url = this.urlQueue.shift()!;
      const normalizedUrl = this.normalizeUrl(url);
      
      if (this.visitedUrls.has(normalizedUrl)) continue;
      this.visitedUrls.add(normalizedUrl);

      try {
        const pageData = await this.scrapePage(normalizedUrl);
        pages.push(pageData);
        
        if (onPageScraped) {
          try {
            await onPageScraped(pageData);
          } catch (error) {
            console.log('Crawling stopped by callback:', error);
            break;
          }
        }

        // Add internal links to queue (normalized)
        const internalLinks = this.filterInternalLinks(pageData.links);
        const newLinks = internalLinks
          .map(link => this.normalizeUrl(link))
          .filter(link => !this.visitedUrls.has(link));
        
        console.log(`🔗 Page: ${normalizedUrl}`);
        console.log(`   Total links found: ${pageData.links.length}`);
        console.log(`   Internal links: ${internalLinks.length}`);
        console.log(`   New links to crawl: ${newLinks.length}`);
        console.log(`   Queue size: ${this.urlQueue.length + newLinks.length}`);
        
        this.urlQueue.push(...newLinks);
      } catch (error) {
        console.error(`Error scraping ${normalizedUrl}:`, error);
        pages.push({
          url: normalizedUrl,
          title: '',
          content: '',
          html: '',
          statusCode: 0,
          links: [],
          images: [],
          meta: {},
        });
      }
    }

    console.log(`✅ Tenant crawl completed!`);
    console.log(`   Pages crawled: ${pages.length}`);
    console.log(`   URLs visited: ${this.visitedUrls.size}`);
    console.log(`   Queue remaining: ${this.urlQueue.length}`);
    console.log(`   Max pages limit: ${this.options.maxPages}`);

    return pages;
  }

  /**
   * Scrape individual page with tenant-specific settings
   */
  async scrapePage(url: string): Promise<PageData> {
    try {
      // Check rate limits before making request
      const rateLimitInfo = await rateLimiter.checkRateLimit(
        this.tenantId,
        '/api/scrape/page'
      );

      if (rateLimitInfo.remaining <= 0) {
        throw new Error(`Rate limit exceeded for page scraping`);
      }

      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
        },
        maxRedirects: 5,
      });

      const root = parse(response.data);
      
      // Remove script and style elements
      root.querySelectorAll('script, style').forEach(el => el.remove());

      // Extract page data
      const titleElement = root.querySelector('title');
      const rawTitle = titleElement?.text?.trim() || '';
      const title = this.cleanTitle(rawTitle);
      const bodyElement = root.querySelector('body');
      const content = bodyElement?.text?.replace(/\s+/g, ' ').trim() || '';
      
      // Extract links from multiple sources
      const links: string[] = [];
      
      // 1. Standard anchor tags
      root.querySelectorAll('a[href]').forEach(element => {
        const href = element.getAttribute('href');
        if (href) {
          const absoluteUrl = this.makeAbsoluteUrl(href, url);
          if (absoluteUrl) links.push(absoluteUrl);
        }
      });
      
      // 2. Links in navigation elements
      const navSelectors = [
        'nav a[href]', '.navigation a[href]', '.menu a[href]', '.nav-menu a[href]',
        '.navbar a[href]', '.header a[href]', '.footer a[href]', '.sidebar a[href]',
        '.breadcrumb a[href]', '.breadcrumbs a[href]', '.pagination a[href]',
        '.page-numbers a[href]', '.pager a[href]'
      ];
      
      navSelectors.forEach(selector => {
        root.querySelectorAll(selector).forEach(element => {
          const href = element.getAttribute('href');
          if (href) {
            const absoluteUrl = this.makeAbsoluteUrl(href, url);
            if (absoluteUrl) links.push(absoluteUrl);
          }
        });
      });
      
      // 3. Links in main content areas
      const contentSelectors = [
        'main a[href]', 'article a[href]', '.content a[href]', '.post-content a[href]',
        '.entry-content a[href]', '.page-content a[href]'
      ];
      
      contentSelectors.forEach(selector => {
        root.querySelectorAll(selector).forEach(element => {
          const href = element.getAttribute('href');
          if (href) {
            const absoluteUrl = this.makeAbsoluteUrl(href, url);
            if (absoluteUrl) links.push(absoluteUrl);
          }
        });
      });

      // Extract images
      const images: string[] = [];
      root.querySelectorAll('img[src]').forEach(element => {
        const src = element.getAttribute('src');
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, url);
          if (absoluteUrl) images.push(absoluteUrl);
        }
      });

      // Extract meta tags
      const meta = {
        description: root.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
        keywords: root.querySelector('meta[name="keywords"]')?.getAttribute('content') || undefined,
        ogTitle: root.querySelector('meta[property="og:title"]')?.getAttribute('content') || undefined,
        ogDescription: root.querySelector('meta[property="og:description"]')?.getAttribute('content') || undefined,
        ogImage: root.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined,
      };

      return {
        url,
        title,
        content,
        html: response.data,
        statusCode: response.status,
        links: Array.from(new Set(links)), // Remove duplicates
        images: Array.from(new Set(images)),
        meta,
      };
    } catch (error: any) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  // Utility methods (same as original WebScraper)
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.hash = '';
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      urlObj.searchParams.sort();
      return urlObj.href;
    } catch {
      return url;
    }
  }

  private makeAbsoluteUrl(href: string, currentUrl: string): string | null {
    try {
      if (href.startsWith('//')) {
        return this.normalizeUrl(new URL(href, `${this.baseUrl.protocol}${href}`).href);
      }
      
      const absoluteUrl = new URL(href, currentUrl);
      
      if (!['http:', 'https:'].includes(absoluteUrl.protocol)) {
        return null;
      }

      return this.normalizeUrl(absoluteUrl.href);
    } catch {
      return null;
    }
  }

  private filterInternalLinks(links: string[]): string[] {
    return links.filter(link => {
      try {
        if (link.startsWith('#') && !link.includes('/')) {
          return false;
        }
        
        if (link.startsWith('javascript:') || link.startsWith('mailto:') || link.startsWith('tel:')) {
          return false;
        }
        
        const linkUrl = new URL(link);
        
        if (!['http:', 'https:'].includes(linkUrl.protocol)) {
          return false;
        }
        
        return linkUrl.hostname === this.baseUrl.hostname;
      } catch {
        return false;
      }
    });
  }

  private cleanTitle(title: string): string {
    if (!title) return '';
    
    let cleanedTitle = title
      .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, '')
      .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, '')
      .replace(/\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i, '')
      .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, '')
      .replace(/ExpandToggle.*$/i, '')
      .replace(/MenuExpand.*$/i, '')
      .replace(/Surfacebook-icon.*$/i, '')
      .replace(/insta-icon.*$/i, '')
      .replace(/ExpandExpand.*$/i, '')
      .replace(/Facebook$/i, '')
      .replace(/Instagram$/i, '')
      .replace(/Twitter$/i, '')
      .replace(/icon$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanedTitle || title;
  }
}
