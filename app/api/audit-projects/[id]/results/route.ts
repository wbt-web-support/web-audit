import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Optimized results endpoint for fetching project pages and analysis results
 * Uses separate queries to prevent timeouts and improve performance
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch pages first (faster query)
    const { data: pages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, status_code, audit_project_id, scraped_at, analysis_status')
      .eq('audit_project_id', id)
      .order('scraped_at', { ascending: true });

    if (pagesError) {
      console.error('Pages query error:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    // Fetch analysis results separately (prevents timeout on complex joins)
    const { data: results, error: resultsError } = await supabase
      .from('audit_results')
      .select('*')
      .in('scraped_page_id', pages.map(p => p.id));

    if (resultsError) {
      console.error('Results query error:', resultsError);
      // Continue without results rather than failing completely
    }

    // Create a map of page_id to results for efficient lookup
    const resultsMap = new Map();
    if (results) {
      results.forEach(result => {
        resultsMap.set(result.scraped_page_id, result);
      });
    }

    // Transform data to match expected format
    const pageResults = pages.map((page: any) => ({
      page: {
        id: page.id,
        url: page.url,
        title: page.title,
        status_code: page.status_code,
        audit_project_id: page.audit_project_id,
        scraped_at: page.scraped_at,
        analysis_status: page.analysis_status || 'pending'
      },
      results: resultsMap.get(page.id) || null
    }));

    return NextResponse.json({ 
      project,
      pageResults,
      totalResults: pageResults.filter(p => p.results).length
    });
  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 