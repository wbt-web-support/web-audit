import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from('audit_sessions')
      .select('id')
      .eq('user_id', user.id);

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No sessions found' });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Recalculate count for each session
    for (const session of sessions) {
      try {
        // Count pages that have been analyzed
        const { data: analyzedPages, error: countError } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('audit_session_id', session.id)
          .not('analysis_status', 'is', null)
          .neq('analysis_status', 'pending');

        if (countError) {
          errors.push(`Session ${session.id}: ${countError.message}`);
          continue;
        }

        const actualAnalyzedCount = analyzedPages?.length || 0;

        // Update the session with the correct count
        const { error: updateError } = await supabase
          .from('audit_sessions')
          .update({ pages_analyzed: actualAnalyzedCount })
          .eq('id', session.id);

        if (updateError) {
          errors.push(`Session ${session.id}: ${updateError.message}`);
        } else {
          updatedCount++;
        }
      } catch (error) {
        errors.push(`Session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Recalculated counts for ${updatedCount} sessions`,
      updatedSessions: updatedCount,
      totalSessions: sessions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 