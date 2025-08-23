import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all crawling projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from('audit_projects')
      .select(`
        id,
        base_url,
        status,
        created_at,
        updated_at,
        pages_crawled,
        total_pages,
        total_images,
        total_links,
        internal_links,
        external_links
      `)
      .eq('user_id', user.id)
      .eq('status', 'crawling')
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching crawling projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Format the response
    const crawlingProjects = projects?.map(project => ({
      id: project.id,
      base_url: project.base_url,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at,
      crawl_progress: {
        pages_crawled: project.pages_crawled || 0,
        total_pages: project.total_pages || 0,
        total_images: project.total_images || 0,
        total_links: project.total_links || 0,
        internal_links: project.internal_links || 0,
        external_links: project.external_links || 0
      }
    })) || [];

    return NextResponse.json({
      crawlingProjects,
      totalCrawling: crawlingProjects.length
    });

  } catch (error) {
    console.error('Background status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
