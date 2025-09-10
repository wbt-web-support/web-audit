import axios from 'axios';
import { parse } from 'node-html-parser';
import { URL } from 'url';
import { queueManager, JobData, JobResult } from '@/lib/queue/queue-manager';
import { getQueueConfig } from '@/lib/queue/queue-config';

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  followExternal?: boolean;
  respectRobotsTxt?: boolean;
  userAgent?: string;
  timeout?: number;
}

export interface PageData {
  url: string;
  title: string;
  content: string;
  html: string;
  statusCode: number;
  links: string[];
  images: string[];
  meta: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
}

export class WebScraper {
  private baseUrl: URL;
  private options: Required<CrawlOptions>;
  private visitedUrls: Set<string>;
  public urlQueue: string[];

  constructor(baseUrl: string, options: CrawlOptions = {}) {
    this.baseUrl = new URL(baseUrl);
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

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove hash fragment (everything after #)
      urlObj.hash = '';
      
      // Remove trailing slash from pathname (except for root)
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      // Sort query parameters for consistency
      urlObj.searchParams.sort();
      
      return urlObj.href;
    } catch {
      return url;
    }
  }

  async crawl(onPageScraped?: (page: PageData) => Promise<void>): Promise<PageData[]> {
    const pages: PageData[] = [];

    console.log(`🚀 Starting crawl with maxPages: ${this.options.maxPages}, maxDepth: ${this.options.maxDepth}`);
    console.log(`📍 Base URL: ${this.baseUrl.href}`);
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
            // If the callback throws an error (like stop signal), break out of the loop
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

    console.log(`✅ Crawl completed!`);
    console.log(`   Pages crawled: ${pages.length}`);
    console.log(`   URLs visited: ${this.visitedUrls.size}`);
    console.log(`   Queue remaining: ${this.urlQueue.length}`);
    console.log(`   Max pages limit: ${this.options.maxPages}`);

    return pages;
  }

  async scrapePage(url: string): Promise<PageData> {
    try {
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
      
      // 2. Links in navigation elements (more comprehensive)
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

  private makeAbsoluteUrl(href: string, currentUrl: string): string | null {
    try {
      // Handle protocol-relative URLs
      if (href.startsWith('//')) {
        return this.normalizeUrl(new URL(href, `${this.baseUrl.protocol}${href}`).href);
      }
      
      // Create absolute URL
      const absoluteUrl = new URL(href, currentUrl);
      
      // Filter out non-HTTP(S) protocols
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
        // Skip fragment-only links (they don't lead to new pages)
        if (link.startsWith('#') && !link.includes('/')) {
          return false;
        }
        
        // Skip javascript and other non-HTTP protocols
        if (link.startsWith('javascript:') || link.startsWith('mailto:') || link.startsWith('tel:')) {
          return false;
        }
        
        const linkUrl = new URL(link);
        
        // Only include HTTP/HTTPS links
        if (!['http:', 'https:'].includes(linkUrl.protocol)) {
          return false;
        }
        
        return linkUrl.hostname === this.baseUrl.hostname;
      } catch {
        return false;
      }
    });
  }

  private getUrlDepth(url: string): number {
    try {
      const urlObj = new URL(url);
      const basePathSegments = this.baseUrl.pathname.split('/').filter(Boolean);
      const urlPathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      // Calculate depth relative to base URL
      return urlPathSegments.length - basePathSegments.length;
    } catch {
      return Infinity;
    }
  }

