import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch statistics
    const { data: sessions } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: auditResults } = await supabase
      .from('audit_results')
      .select(`
        *,
        scraped_pages!inner(
          audit_session_id,
          audit_sessions!inner(
            user_id
          )
        )
      `)
      .eq('scraped_pages.audit_sessions.user_id', user.id);

    // Calculate statistics
    const totalSessions = sessions?.length || 0;
    const activeSessions = sessions?.filter(s => s.status === 'crawling' || s.status === 'analyzing').length || 0;
    const totalPagesAnalyzed = auditResults?.length || 0;
    const averageScore = auditResults && auditResults.length > 0
      ? Math.round(auditResults.reduce((sum, r) => sum + (r.overall_score || 0), 0) / auditResults.length)
      : 0;

    const recentSessions = sessions?.slice(0, 5) || [];

    return NextResponse.json({
      totalSessions,
      activeSessions,
      totalPagesAnalyzed,
      averageScore,
      recentSessions,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
} 