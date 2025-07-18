import { createClient } from "@/lib/supabase/server";
import { WebScraper } from "@/lib/services/web-scraper";
import { NextResponse } from "next/server";
import { toast } from "react-toastify";

// URL normalization function (same as in WebScraper)
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove hash fragment (everything after #)
    urlObj.hash = "";

    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    // Sort query parameters for consistency
    urlObj.searchParams.sort();

    return urlObj.href;
  } catch {
    return url;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    console.log("Starting scraping process...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;
    const { data: projectData } = await supabase.from("audit_projects").select("crawl_type").eq("id", project_id).single();
    const crawl_type = projectData?.crawl_type;
    console.log("**************crawl_type**************",crawl_type);
    console.log("Received body:", body);
    
    // Validate crawl_type - if not specified, default to 'full'
    if (crawl_type && !['single', 'full'].includes(crawl_type)) {
      return NextResponse.json(
        { error: "Invalid crawl_type. Must be 'single' or 'full'" },
        { status: 400 }
      );
    }
    
    if (!project_id) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // Get audit project
    const { data: project, error: projectError } = await supabase
      .from("audit_projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Audit project not found" },
        { status: 404 }
      );
    }

    if (project.status === "crawling" || project.status === "analyzing") {
      return NextResponse.json(
        { error: "Cannot start crawling - project is already running" },
        { status: 400 }
      );
    }

    // Get existing pages for this project to avoid duplicates
    const { data: existingPages } = await supabase
      .from("scraped_pages")
      .select("url")
      .eq("audit_project_id", project_id);

    // Normalize existing URLs to handle hash fragments
    const existingUrls = new Set(
      existingPages?.map((p) => normalizeUrl(p.url)) || []
    );

    // Update project status to crawling
    await supabase
      .from("audit_projects")
      .update({ status: "crawling" })
      .eq("id", project_id);

    // Start crawling in the background based on crawl_type
    await crawlWebsite(project_id, project.base_url, user.id, existingUrls, crawl_type);

    return NextResponse.json({
      message: "Crawling started",
      project_id,
      isRecrawl: project.status === "completed",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function crawlWebsite(
  projectId: string,
  baseUrl: string,
  userId: string,
  existingUrls: Set<string>,
  crawlType?: string
) {
  const supabase = await createClient();
  
  // Configure scraper based on crawl type
  // - 'single': Crawl only the base URL (maxPages: 1, maxDepth: 0)
  // - 'full': Crawl the entire website (maxPages: 50, maxDepth: 3)
  const scraperOptions = {
    maxPages: crawlType === 'single' ? 1 : 50,
    maxDepth: crawlType === 'single' ? 0 : 3,
    followExternal: false,
    respectRobotsTxt: true,
  };
  
  const scraper = new WebScraper(baseUrl, scraperOptions);

  console.log(`Starting crawl with type: ${crawlType || 'full'}`);
  console.log(`Scraper options:`, scraperOptions);

  try {
    let pagesCrawled = 0;
    let pagesUpdated = 0;
    let newPages = 0;
    
    await scraper.crawl(async (pageData) => {
      // Check if project should stop crawling
      const { data: currentProject } = await supabase
        .from("audit_projects")
        .select("status")
        .eq("id", projectId)
        .single();

      if (currentProject?.status === "failed") {
        throw new Error("Crawling stopped by user");
      }
      console.log(`Crawling page: ${pageData.url}`);
      console.log(`Crawling page Data: ${JSON.stringify(pageData)}`);

      // Normalize the URL to prevent hash fragment duplicates
      const normalizedUrl = normalizeUrl(pageData.url);
      
      // Log if URL was normalized (different from original)
      if (normalizedUrl !== pageData.url) {
        console.log(`URL normalized: ${pageData.url} → ${normalizedUrl}`);
      }

      // Check if page already exists (using normalized URL)
      const pageExists = existingUrls.has(normalizedUrl);

      if (pageExists) {
        console.log(`Updating existing page: ${normalizedUrl}`);
        // Update existing page
        const { error } = await supabase
          .from("scraped_pages")
          .update({
            title: pageData.title,
            content: pageData.content,
            html: pageData.html,
            status_code: pageData.statusCode,
            scraped_at: new Date().toISOString(),
          })
          .eq("audit_project_id", projectId)
          .eq("url", normalizedUrl);

        if (!error) {
          pagesUpdated++;
          pagesCrawled++;
        }
      } else {
        console.log(`Creating new page: ${normalizedUrl}`);
        // Insert new page (with normalized URL)
        const { error } = await supabase.from("scraped_pages").insert({
          audit_project_id: projectId,
          url: normalizedUrl,
          title: pageData.title,
          content: pageData.content,
          html: pageData.html,
          status_code: pageData.statusCode,
        });

        if (!error) {
          newPages++;
          pagesCrawled++;
          existingUrls.add(normalizedUrl); // Add normalized URL to prevent duplicates in this project
        }
      }
      console.log(`Pages crawled: ${pagesCrawled}`);
      // Update progress
      await supabase
        .from("audit_projects")
        .update({ pages_crawled: pagesCrawled })
        .eq("id", projectId);
    });

    // Update project status to completed crawling (ready for analysis)
    await supabase
      .from("audit_projects")
      .update({
        status: "completed",
        total_pages: pagesCrawled,
      })
      .eq("id", projectId);

    console.log(`Crawling completed (${crawlType || 'full'}): ${pagesCrawled} pages crawled`);
    
  } catch (error: any) {
    // Check if it was stopped by user
    const { data: currentProject } = await supabase
      .from("audit_projects")
      .select("status")
      .eq("id", projectId)
      .single();

    if (currentProject?.status !== "failed") {
      // Update project status to failed only if not already set to failed (stopped)
      await supabase
        .from("audit_projects")
        .update({
          status: "failed",
          error_message: error.message || "Crawling failed",
        })
        .eq("id", projectId);
    }
  }
}

// function take screenshot of the pages