  private cleanTitle(title: string): string {
    if (!title) return '';
    
    // Clean up common unwanted text patterns from page titles
    let cleanedTitle = title
      .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu-related suffixes
      .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, '') // Remove toggle-related suffixes  
      .replace(/\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i, '') // Remove social media suffixes
      .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu with dash separator
      .replace(/ExpandToggle.*$/i, '') // Remove specific "ExpandToggle" text
      .replace(/MenuExpand.*$/i, '') // Remove specific "MenuExpand" text
      .replace(/Surfacebook-icon.*$/i, '') // Remove "Surfacebook-icon" text
      .replace(/insta-icon.*$/i, '') // Remove "insta-icon" text
      .replace(/ExpandExpand.*$/i, '') // Remove repeated "ExpandExpand" text
      .replace(/Facebook$/i, '') // Remove trailing "Facebook"
      .replace(/Instagram$/i, '') // Remove trailing "Instagram"
      .replace(/Twitter$/i, '') // Remove trailing "Twitter"
      .replace(/icon$/i, '') // Remove trailing "icon"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return cleanedTitle || title; // Return original if cleaning resulted in empty string
  }

  // Queue-based crawling methods
  async crawlWithQueue(
    onPageScraped?: (page: PageData) => Promise<void>,
    projectId?: string
  ): Promise<{ jobId: string; queueName: string }> {
    try {
      const queueName = 'web-scraping';
      const config = await getQueueConfig(queueName);
      
      // Create queue if it doesn't exist
      if (!queueManager.queueMap.has(queueName)) {
        await queueManager.createQueue(queueName, this.processScrapingJob.bind(this));
      }

      const jobData: JobData = {
        baseUrl: this.baseUrl.href,
        options: this.options,
        initialUrl: this.urlQueue[0],
        onPageScraped: !!onPageScraped,
        projectId: projectId || null,
        timestamp: new Date().toISOString(),
      };

      const job = await queueManager.addJob(queueName, jobData, {
        priority: 1, // High priority for scraping jobs
        delay: 0,
      });

      console.log(`📝 Web scraping job ${job.id} queued for ${this.baseUrl.href}`);
      
      return {
        jobId: job.id!,
        queueName,
      };
    } catch (error) {
      console.error('❌ Error queuing web scraping job:', error);
      throw error;
    }
  }

  private async processScrapingJob(job: any): Promise<JobResult> {
    const startTime = Date.now();
    const { baseUrl, options, initialUrl, projectId } = job.data;
    
    try {
      console.log(`🔄 Processing scraping job ${job.id} for ${baseUrl}`);
      
      // Recreate scraper instance with job data
      const scraper = new WebScraper(baseUrl, options);
      scraper.urlQueue = [initialUrl];
      
      const pages: PageData[] = [];
      let processedCount = 0;
      const maxPages = options.maxPages || 50;

      // Process pages with progress updates
      const onPageScraped = async (page: PageData) => {
        pages.push(page);
        processedCount++;
        
        // Update job progress
        const progress = Math.round((processedCount / maxPages) * 100);
        await job.updateProgress(progress);
        
        console.log(`📊 Scraping progress: ${processedCount}/${maxPages} pages (${progress}%)`);
        
        // Check if we should stop (e.g., if project was cancelled)
        if (projectId) {
          // You can add project status check here
          // const projectStatus = await checkProjectStatus(projectId);
          // if (projectStatus === 'cancelled') {
          //   throw new Error('Project cancelled');
          // }
        }
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
      
      console.error(`❌ Scraping job ${job.id} failed after ${duration}ms:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  // Static method to get scraping job status
  static async getScrapingJobStatus(jobId: string): Promise<any> {
    try {
      const queueName = 'web-scraping';
      const queue = queueManager.queueMap.get(queueName);
      
      if (!queue) {
        throw new Error('Scraping queue not found');
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
        state,
        progress,
        returnValue,
        failedReason,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      console.error(`❌ Error getting scraping job status for ${jobId}:`, error);
      throw error;
    }
  }

  // Static method to cancel scraping job
  static async cancelScrapingJob(jobId: string): Promise<boolean> {
    try {
      const queueName = 'web-scraping';
      const queue = queueManager.queueMap.get(queueName);
      
      if (!queue) {
        throw new Error('Scraping queue not found');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await job.remove();
      console.log(`🗑️ Scraping job ${jobId} cancelled`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error cancelling scraping job ${jobId}:`, error);
      return false;
    }
  }

  // Static method to get scraping queue stats
  static async getScrapingQueueStats(): Promise<any> {
    try {
      const queueName = 'web-scraping';
      return await queueManager.getQueueStats(queueName);
    } catch (error) {
      console.error('❌ Error getting scraping queue stats:', error);
      throw error;
    }
  }
}

// Export the static methods for external use
export const cancelScrapingJob = WebScraper.cancelScrapingJob;
export const getScrapingQueueStats = WebScraper.getScrapingQueueStats; 