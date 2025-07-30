import * as cheerio from 'cheerio';


interface ImageInfo {
  src: string;
  alt: string;
  format: string;
  size: number | null;
  is_small: boolean | null;
  page_url: string;
  width?: number;
  height?: number;
  srcset?: string;
}

export async function extractImagesFromHtmlAndText(
  html: string, 
  baseUrl: string,
  fetchHeaders: Record<string, string> = {}
): Promise<ImageInfo[]> {
  const $ = cheerio.load(html);
  const imageSet = new Set<string>();
  const images: ImageInfo[] = [];

  // Helper function to normalize and validate URLs
  function normalizeUrl(url: string): string | null {
    if (!url || url.startsWith('data:')) return null;
    
    try {
      // Handle WordPress-specific URL patterns
      url = url.replace(/^\/\//, 'https://');
      
      // Remove WordPress size suffixes (e.g., image-150x150.jpg -> image.jpg)
      url = url.replace(/-\d+x\d+(\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff))/gi, '$1');
      
      const normalizedUrl = new URL(url, baseUrl).href;
      
      // Remove query parameters that don't affect the actual image
      const urlObj = new URL(normalizedUrl);
      const preserveParams = ['v', 'version', 'rev', 't'];
      const newSearchParams = new URLSearchParams();
      
      for (const [key, value] of urlObj.searchParams) {
        if (preserveParams.includes(key.toLowerCase())) {
          newSearchParams.set(key, value);
        }
      }
      
      urlObj.search = newSearchParams.toString();
      return urlObj.href;
    } catch {
      return null;
    }
  }

  // Helper function to get image format
  function getImageFormat(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff|avif|heic)(?:\?|$)/i);
    return match ? match[1].toLowerCase() : '';
  }

  // Helper function to check if image size is small (< 500KB = 512000 bytes)
  async function getImageSizeInfo(url: string): Promise<{ size: number | null; is_small: boolean | null }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...fetchHeaders
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const size = parseInt(contentLength, 10);
          return {
            size,
            is_small: size < 512000 // 500KB threshold
          };
        }
      }
    } catch (error) {
      // Silently handle errors to avoid breaking the main function
    }
    
    return { size: null, is_small: null };
  }

  // 1. Extract from <img> tags with enhanced WordPress support
  const imgElements = $('img').toArray();
  
  for (const img of imgElements) {
    const $img = $(img);
    const srcRaw = $img.attr('src');
    const alt = $img.attr('alt') || '';
    const width = parseInt($img.attr('width') || '0', 10) || undefined;
    const height = parseInt($img.attr('height') || '0', 10) || undefined;
    const srcset = $img.attr('srcset') || undefined;
    
    if (srcRaw) {
      const normalizedSrc = normalizeUrl(srcRaw);
      if (normalizedSrc && !imageSet.has(normalizedSrc)) {
        imageSet.add(normalizedSrc);
        images.push({
          src: normalizedSrc,
          alt,
          format: getImageFormat(normalizedSrc),
          size: null,
          is_small: null,
          page_url: baseUrl,
          width,
          height,
          srcset
        });
      }
    }

    // Also extract from srcset attribute
    if (srcset) {
      const srcsetUrls = srcset.split(',').map(entry => {
        const url = entry.trim().split(/\s+/)[0];
        return normalizeUrl(url);
      }).filter(Boolean);

      for (const url of srcsetUrls) {
        if (url && !imageSet.has(url)) {
          imageSet.add(url);
          images.push({
            src: url,
            alt,
            format: getImageFormat(url),
            size: null,
            is_small: null,
            page_url: baseUrl,
            width,
            height,
            srcset
          });
        }
      }
    }
  }

  // 2. Extract from CSS background images
  const elementsWithBg = $('[style*="background"]').toArray();
  for (const el of elementsWithBg) {
    const style = $(el).attr('style') || '';
    const bgMatches = style.match(/background(?:-image)?:\s*url\(['"]?([^'")\s]+)['"]?\)/gi);
    
    if (bgMatches) {
      for (const match of bgMatches) {
        const urlMatch = match.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (urlMatch) {
          const normalizedSrc = normalizeUrl(urlMatch[1]);
          if (normalizedSrc && getImageFormat(normalizedSrc) && !imageSet.has(normalizedSrc)) {
            imageSet.add(normalizedSrc);
            images.push({
              src: normalizedSrc,
              alt: '',
              format: getImageFormat(normalizedSrc),
              size: null,
              is_small: null,
              page_url: baseUrl
            });
          }
        }
      }
    }
  }

  // 3. Extract from data attributes (common in WordPress lazy loading)
  const lazyElements = $('[data-src], [data-lazy-src], [data-original], [data-background-image]').toArray();
  for (const el of lazyElements) {
    const $el = $(el);
    const dataSrc = $el.attr('data-src') || $el.attr('data-lazy-src') || 
                   $el.attr('data-original') || $el.attr('data-background-image');
    
    if (dataSrc) {
      const normalizedSrc = normalizeUrl(dataSrc);
      if (normalizedSrc && !imageSet.has(normalizedSrc)) {
        imageSet.add(normalizedSrc);
        images.push({
          src: normalizedSrc,
          alt: $el.attr('alt') || '',
          format: getImageFormat(normalizedSrc),
          size: null,
          is_small: null,
          page_url: baseUrl
        });
      }
    }
  }

  // 4. Extract from structured data (JSON-LD)
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonLdScripts) {
    try {
      const jsonData = JSON.parse($(script).html() || '{}');
      const findImages = (obj: any): void => {
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (key === 'image' || key === 'logo' || key === 'photo') {
              const imageUrl = typeof value === 'string' ? value : 
                             (typeof value === 'object' && value && 'url' in value) ? value.url : null;
              
              if (imageUrl && typeof imageUrl === 'string') {
                const normalizedSrc = normalizeUrl(imageUrl);
                if (normalizedSrc && !imageSet.has(normalizedSrc)) {
                  imageSet.add(normalizedSrc);
                  images.push({
                    src: normalizedSrc,
                    alt: '',
                    format: getImageFormat(normalizedSrc),
                    size: null,
                    is_small: null,
                    page_url: baseUrl
                  });
                }
              }
            } else if (typeof value === 'object') {
              findImages(value);
            }
          }
        }
      };
      
      findImages(jsonData);
    } catch {
      // Skip invalid JSON
    }
  }

  // 5. Extract from meta tags
  const metaTags = $('meta[property*="image"], meta[name*="image"], meta[content*=".jpg"], meta[content*=".png"], meta[content*=".gif"], meta[content*=".webp"]').toArray();
  for (const meta of metaTags) {
    const content = $(meta).attr('content');
    if (content) {
      const normalizedSrc = normalizeUrl(content);
      if (normalizedSrc && getImageFormat(normalizedSrc) && !imageSet.has(normalizedSrc)) {
        imageSet.add(normalizedSrc);
        images.push({
          src: normalizedSrc,
          alt: '',
          format: getImageFormat(normalizedSrc),
          size: null,
          is_small: null,
          page_url: baseUrl
        });
      }
    }
  }

  // 6. Extract from text content (improved regex)
  const textContent = $.html();
  const imageUrlRegex = /(?:https?:)?\/\/[^\s<>'"\)\]\}\,]+\.(?:jpg|jpeg|png|gif|svg|webp|bmp|tiff|avif|heic)(?:\?[^\s<>'"\)\]\}\,]*)?/gi;
  const matches = textContent.match(imageUrlRegex) || [];
  
  for (const match of matches) {
    const normalizedSrc = normalizeUrl(match);
    if (normalizedSrc && !imageSet.has(normalizedSrc)) {
      imageSet.add(normalizedSrc);
      images.push({
        src: normalizedSrc,
        alt: '',
        format: getImageFormat(normalizedSrc),
        size: null,
        is_small: null,
        page_url: baseUrl
      });
    }
  }

  // Filter out common WordPress admin/system images and very small images
  const filteredImages = images.filter(img => {
    const url = img.src.toLowerCase();
    const excludePatterns = [
      '/wp-admin/',
      '/wp-includes/',
      'gravatar.com',
      'loading.gif',
      'spinner.gif',
      'ajax-loader',
      'pixel.gif',
      '1x1.',
      'spacer.',
      'blank.',
      'transparent.'
    ];
    
    return !excludePatterns.some(pattern => url.includes(pattern)) &&
           !(img.width && img.height && img.width < 50 && img.height < 50);
  });

  // Batch process size information for better performance
  const sizePromises = filteredImages.map(async (img, index) => {
    const sizeInfo = await getImageSizeInfo(img.src);
    return { index, ...sizeInfo };
  });

  try {
    const sizeResults = await Promise.allSettled(sizePromises);
    
    sizeResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { size, is_small } = result.value;
        filteredImages[index].size = size;
        filteredImages[index].is_small = is_small;
      }
    });
  } catch (error) {
    console.warn('Error fetching image sizes:', error);
  }

  return filteredImages;
}

