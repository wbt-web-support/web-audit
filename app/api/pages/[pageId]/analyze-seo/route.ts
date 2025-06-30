import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the specific page
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', params.pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify page belongs to user's session
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('user_id')
      .eq('id', page.audit_session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized access to page' }, { status: 403 });
    }

    // Check for cached SEO analysis result (unless force refresh is requested)
    if (!forceRefresh) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('audit_results')
        .select('seo_analysis, created_at')
        .eq('scraped_page_id', params.pageId)
        .maybeSingle();

      if (!cacheError && cachedResult && cachedResult.seo_analysis) {
        // Return cached result
        console.log('Returning cached SEO analysis for page:', params.pageId);
        return NextResponse.json({
          ...cachedResult.seo_analysis,
          cached: true,
          cached_at: cachedResult.created_at
        });
      }
    } else {
      console.log('Force refresh requested for SEO analysis of page:', params.pageId);
    }

    const html = page.html || '';
    const pageUrl = page.url;
    
    if (!html.trim()) {
      const emptyAnalysis = {
        metaTags: {
          title: page.title,
          description: null,
          keywords: null,
          robots: null,
          canonical: null,
          ogTitle: null,
          ogDescription: null,
          viewport: null,
        },
        headingStructure: {
          h1Count: 0,
          h1Text: [],
          hasProperStructure: false,
          allHeadings: [],
        },
        robotsCheck: {
          robotsTxt: false,
          robotsMeta: null,
          indexable: true,
        },
        linksCheck: {
          totalLinks: 0,
          internalLinks: 0,
          externalLinks: 0,
          brokenLinks: [],
        },
        redirectCheck: {
          hasRedirect: page.status_code !== 200,
          finalUrl: pageUrl,
          redirectChain: [],
        },
        httpsCheck: {
          isHttps: pageUrl.startsWith('https://'),
          hasSecurityHeaders: false,
        },
        overallScore: 20, // Low score for missing content
        issues: ['No HTML content available for SEO analysis'],
        recommendations: ['Ensure the page has proper HTML content']
      };

      // Upsert the SEO analysis result
      await upsertAnalysisResult(supabase, params.pageId, page.title, 'seo_analysis', emptyAnalysis, 20);

      return NextResponse.json(emptyAnalysis);
    }

    // Perform comprehensive SEO analysis
    console.log('Performing SEO analysis for page:', params.pageId);
    const seoAnalysis = await analyzeSEO(html, pageUrl, page.title, page.status_code);
    
    // Upsert the SEO analysis result
    await upsertAnalysisResult(supabase, params.pageId, page.title, 'seo_analysis', seoAnalysis, seoAnalysis.overallScore);

    console.log('Cached SEO analysis result for page:', params.pageId);
    
    return NextResponse.json(seoAnalysis);
  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO' },
      { status: 500 }
    );
  }
}

async function upsertAnalysisResult(
  supabase: any, 
  pageId: string, 
  pageName: string | null, 
  analysisType: string, 
  analysisData: any, 
  score: number
) {
  const status = score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail';
  
  // Create the update object dynamically
  const updateData: any = {
    page_name: pageName,
    updated_at: new Date().toISOString()
  };
  
  // Set the specific analysis field
  updateData[analysisType] = analysisData;

  // Also update overall score if this is better than current
  const { data: existingResult } = await supabase
    .from('audit_results')
    .select('overall_score')
    .eq('scraped_page_id', pageId)
    .maybeSingle();

  if (!existingResult || !existingResult.overall_score || score > existingResult.overall_score) {
    updateData.overall_score = score;
    updateData.overall_status = status;
  }

  // Upsert: Insert if doesn't exist, update if exists  
  const { error } = await supabase
    .from('audit_results')
    .upsert({
      scraped_page_id: pageId,
      ...updateData
    }, {
      onConflict: 'scraped_page_id'
    });

  if (error) {
    console.error('Error upserting SEO analysis result:', error);
    throw error;
  }
}

