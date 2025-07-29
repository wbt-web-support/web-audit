import * as cheerio from 'cheerio';

export function extractImagesFromHtmlAndText(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  // 1. Extract from <img> tags
  const imgTags = $('img[src]').toArray();
  const imagesFromTags = imgTags.map((img) => {
    const srcRaw = $(img).attr('src') || '';
    const alt = $(img).attr('alt') || '';
    let src = srcRaw;
    try {
      src = new URL(srcRaw, baseUrl).href;
    } catch {}
    const format = src.split('.').pop()?.split('?')[0].toLowerCase() || '';
    return {
      src,
      alt,
      format,
      size: null,
      is_small: null,
      page_url: baseUrl,
    };
  });

  // 2. Extract from text and raw HTML
  function extractImagesFromText(text: string, baseUrl: string): string[] {
    const imageUrls: string[] = [];
    // Find URLs that end with image extensions
    const urlRegex = /https?:\/\/[^\s<>'"\)\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff)/gi;
    const matches = text.match(urlRegex);
    if (matches) imageUrls.push(...matches);
    // Find relative paths
    const relativeRegex = /\/[^\s<>'"\)\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff)/gi;
    const relativeMatches = text.match(relativeRegex);
    if (relativeMatches) {
      relativeMatches.forEach(match => {
        try {
          const absoluteUrl = new URL(match, baseUrl).href;
          imageUrls.push(absoluteUrl);
        } catch {}
      });
    }
    // Find standalone filenames
    const filenameRegex = /\b[^\s<>'"\)\]]+\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff)\b/gi;
    const filenameMatches = text.match(filenameRegex);
    if (filenameMatches) {
      filenameMatches.forEach(match => {
        if (!match.startsWith('http')) {
          try {
            const absoluteUrl = new URL('/' + match, baseUrl).href;
            imageUrls.push(absoluteUrl);
          } catch {}
        }
      });
    }
    return [...new Set(imageUrls)];
  }
  const htmlText = $('body').text() + ' ' + html;
  const additionalImageUrls = extractImagesFromText(htmlText, baseUrl);
  const imagesFromText = additionalImageUrls.map(url => ({
    src: url,
    alt: '',
    format: url.split('.').pop()?.split('?')[0].toLowerCase() || '',
    size: null,
    is_small: null,
    page_url: baseUrl,
  }));

  // Combine and deduplicate by src
  const allImages = [...imagesFromTags, ...imagesFromText];
  const uniqueImages = allImages.filter((img, idx, self) =>
    idx === self.findIndex(i => i.src === img.src)
  );
  return uniqueImages;
}

export function extractLinksFromHtmlAndText(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  // 1. Extract from <a> tags
  const aTags = $('a[href]').toArray();
  const linksFromTags = aTags.map((a) => {
    let hrefRaw = $(a).attr('href') || '';
    let text = $(a).text().trim();
    let href = hrefRaw;
    try {
      href = new URL(hrefRaw, baseUrl).href;
    } catch {
      try {
        href = new URL(hrefRaw, baseUrl).href;
      } catch {}
    }
    let type: 'internal' | 'external' = 'external';
    try {
      const hrefUrl = new URL(href);
      const base = new URL(baseUrl);
      type = hrefUrl.hostname === base.hostname ? 'internal' : 'external';
    } catch {}
    return {
      href,
      type,
      text,
      page_url: baseUrl,
    };
  });

  // 2. Extract from text and raw HTML
  function extractLinksFromText(text: string, baseUrl: string) {
    const linkUrls: string[] = [];
    // Find all http(s) links
    const urlRegex = /https?:\/\/[^\s<>'"\)\]]+/gi;
    const matches = text.match(urlRegex);
    if (matches) linkUrls.push(...matches);
    // Find relative links (start with /, but not //)
    const relativeRegex = /\b\/(?!\/)[^\s<>'"\)\]]+/gi;
    const relativeMatches = text.match(relativeRegex);
    if (relativeMatches) {
      relativeMatches.forEach(match => {
        try {
          const absoluteUrl = new URL(match, baseUrl).href;
          linkUrls.push(absoluteUrl);
        } catch {}
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
      } catch {}
      return {
        href,
        type,
        text: '',
        page_url: baseUrl,
      };
    });
  }
  const htmlText = $('body').text() + ' ' + html;
  const additionalLinks = extractLinksFromText(htmlText, baseUrl);
  const allLinks = [...linksFromTags, ...additionalLinks];
  const uniqueLinks = allLinks.filter((link, idx, self) =>
    idx === self.findIndex(l => l.href === link.href)
  );
  return uniqueLinks;
}

// New function for detailed image analysis
export async function analyzeImagesDetailed(html: string, baseUrl: string) {
  const images = extractImagesFromHtmlAndText(html, baseUrl);
  
  // Analyze image characteristics
  const analysis = {
    totalImages: images.length,
    imagesWithAlt: images.filter(img => img.alt && img.alt.trim() !== '').length,
    imagesWithoutAlt: images.filter(img => !img.alt || img.alt.trim() === '').length,
    formatBreakdown: {} as Record<string, number>,
    images: images.map(img => ({
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
  images.forEach(img => {
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