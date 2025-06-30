import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
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

    // First verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all pages for this session with their analysis results
    const { data: pagesWithResults, error } = await supabase
      .from('scraped_pages')
      .select(`
        *,
        audit_results (*)
      `)
      .eq('audit_session_id', id)
      .order('scraped_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the expected format
    const pageResults = pagesWithResults.map((page: any) => ({
      page: {
        id: page.id,
        url: page.url,
        title: page.title,
        status_code: page.status_code,
        audit_session_id: page.audit_session_id,
        scraped_at: page.scraped_at,
        analysis_status: page.analysis_status || 'pending'
      },
      results: page.audit_results || null // Single result object or null
    }));

    return NextResponse.json({ 
      session,
      pageResults,
      totalResults: pageResults.filter(p => p.results).length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 