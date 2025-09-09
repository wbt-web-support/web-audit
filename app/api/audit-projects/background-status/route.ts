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
        all_image_analysis,
        all_links_analysis
      `)
      .eq('user_id', user.id)
      .eq('status', 'crawling')
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching crawling projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Format the response
    const crawlingProjects = projects?.map(project => {
      const images = Array.isArray(project.all_image_analysis) ? project.all_image_analysis : [];
      const links = Array.isArray(project.all_links_analysis) ? project.all_links_analysis : [];
      
      const internalLinks = links.filter(link => link.type === 'internal').length;
      const externalLinks = links.filter(link => link.type === 'external').length;
      
      return {
        id: project.id,
        base_url: project.base_url,
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at,
        crawl_progress: {
          pages_crawled: project.pages_crawled || 0,
          total_pages: project.total_pages || 0,
          total_images: images.length,
          total_links: links.length,
          internal_links: internalLinks,
          external_links: externalLinks
        }
      };
    }) || [];

    return NextResponse.json({
      crawlingProjects,
      totalCrawling: crawlingProjects.length
    });

  } catch (error) {
    console.error('Background status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
