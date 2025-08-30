import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError?.message 
      }, { status: 401 });
    }

    // Fetch all data in parallel for better performance
    const [profileResult, projectsResult, statsResult] = await Promise.all([
      // Fetch user profile
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // Fetch user's audit projects (limited to recent ones for performance)
      supabase
        .from('audit_projects')
        .select('id, company_name, base_url, status, pages_analyzed, total_pages, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Fetch optimized stats using a single query
      supabase
        .from('audit_projects')
        .select(`
          id,
          status,
          pages_analyzed,
          total_pages,
          audit_results!inner(
            overall_score
          )
        `)
        .eq('user_id', user.id)
    ]);

    // Handle profile data
    let profile = profileResult.data;
    if (!profile) {
      // Create basic profile from auth user data
      profile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        role: 'user',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        auth_method: user.app_metadata?.provider || 'email',
        has_password: !user.app_metadata?.provider,
      };
    } else {
      // Add auth method info to existing profile
      profile = {
        ...profile,
        auth_method: user.app_metadata?.provider || 'email',
        has_password: !user.app_metadata?.provider,
      };
    }

    // Handle projects data
    const projects = projectsResult.data || [];

    // Calculate optimized stats
    const allProjects = statsResult.data || [];
    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter(p => p.status === 'crawling' || p.status === 'analyzing').length;
    
    // Calculate total pages and average score more efficiently
    let totalPagesAnalyzed = 0;
    let totalScore = 0;
    let scoreCount = 0;
    
    allProjects.forEach(project => {
      totalPagesAnalyzed += project.pages_analyzed || 0;
      if (project.audit_results && project.audit_results.length > 0) {
        project.audit_results.forEach(result => {
          if (result.overall_score) {
            totalScore += result.overall_score;
            scoreCount++;
          }
        });
      }
    });
    
    const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    const stats = {
      totalProjects,
      activeProjects,
      totalPagesAnalyzed,
      averageScore,
    };

    return NextResponse.json({
      profile,
      projects,
      stats,
    });

  } catch (error) {
    console.error('Profile data API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}
