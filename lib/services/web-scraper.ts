import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

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
  private urlQueue: string[];

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

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style').remove();

      // Extract page data
      const rawTitle = $('title').text().trim() || '';
      const title = this.cleanTitle(rawTitle);
      const content = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Extract links
      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const absoluteUrl = this.makeAbsoluteUrl(href, url);
          if (absoluteUrl) links.push(absoluteUrl);
        }
      });

      // Extract images
      const images: string[] = [];
      $('img[src]').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, url);
          if (absoluteUrl) images.push(absoluteUrl);
        }
      });

      // Extract meta tags
      const meta = {
        description: $('meta[name="description"]').attr('content') || undefined,
        keywords: $('meta[name="keywords"]').attr('content') || undefined,
        ogTitle: $('meta[property="og:title"]').attr('content') || undefined,
        ogDescription: $('meta[property="og:description"]').attr('content') || undefined,
        ogImage: $('meta[property="og:image"]').attr('content') || undefined,
      };

      return {
        url,
        title,
        content,
        html: response.data,
        statusCode: response.status,
        links: [...new Set(links)], // Remove duplicates
        images: [...new Set(images)],
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
        const linkUrl = new URL(link);
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
} 