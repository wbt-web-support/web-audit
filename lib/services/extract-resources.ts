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