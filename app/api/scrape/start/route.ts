import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { WebScraper } from '@/lib/services/web-scraper';

// URL normalization function (same as in WebScraper)
function normalizeUrl(url: string): string {
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Get audit session
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Audit session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'crawling' || session.status === 'analyzing') {
      return NextResponse.json(
        { error: 'Cannot start crawling - session is already running' },
        { status: 400 }
      );
    }

    // Get existing pages for this session to avoid duplicates
    const { data: existingPages } = await supabase
      .from('scraped_pages')
      .select('url')
      .eq('audit_session_id', session_id);

    // Normalize existing URLs to handle hash fragments
    const existingUrls = new Set(
      existingPages?.map(p => normalizeUrl(p.url)) || []
    );

    // Update session status to crawling
    await supabase
      .from('audit_sessions')
      .update({ status: 'crawling' })
      .eq('id', session_id);

    // Start crawling in the background
    crawlWebsite(session_id, session.base_url, user.id, existingUrls);

    return NextResponse.json({ 
      message: 'Crawling started',
      session_id,
      isRecrawl: session.status === 'completed' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function crawlWebsite(sessionId: string, baseUrl: string, userId: string, existingUrls: Set<string>) {
  const supabase = await createClient();
  const scraper = new WebScraper(baseUrl, {
    maxPages: 50,
    maxDepth: 3,
    followExternal: false,
    respectRobotsTxt: true,
  });

  try {
    let pagesCrawled = 0;
    let pagesUpdated = 0;
    let newPages = 0;

    await scraper.crawl(async (pageData) => {
      // Check if session should stop crawling
      const { data: currentSession } = await supabase
        .from('audit_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (currentSession?.status === 'failed') {
        throw new Error('Crawling stopped by user');
      }

      // Normalize the URL to prevent hash fragment duplicates
      const normalizedUrl = normalizeUrl(pageData.url);
      
      // Log if URL was normalized (different from original)
      if (normalizedUrl !== pageData.url) {
        console.log(`URL normalized: ${pageData.url} → ${normalizedUrl}`);
      }

      // Check if page already exists (using normalized URL)
      const pageExists = existingUrls.has(normalizedUrl);

      if (pageExists) {
        console.log(`Updating existing page: ${normalizedUrl}`);
        // Update existing page
        const { error } = await supabase
          .from('scraped_pages')
          .update({
            title: pageData.title,
            content: pageData.content,
            html: pageData.html,
            status_code: pageData.statusCode,
            scraped_at: new Date().toISOString(),
          })
          .eq('audit_session_id', sessionId)
          .eq('url', normalizedUrl);

        if (!error) {
          pagesUpdated++;
          pagesCrawled++;
        }
      } else {
        console.log(`Creating new page: ${normalizedUrl}`);
        // Insert new page (with normalized URL)
      const { error } = await supabase
        .from('scraped_pages')
        .insert({
          audit_session_id: sessionId,
            url: normalizedUrl,
          title: pageData.title,
          content: pageData.content,
          html: pageData.html,
          status_code: pageData.statusCode,
        });

      if (!error) {
          newPages++;
        pagesCrawled++;
          existingUrls.add(normalizedUrl); // Add normalized URL to prevent duplicates in this session
        }
      }
        
        // Update progress
        await supabase
          .from('audit_sessions')
          .update({ pages_crawled: pagesCrawled })
          .eq('id', sessionId);
    });

    // Update session status to completed crawling (ready for analysis)
    await supabase
      .from('audit_sessions')
      .update({
        status: 'completed',
        total_pages: pagesCrawled,
      })
      .eq('id', sessionId);

  } catch (error: any) {
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
          error_message: error.message || 'Crawling failed',
        })
        .eq('id', sessionId);
    }
  }
} 