// Helper function for batch processing with rate limiting
export async function extractImagesWithRateLimit(
  html: string,
  baseUrl: string,
  options: {
    maxConcurrent?: number;
    delay?: number;
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<ImageInfo[]> {
  const {
    maxConcurrent = 5,
    delay = 100,
    timeout = 10000,
    headers = {}
  } = options;

  // Add timeout to fetch headers
  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ...headers
  };

  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const result = await extractImagesFromHtmlAndText(html, baseUrl, fetchHeaders);
        resolve(result);
      } catch (error) {
        console.error('Error extracting images:', error);
        resolve([]);
      }
    }, delay);
  });
}
 
//website wide links extraction
export function extractLinksFromHtmlAndText(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  
  // Define patterns for non-essential links to exclude
  const excludePatterns = [
    // Asset files
    /\.(css|js|jpg|jpeg|png|gif|webp|svg|ico|pdf|doc|docx|zip|rar|mp3|mp4|avi|mov|eot|woff|woff2|ttf|otf)(\?.*)?$/i,
    
    // Feeds and API endpoints
    /\/(feed|rss|atom|api)\/?(\?.*)?$/i,
    /\/comments\/feed\/?$/i,
    
    // Search and template URLs
    /\?s=\{.*\}$/i,
    /\{.*\}/,
    
    // Schema and technical fragments
    /\/#\/schema\//i,
    /\/#breadcrumb$/i,
    /\/#primaryimage$/i,
    /\/#website$/i,
    /\/#organization$/i,
    /\/#main$/i,
    /\/#content$/i,
    /\/#header$/i,
    /\/#footer$/i,
    
    // WordPress specific
    /\/wp-content\//i,
    /\/wp-admin\//i,
    /\/wp-includes\//i,
    
    // Other technical patterns
    /\/xmlrpc\.php/i,
    /\/robots\.txt/i,
    /\/sitemap.*\.xml/i,
  ];
  
  // Helper function to check if URL should be excluded
  const shouldExcludeUrl = (url: string): boolean => {
    return excludePatterns.some(pattern => pattern.test(url));
  };
  
  // Helper function to normalize URLs for deduplication
  const normalizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      // Normalize hostname (remove www if present)
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // Normalize pathname
      let pathname = urlObj.pathname.toLowerCase();
      // Remove trailing slash for comparison (except root)
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      // Handle index files
      pathname = pathname.replace(/\/(index\.(html?|php))$/i, '');
      
      // Remove common tracking and cache-busting parameters
      const paramsToRemove = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'ref', 'source', 'campaign',
        'v', 'ver', 'version', 'cache', 'timestamp', '_t'
      ];
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      
      // Sort remaining parameters for consistent comparison
      const sortedParams = new URLSearchParams();
      Array.from(urlObj.searchParams.keys())
        .sort()
        .forEach(key => {
          sortedParams.set(key, urlObj.searchParams.get(key) || '');
        });
      
      const searchString = sortedParams.toString();
      const search = searchString ? '?' + searchString : '';
      
      return `${urlObj.protocol}//${hostname}${pathname}${search}`;
    } catch {
      return url.toLowerCase();
    }
  };

  // 1. Extract from <a> tags with improved filtering
  const aTags = $('a[href]').toArray();
  const linksFromTags = aTags
    .map((a) => {
      let hrefRaw = $(a).attr('href') || '';
      let text = $(a).text().trim();
      
      // Skip empty hrefs, just fragments, or javascript links
      if (!hrefRaw || 
          hrefRaw === '#' || 
          hrefRaw.startsWith('javascript:') ||
          hrefRaw.startsWith('mailto:') ||
          hrefRaw.startsWith('tel:')) {
        return null;
      }
      
      // Skip fragment-only links (but allow fragment + path)
      if (hrefRaw.startsWith('#') && !hrefRaw.includes('/')) {
        return null;
      }
      
      let href: string;
      try {
        href = new URL(hrefRaw, baseUrl).href;
      } catch {
        return null; // Invalid URL
      }
      
      // Check against exclude patterns
      if (shouldExcludeUrl(href)) {
        return null;
      }
      
      let type: 'internal' | 'external' = 'external';
      try {
        const hrefUrl = new URL(href);
        const base = new URL(baseUrl);
        type = hrefUrl.hostname === base.hostname ? 'internal' : 'external';
      } catch {
        return null;
      }
      
      return {
        href,
        type,
        text,
        page_url: baseUrl,
      };
    })
    .filter((link): link is NonNullable<typeof link> => link !== null);

  // 2. Extract from text and raw HTML (improved and more selective)
  function extractLinksFromText(text: string, baseUrl: string) {
    const linkUrls: string[] = [];
    
    // Only extract URLs that look like actual pages, not assets
    const urlRegex = /https?:\/\/[^\s<>'"\)\]]+/gi;
    const matches = text.match(urlRegex);
    if (matches) {
      // Filter out obvious asset URLs even from text
      const filteredMatches = matches.filter(url => !shouldExcludeUrl(url));
      linkUrls.push(...filteredMatches);
    }
    
    // Find relative links (start with /, but not //) - be more selective
    const relativeRegex = /\b\/(?!\/)[a-zA-Z0-9\-_\/]+(?:\?[^\s<>'"\)\]]*)?/gi;
    const relativeMatches = text.match(relativeRegex);
    if (relativeMatches) {
      relativeMatches.forEach(match => {
        // Skip if it looks like an asset or technical path
        if (shouldExcludeUrl(match)) {
          return;
        }
        
        try {
          const absoluteUrl = new URL(match, baseUrl).href;
          if (!shouldExcludeUrl(absoluteUrl)) {
            linkUrls.push(absoluteUrl);
          }
        } catch {
          // Invalid URL, skip
        }
      });
    }
    
    // Remove duplicates
    const uniqueLinks = [...new Set(linkUrls)];
    
    // Map to link objects
    return uniqueLinks.map(href => {
      let type: 'internal' | 'external' = 'external';
      try {
        const hrefUrl = new URL(href);
        const base = new URL(baseUrl);
        type = hrefUrl.hostname === base.hostname ? 'internal' : 'external';
      } catch {
        type = 'external';
      }
      return {
        href,
        type,
        text: '',
        page_url: baseUrl,
      };
    });
  }

  // Extract from specific content areas to reduce noise
  const contentSelectors = [
    'main', 'article', '.content', '.post-content', 
    'nav', '.navigation', '.menu', '.nav-menu',
    '.breadcrumb', '.breadcrumbs'
  ];
  
  let targetText = '';
  contentSelectors.forEach(selector => {
    const element = $(selector);
    if (element.length > 0) {
      targetText += ' ' + element.text();
    }
  });
  
  // Fallback to body if no specific content areas found
  if (!targetText.trim()) {
    targetText = $('body').text();
  }
  
  // Also include the raw HTML but be more selective
  const htmlForParsing = $('nav, main, article, .content, .menu').html() || '';
  const combinedText = targetText + ' ' + htmlForParsing;
  
  const additionalLinks = extractLinksFromText(combinedText, baseUrl);
  
  // Combine all links
  const allLinks = [...linksFromTags, ...additionalLinks];
  
  // Multi-level deduplication for maximum redundancy control
  const seenUrls = new Map<string, any>();
  const seenTexts = new Set<string>();
  
  // First pass: normalize and deduplicate by URL
  allLinks.forEach(link => {
    const normalizedUrl = normalizeUrl(link.href);
    
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.set(normalizedUrl, link);
    } else {
      // If we've seen this URL, keep the one with better text content
      const existing = seenUrls.get(normalizedUrl);
      if (link.text && link.text.length > (existing.text?.length || 0)) {
        seenUrls.set(normalizedUrl, link);
      }
    }
  });
  
  // Convert map back to array
  let uniqueLinks = Array.from(seenUrls.values());
  
  // Second pass: remove near-duplicate URLs (fuzzy matching)
  const finalLinks: typeof uniqueLinks = [];
  
  uniqueLinks.forEach(link => {
    const currentUrl = new URL(link.href);
    const currentPath = currentUrl.pathname.toLowerCase();
    
    // Check if this is a near-duplicate of an already added link
    const isDuplicate = finalLinks.some(existingLink => {
      try {
        const existingUrl = new URL(existingLink.href);
        const existingPath = existingUrl.pathname.toLowerCase();
        
        // Check for common duplicate patterns
        if (currentUrl.hostname === existingUrl.hostname) {
          // Exact path match (already handled above, but double-check)
          if (currentPath === existingPath) return true;
          
          // Similar paths (e.g., /contact and /contact-us)
          const pathSimilarity = calculatePathSimilarity(currentPath, existingPath);
          if (pathSimilarity > 0.8 && Math.abs(currentPath.length - existingPath.length) < 5) {
            return true;
          }
          
          // Check for index variations
          if ((currentPath === '/' && existingPath === '/index') ||
              (currentPath === '/index' && existingPath === '/') ||
              (currentPath + '/index' === existingPath) ||
              (existingPath + '/index' === currentPath)) {
            return true;
          }
        }
        
        return false;
      } catch {
        return false;
      }
    });
    
    if (!isDuplicate) {
      finalLinks.push(link);
    }
  });
  
  // Helper function to calculate path similarity
  function calculatePathSimilarity(path1: string, path2: string): number {
    const segments1 = path1.split('/').filter(s => s);
    const segments2 = path2.split('/').filter(s => s);
    
    if (segments1.length === 0 && segments2.length === 0) return 1;
    if (segments1.length === 0 || segments2.length === 0) return 0;
    
    let matches = 0;
    const maxLength = Math.max(segments1.length, segments2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (segments1[i] === segments2[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }
  
  // Final filtering - remove links that don't seem to be actual content pages
  const essentialLinks = finalLinks.filter(link => {
    try {
      const url = new URL(link.href);
      
      // Skip links with no meaningful path (just domain)
      if (url.pathname === '/' && !url.search && link.type === 'external') {
        return false;
      }
      
      // Skip links that are clearly technical even if they passed earlier filters
      if (url.pathname.includes('/.') || // Hidden files
          url.pathname.includes('/admin') ||
          url.pathname.includes('/login') ||
          url.pathname.includes('/register') && !link.text) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  });
  
  return essentialLinks;
}

// New function for detailed image analysis one page at a time
export async function analyzeImagesDetailed(html: string, baseUrl: string) {
  const images = await extractImagesFromHtmlAndText(html, baseUrl);
  
  // Analyze image characteristics
  const analysis = {
    totalImages: images.length,
    imagesWithAlt: images.filter((img: ImageInfo) => img.alt && img.alt.trim() !== '').length,
    imagesWithoutAlt: images.filter((img: ImageInfo) => !img.alt || img.alt.trim() === '').length,
    formatBreakdown: {} as Record<string, number>,
    images: images.map((img: ImageInfo) => ({
      src: img.src,
      alt: img.alt,
      format: img.format,
      sizeKb: img.size,
      isLessThan500kb: img.is_small,
      hasAlt: img.alt && img.alt.trim() !== '',
      page_url: img.page_url
    })),
    issues: [] as string[],
    recommendations: [] as string[]
  };

  // Calculate format breakdown
  images.forEach((img: ImageInfo) => {
    const format = img.format.toLowerCase();
    analysis.formatBreakdown[format] = (analysis.formatBreakdown[format] || 0) + 1;
  });

  // Generate issues and recommendations
  if (analysis.imagesWithoutAlt > 0) {
    analysis.issues.push(`${analysis.imagesWithoutAlt} images are missing alt text`);
    analysis.recommendations.push('Add descriptive alt text to all images for accessibility');
  }

  if (analysis.totalImages === 0) {
    analysis.issues.push('No images found on the page');
    analysis.recommendations.push('Consider adding relevant images to improve user engagement');
  }

  const missingAltPercentage = (analysis.imagesWithoutAlt / analysis.totalImages) * 100;
  if (missingAltPercentage > 50) {
    analysis.issues.push(`High percentage (${missingAltPercentage.toFixed(1)}%) of images missing alt text`);
    analysis.recommendations.push('Prioritize adding alt text to improve accessibility and SEO');
  }

  return analysis;
}

// New function for detailed link analysis
export async function analyzeLinksDetailed(html: string, baseUrl: string) {
  const links = extractLinksFromHtmlAndText(html, baseUrl);
  
  // Analyze link characteristics
  const internalLinks = links.filter(link => link.type === 'internal');
  const externalLinks = links.filter(link => link.type === 'external');
  
  const analysis = {
    totalLinks: links.length,
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    linksWithText: links.filter(link => link.text && link.text.trim() !== '').length,
    linksWithoutText: links.filter(link => !link.text || link.text.trim() === '').length,
    links: links.map(link => ({
      href: link.href,
      type: link.type,
      text: link.text,
      page_url: link.page_url
    })),
    issues: [] as string[],
    recommendations: [] as string[]
  };

  // Generate issues and recommendations
  if (analysis.totalLinks === 0) {
    analysis.issues.push('No links found on the page');
    analysis.recommendations.push('Add relevant internal and external links to improve navigation and SEO');
  }

  if (analysis.internalLinks === 0 && analysis.externalLinks > 0) {
    analysis.issues.push('No internal links found - only external links present');
    analysis.recommendations.push('Add internal links to improve site navigation and SEO');
  }

  if (analysis.externalLinks === 0 && analysis.internalLinks > 0) {
    analysis.issues.push('No external links found');
    analysis.recommendations.push('Consider adding relevant external links for credibility and user value');
  }

  const linksWithoutTextPercentage = (analysis.linksWithoutText / analysis.totalLinks) * 100;
  if (linksWithoutTextPercentage > 30) {
    analysis.issues.push(`High percentage (${linksWithoutTextPercentage.toFixed(1)}%) of links without descriptive text`);
    analysis.recommendations.push('Add descriptive link text for better accessibility and SEO');
  }

  if (analysis.externalLinks > analysis.internalLinks * 2) {
    analysis.issues.push('Too many external links compared to internal links');
    analysis.recommendations.push('Balance external and internal links for better site structure');
  }

  return analysis;
} 