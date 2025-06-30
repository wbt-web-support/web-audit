import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { page_ids, analyze_all = false } = body;

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Allow analysis when session has completed crawling
    if (session.status !== 'analyzing' && session.status !== 'completed' && session.pages_crawled === 0) {
      return NextResponse.json(
        { error: 'Session must have crawled pages before analysis' },
        { status: 400 }
      );
    }

    // Get pages to analyze
    let query = supabase
      .from('scraped_pages')
      .select('*')
      .eq('audit_session_id', id);

    if (!analyze_all && page_ids && page_ids.length > 0) {
      query = query.in('id', page_ids);
    }

    const { data: pages, error: pagesError } = await query;

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages to analyze' }, { status: 400 });
    }

    // Update session status to analyzing
    await supabase
      .from('audit_sessions')
      .update({ status: 'analyzing' })
      .eq('id', id);

    // Start analysis in background
    analyzePages(id, pages);

    return NextResponse.json({ 
      message: 'Analysis started',
      pages_to_analyze: pages.length 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzePages(sessionId: string, pages: any[]) {
  const supabase = await createClient();
  
  try {
    let analyzedCount = 0;

    for (const page of pages) {
      // Check if analysis should stop
      const { data: currentSession } = await supabase
        .from('audit_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (currentSession?.status === 'failed') {
        throw new Error('Analysis stopped by user');
      }

      console.log(`Starting analysis for page ${page.id}: ${page.title || page.url}`);

      // Do comprehensive AI analysis directly (like individual page routes)
      await performComprehensiveAnalysis(supabase, page);

      analyzedCount++;
      
      // Update progress
      await supabase
        .from('audit_sessions')
        .update({ pages_analyzed: analyzedCount })
        .eq('id', sessionId);

      console.log(`Completed analysis for page ${page.id} (${analyzedCount}/${pages.length})`);
    }

    // Update session status to completed
    await supabase
      .from('audit_sessions')
      .update({
        status: 'completed',
        pages_analyzed: analyzedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    console.log(`All analysis completed for session ${sessionId}`);

  } catch (error: any) {
    console.error('Analysis failed:', error);
    
    // Check if it was stopped by user
    const { data: currentSession } = await supabase
      .from('audit_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (currentSession?.status !== 'failed') {
      // Update session status to failed only if not already set to failed (stopped)
      await supabase
        .from('audit_sessions')
        .update({
          status: 'failed',
          error_message: error.message || 'Analysis failed',
        })
        .eq('id', sessionId);
    }
  }
}

async function performComprehensiveAnalysis(supabase: any, page: any) {
  try {
    // Initialize result object
    let grammarAnalysis, seoAnalysis;
    let grammarScore = 0, seoScore = 0;

    // 1. Grammar Analysis with Gemini AI
    try {
      console.log(`Running grammar analysis for page ${page.id}`);
      grammarAnalysis = await analyzeContentWithGemini(page.content || '');
      grammarScore = grammarAnalysis.overallScore;
      console.log(`Grammar analysis completed for page ${page.id}, score: ${grammarScore}`);
    } catch (error) {
      console.error(`Grammar analysis failed for page ${page.id}:`, error);
      // Provide fallback analysis
      grammarAnalysis = {
        wordCount: 0,
        sentenceCount: 0,
        readabilityScore: 0,
        estimatedReadingTime: 0,
        grammarErrors: [],
        spellingErrors: [],
        issues: ['Analysis failed - please try again'],
        suggestions: ['Retry analysis or check content'],
        tone: 'neutral',
        overallScore: 0,
        contentQuality: 0,
      };
    }

    // 2. SEO Analysis
    try {
      console.log(`Running SEO analysis for page ${page.id}`);
      seoAnalysis = await analyzeSEO(page.html || '', page.url, page.title, page.status_code);
      seoScore = seoAnalysis.overallScore;
      console.log(`SEO analysis completed for page ${page.id}, score: ${seoScore}`);
    } catch (error) {
      console.error(`SEO analysis failed for page ${page.id}:`, error);
      // Provide fallback analysis
      seoScore = 20;
      seoAnalysis = {
        metaTags: { title: page.title },
        headingStructure: { h1Count: 0, h1Text: [], hasProperStructure: false, allHeadings: [] },
        robotsCheck: { robotsTxt: false, robotsMeta: null, indexable: true },
        linksCheck: { totalLinks: 0, internalLinks: 0, externalLinks: 0, brokenLinks: [] },
        redirectCheck: { hasRedirect: false, finalUrl: page.url, redirectChain: [] },
        httpsCheck: { isHttps: page.url.startsWith('https://'), hasSecurityHeaders: false },
        overallScore: 20,
        issues: ['Analysis failed - please try again'],
        recommendations: ['Retry analysis or check page content']
      };
    }

    // 3. Calculate overall score (weighted average)
    const overallScore = Math.round((grammarScore * 0.6) + (seoScore * 0.4));
    const overallStatus = overallScore >= 80 ? 'pass' : overallScore >= 60 ? 'warning' : 'fail';

    // 4. Upsert comprehensive results to database
    const analysisData = {
      scraped_page_id: page.id,
      page_name: page.title || page.url,
      grammar_analysis: grammarAnalysis,
      seo_analysis: seoAnalysis,
      overall_score: overallScore,
      overall_status: overallStatus,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('audit_results')
      .upsert(analysisData, { 
        onConflict: 'scraped_page_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Failed to save analysis results for page ${page.id}:`, error);
      throw error;
    }

    console.log(`Successfully saved analysis results for page ${page.id}`);

  } catch (error) {
    console.error(`Comprehensive analysis failed for page ${page.id}:`, error);
    throw error;
  }
}

async function analyzeContentWithGemini(content: string) {
  try {
    if (!content.trim()) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        readabilityScore: 0,
        estimatedReadingTime: 0,
        grammarErrors: [],
        spellingErrors: [],
        issues: ['No content available for analysis'],
        suggestions: ['Add meaningful content to the page'],
        tone: 'neutral',
        overallScore: 0,
        contentQuality: 0,
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Analyze the following website content for grammar, spelling, and content quality. You MUST strictly follow UK English conventions and flag any US English spellings as grammar errors.

Content to analyze:
"${content}"

Return a JSON object with this exact structure:
{
  "wordCount": number,
  "sentenceCount": number,
  "readabilityScore": number (1-100, where 100 is easiest to read),
  "grammarErrors": [
    {
      "text": "exact text that contains the error",
      "suggestion": "corrected version",
      "type": "grammar|punctuation|structure|US English",
      "explanation": "detailed explanation of why this is incorrect and what rule it violates"
    }
  ],
  "spellingErrors": [
    {
      "text": "misspelled word",
      "suggestion": "correct UK English spelling",
      "position": "context where the error appears"
    }
  ],
  "issues": [
    "detailed description of content issues with specific recommendations for improvement"
  ],
  "suggestions": [
    "specific actionable suggestions for content improvement"
  ],
  "tone": "professional|casual|formal|conversational|academic|marketing",
  "overallScore": number (1-100),
  "contentQuality": number (1-100),
  "estimatedReadingTime": number (in minutes, rounded up)
}

CRITICAL REQUIREMENTS:
1. UK English ONLY - flag ALL US spellings as "US English" type grammar errors:
   - color → colour, center → centre, organize → organise, realize → realise
   - license → licence (noun), defense → defence, gray → grey
   - traveled → travelled, canceled → cancelled, fulfill → fulfil
   
2. Provide detailed explanations for each error:
   - Grammar: Explain the grammatical rule being violated
   - Punctuation: Explain the punctuation rule and correct usage
   - Structure: Explain why the sentence structure is problematic
   - US English: Explain this is US spelling and provide UK equivalent
   
3. For spelling errors, provide context about where the error appears

4. Content issues should be specific and actionable:
   - "The introduction lacks a clear hook to engage readers"
   - "This paragraph contains too many complex sentences that hurt readability"
   - "The conclusion doesn't summarize the main points effectively"
   
5. Make suggestions concrete and implementable:
   - "Break the 45-word sentence in paragraph 2 into two shorter sentences"
   - "Add transition words between paragraphs 3 and 4 to improve flow"
   - "Replace jargon terms with simpler alternatives for broader accessibility"

Focus on being helpful and educational. Each error should teach the user something about proper UK English and good writing practices.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const analysis = JSON.parse(cleanedText);
      
      // Validate required fields and provide defaults
      return {
        wordCount: Math.max(0, analysis.wordCount || 0),
        sentenceCount: Math.max(0, analysis.sentenceCount || 0),
        readabilityScore: Math.min(100, Math.max(0, analysis.readabilityScore || 0)),
        estimatedReadingTime: Math.max(1, analysis.estimatedReadingTime || 1),
        grammarErrors: Array.isArray(analysis.grammarErrors) ? analysis.grammarErrors : [],
        spellingErrors: Array.isArray(analysis.spellingErrors) ? analysis.spellingErrors : [],
        issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        tone: analysis.tone || 'neutral',
        overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
        contentQuality: Math.min(100, Math.max(0, analysis.contentQuality || 0)),
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanedText);
      throw new Error('Invalid response format from Gemini');
    }
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze content with Gemini');
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