import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project data with real-time crawling information
    const { data: project, error: projectError } = await supabase
      .from("audit_projects")
      .select(`
        *,
        scraped_pages (
          id,
          url,
          title,
          status_code,
          scraped_at
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Calculate real-time statistics
    const totalPages = project.total_pages || 0;
    const crawledPages = project.pages_crawled || 0;
    const totalImages = project.all_image_analysis ? project.all_image_analysis.length : 0;
    const totalLinks = project.all_links_analysis ? project.all_links_analysis.length : 0;
    const internalLinks = project.all_links_analysis ? project.all_links_analysis.filter((link: any) => link.type === 'internal').length : 0;
    const externalLinks = project.all_links_analysis ? project.all_links_analysis.filter((link: any) => link.type === 'external').length : 0;
    
    console.log(`Crawl status for project ${id}: ${crawledPages} pages, ${totalImages} images, ${totalLinks} links (${internalLinks} internal, ${externalLinks} external)`);
    
    // Calculate progress percentage
    let progress = 0;
    if (project.status === 'completed') {
      progress = 100;
    } else if (project.status === 'crawling' && totalPages > 0) {
      progress = Math.min(100, Math.round((crawledPages / totalPages) * 100));
    }

    // Get all crawled pages (no limit)
    const allCrawledPages = project.scraped_pages 
      ? project.scraped_pages
          .sort((a: any, b: any) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      : [];

    return NextResponse.json({
      project: {
        id: project.id,
        base_url: project.base_url,
        status: project.status,
        total_pages: totalPages,
        pages_crawled: crawledPages,
        total_images: totalImages,
        total_links: totalLinks,
        internal_links: internalLinks,
        external_links: externalLinks,
        progress: progress,
        error_message: project.error_message,
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      recent_pages: allCrawledPages,
      is_crawling: project.status === 'crawling',
      is_completed: project.status === 'completed',
      is_failed: project.status === 'failed'
    });

  } catch (error) {
    console.error('Crawl status error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 