async function analyzeSEO(html: string, url: string, pageTitle: string | null, statusCode: number | null) {
  // Meta tags analysis  
  const cleanTitle = extractTitle(html) || pageTitle;
  const metaTags = {
    title: cleanTitle,
    description: extractMetaContent(html, 'description'),
    keywords: extractMetaContent(html, 'keywords'),
    robots: extractMetaContent(html, 'robots'),
    canonical: extractLinkHref(html, 'canonical'),
    ogTitle: extractMetaProperty(html, 'og:title'),
    ogDescription: extractMetaProperty(html, 'og:description'),
    viewport: extractMetaContent(html, 'viewport'),
  };

  // Heading structure analysis  
  const headingStructure = analyzeHeadings(html);

  // Robots check
  const robotsCheck = {
    robotsTxt: false, // Would need separate request
    robotsMeta: metaTags.robots,
    indexable: !metaTags.robots?.includes('noindex'),
  };

  // Links analysis
  const linksCheck = analyzeLinks(html, url);

  // Redirect check
  const redirectCheck = {
    hasRedirect: statusCode !== 200,
    finalUrl: url,
    redirectChain: [], // Would need to track during crawling
  };

  // HTTPS check
  const httpsCheck = {
    isHttps: url.startsWith('https://'),
    hasSecurityHeaders: false, // Would need response headers
  };

  // Calculate overall SEO score
  let score = 0;
  const issues = [];
  const recommendations = [];

  // Title tag scoring (20 points)
  if (metaTags.title) {
    if (metaTags.title.length >= 30 && metaTags.title.length <= 60) {
      score += 20;
    } else if (metaTags.title.length > 0) {
      score += 10;
      issues.push(`Title tag length is ${metaTags.title.length} characters (optimal: 30-60)`);
      recommendations.push('Optimize title tag length to 30-60 characters');
    }
  } else {
    issues.push('Missing title tag');
    recommendations.push('Add a descriptive title tag');
  }

  // Description meta tag scoring (15 points)
  if (metaTags.description) {
    if (metaTags.description.length >= 120 && metaTags.description.length <= 160) {
      score += 15;
    } else if (metaTags.description.length > 0) {
      score += 8;
      issues.push(`Meta description length is ${metaTags.description.length} characters (optimal: 120-160)`);
      recommendations.push('Optimize meta description length to 120-160 characters');
    }
  } else {
    issues.push('Missing meta description');
    recommendations.push('Add a compelling meta description');
  }

  // H1 tag scoring (15 points)
  if (headingStructure.hasProperStructure) {
    score += 15;
  } else if (headingStructure.h1Count === 0) {
    issues.push('Missing H1 tag');
    recommendations.push('Add exactly one H1 tag to the page');
  } else if (headingStructure.h1Count > 1) {
    score += 8;
    issues.push(`Multiple H1 tags found (${headingStructure.h1Count})`);
    recommendations.push('Use only one H1 tag per page');
  }

  // Heading hierarchy scoring (10 points)
  if (headingStructure.allHeadings.length > 1) {
    score += 10;
  } else {
    issues.push('Poor heading structure');
    recommendations.push('Use proper heading hierarchy (H1 > H2 > H3...)');
  }

  // HTTPS scoring (10 points)
  if (httpsCheck.isHttps) {
    score += 10;
  } else {
    issues.push('Page not served over HTTPS');
    recommendations.push('Implement HTTPS for better security and SEO');
  }

  // Indexability scoring (10 points)
  if (robotsCheck.indexable) {
    score += 10;
  } else {
    issues.push('Page is not indexable (noindex directive found)');
    recommendations.push('Remove noindex directive if page should be indexed');
  }

  // Canonical URL scoring (5 points)
  if (metaTags.canonical) {
    score += 5;
  } else {
    issues.push('Missing canonical URL');
    recommendations.push('Add canonical URL to prevent duplicate content issues');
  }

  // Viewport meta tag scoring (5 points)
  if (metaTags.viewport) {
    score += 5;
  } else {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
  }

  // Links scoring (5 points)
  if (linksCheck.totalLinks > 0) {
    score += 5;
  } else {
    issues.push('No links found on the page');
    recommendations.push('Add relevant internal and external links');
  }

  // Open Graph scoring (5 points)
  if (metaTags.ogTitle && metaTags.ogDescription) {
    score += 5;
  } else {
    issues.push('Missing Open Graph tags');
    recommendations.push('Add Open Graph tags for better social media sharing');
  }

  return {
    metaTags,
    headingStructure,
    robotsCheck,
    linksCheck,
    redirectCheck,
    httpsCheck,
    overallScore: Math.min(100, score),
    issues,
    recommendations
  };
}

function extractTitle(html: string): string | null {
  // Try to extract clean title from <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    let title = titleMatch[1].trim();
    
    // Clean up common unwanted text patterns
    title = title
      .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu-related suffixes
      .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, '') // Remove toggle-related suffixes
      .replace(/\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i, '') // Remove social media suffixes
      .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu with dash separator
      .replace(/ExpandToggle.*$/i, '') // Remove specific "ExpandToggle" text
      .replace(/MenuExpand.*$/i, '') // Remove specific "MenuExpand" text
      .replace(/Facebook$/i, '') // Remove trailing "Facebook"
      .trim();
    
    return title || null;
  }
  return null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractMetaProperty(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function analyzeHeadings(html: string) {
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const allHeadingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  
  const h1Text = h1Matches.map(match => match.replace(/<[^>]*>/g, '').trim());
  
  const allHeadings = allHeadingMatches.map(match => {
    const level = parseInt(match.match(/<h(\d)/)?.[1] || '1');
    const text = match.replace(/<[^>]*>/g, '').trim();
    return { level, text };
  });

  return {
    h1Count: h1Matches.length,
    h1Text,
    hasProperStructure: h1Matches.length === 1,
    allHeadings,
  };
}

function analyzeLinks(html: string, baseUrl: string) {
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
  const links = linkMatches.map(match => {
    const href = match.match(/href=["']([^"']*?)["']/)?.[1] || '';
    return href;
  }).filter(href => href && !href.startsWith('#'));

  const totalLinks = links.length;
  const externalLinks = links.filter(link => 
    link.startsWith('http') && !link.includes(new URL(baseUrl).hostname)
  ).length;
  const internalLinks = totalLinks - externalLinks;

  return {
    totalLinks,
    internalLinks,
    externalLinks,
    brokenLinks: [], // Would need to check each link
  };
} 