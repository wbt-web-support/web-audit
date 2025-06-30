import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Get audit session
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session can be stopped
    if (!['crawling', 'analyzing'].includes(session.status)) {
      return NextResponse.json(
        { error: 'Session is not running' },
        { status: 400 }
      );
    }

    // Stop the process by updating status to failed
    await supabase
      .from('audit_sessions')
      .update({
        status: 'failed',
        error_message: `${session.status} stopped by user`,
      })
      .eq('id', id);

    return NextResponse.json({ 
      message: `${session.status} stopped successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 