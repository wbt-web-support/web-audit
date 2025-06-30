import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id, pageId } = await params;
    
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

    // Get the specific page
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', pageId)
      .eq('audit_session_id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get analysis results for this page (single row with all analysis types)
    const { data: results, error: resultsError } = await supabase
      .from('audit_results')
      .select('*')
      .eq('scraped_page_id', pageId)
      .maybeSingle();

    if (resultsError) {
      return NextResponse.json({ error: resultsError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      session,
      page,
      results: results || null // Single result object or null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 