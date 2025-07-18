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
    const { data: projects } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: auditResults } = await supabase
      .from('audit_results')
      .select(`
        *,
        scraped_pages!inner(
          audit_project_id,
          audit_projects!inner(
            user_id
          )
        )
      `)
      .eq('scraped_pages.audit_projects.user_id', user.id);

    // Calculate statistics
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(s => s.status === 'crawling' || s.status === 'analyzing').length || 0;
    const totalPagesAnalyzed = auditResults?.length || 0;
    const averageScore = auditResults && auditResults.length > 0
      ? Math.round(auditResults.reduce((sum, r) => sum + (r.overall_score || 0), 0) / auditResults.length)
      : 0;

    const recentProjects = projects?.slice(0, 5) || [];

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalPagesAnalyzed,
      averageScore,
      recentProjects,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
} 