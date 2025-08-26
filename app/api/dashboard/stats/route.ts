import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Promise.all to fetch data in parallel for better performance
    const [projectsResponse, auditResultsResponse] = await Promise.all([
      // Fetch projects with optimized query
      supabase
        .from('audit_projects')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5), // Only fetch recent projects for dashboard

      // Fetch audit results count with optimized query
      supabase
        .from('audit_results')
        .select('overall_score', { count: 'exact', head: true })
        .eq('scraped_pages.audit_projects.user_id', user.id)
    ]);

    const projects = projectsResponse.data || [];
    const auditResults = auditResultsResponse.data || [];

    // Calculate statistics efficiently
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'crawling' || p.status === 'analyzing').length;
    const totalPagesAnalyzed = auditResults.length;
    const averageScore = auditResults.length > 0
      ? Math.round(auditResults.reduce((sum, r) => sum + (r.overall_score || 0), 0) / auditResults.length)
      : 0;

    const recentProjects = projects.slice(0, 5);

    const response = NextResponse.json({
      totalProjects,
      activeProjects,
      totalPagesAnalyzed,
      averageScore,
      recentProjects,
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, max-age=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=300');

    return response;

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
} 