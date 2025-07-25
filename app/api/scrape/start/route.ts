import { createClient } from "@/lib/supabase/server";
import { WebScraper } from "@/lib/services/web-scraper";
import { NextResponse } from "next/server";
import { toast } from "react-toastify";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { extractImagesFromHtmlAndText, extractLinksFromHtmlAndText } from '@/lib/services/extract-resources';

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

// List of file extensions to skip
const SKIP_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
];

// Helper to check if URL should be skipped
function shouldSkipUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  // Skip if URL ends with any of the extensions
  if (SKIP_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext))) return true;
  // Optionally, skip all /wp-content/uploads/ URLs
  if (lowerUrl.includes("/wp-content/uploads/")) return true;
  return false;
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
    const { data: projectData } = await supabase
      .from("audit_projects")
      .select("crawl_type, custom_urls")
      .eq("id", project_id)
      .single();
    const crawl_type = projectData?.crawl_type;
    const custom_urls = projectData?.custom_urls;

    // Validate crawl_type - if not specified, default to 'full'
    if (crawl_type && !["single", "full"].includes(crawl_type)) {
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

    // --- STRIPE KEY URL LOGIC ---
    // Get stripe_key_urls from project (array or null)
    let stripeKeyUrls: string[] = Array.isArray(project.stripe_key_urls)
      ? project.stripe_key_urls
      : typeof project.stripe_key_urls === "string" && project.stripe_key_urls
      ? [project.stripe_key_urls]
      : [];

    // Normalize and replace base URL if present
    const baseUrl = project.base_url.replace(/\/+$/, "");
    stripeKeyUrls = stripeKeyUrls.map((url) => {
      // If url is absolute and starts with http(s), replace its origin with baseUrl's origin
      try {
        const urlObj = new URL(url, baseUrl);
        // If the url already has a base, replace it with project.base_url
        if (urlObj.origin !== new URL(baseUrl).origin) {
          urlObj.protocol = new URL(baseUrl).protocol;
          urlObj.host = new URL(baseUrl).host;
        }
        // If url is relative, make it absolute using baseUrl
        return urlObj.href;
      } catch {
        // If not a valid URL, treat as relative to baseUrl
        return baseUrl + (url.startsWith("/") ? url : "/" + url);
      }
    });

    // Helper to fetch and extract Stripe keys from a URL
    let getStripeKeysFromUrl = async (url: string) => {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const keys = text.match(/pk_(live|test)_[0-9A-Za-z]{24,}/g);
        return keys;
      } catch (err) {
        return null;
      }
    };

    // For each stripeKeyUrl, fetch and extract keys
    let allStripeKeys: { url: string; keys: string[] | null }[] = [];
    for (const url of stripeKeyUrls) {
      const keys = await getStripeKeysFromUrl(url);
      allStripeKeys.push({ url, keys });
    }
    console.log("Stripe key results:", allStripeKeys);

    // Store the Stripe key results in the audit_projects table
    await supabase
      .from("audit_projects")
      .update({ stripe_keys_analysis: allStripeKeys })
      .eq("id", project_id);

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

    // Configure scraper based on crawl type
    // - 'single': Crawl only the base URL (maxPages: 1, maxDepth: 0)
    // - 'full': Crawl the entire website (maxPages: 50, maxDepth: 3)
    const scraperOptions = {
      maxPages: crawl_type === "single" ? 1 : 50,
      maxDepth: crawl_type === "single" ? 0 : 3,
      followExternal: false,
      respectRobotsTxt: true,
    };
    const avgTimePerPage = 1.5; // seconds
    const estimatedTimeSec = scraperOptions.maxPages * avgTimePerPage;

    // Start crawling in the background based on crawl_type
    await crawlWebsite(
      project_id,
      project.base_url,
      user.id,
      existingUrls,
      crawl_type,
      scraperOptions
    );

    // Check custom_urls directly (not via crawler)
    let customUrlResults: { pageLink: string; isPresent: boolean }[] = [];
    if (Array.isArray(custom_urls) && custom_urls.length > 0) {
      customUrlResults = await Promise.all(
        custom_urls.map(async (url: string) => {
          try {
            const res = await fetch(url, { method: "HEAD" });
            return { pageLink: url, isPresent: res.ok };
          } catch {
            return { pageLink: url, isPresent: false };
          }
        })
      );
      // Save customUrlResults to custom_urls_analysis column
      await supabase
        .from("audit_projects")
        .update({ custom_urls_analysis: customUrlResults })
        .eq("id", project_id);

      // Insert present custom URLs into scraped_pages if not already present
      let newCustomPages = 0;
      // Prepare a WebScraper instance for scraping individual pages
      const WebScraperClass = (await import("@/lib/services/web-scraper"))
        .WebScraper;
      const scraper = new WebScraperClass(project.base_url, {});
      for (const result of customUrlResults) {
        if (result.isPresent) {
          const normalizedUrl = normalizeUrl(result.pageLink);
          if (
            !existingUrls.has(normalizedUrl) &&
            !shouldSkipUrl(normalizedUrl)
          ) {
            try {
              // Scrape the page for full data
              const pageData = await scraper.scrapePage(normalizedUrl);
              await supabase.from("scraped_pages").insert({
                audit_project_id: project_id,
                url: normalizedUrl,
                title:
                  pageData.title ||
                  (function () {
                    // fallback: last segment or 'home'
                    try {
                      const urlObj = new URL(normalizedUrl);
                      const segments = urlObj.pathname
                        .split("/")
                        .filter(Boolean);
                      return segments.length > 0
                        ? segments[segments.length - 1]
                        : "home";
                    } catch {
                      return "Custom URL";
                    }
                  })(),
                content: pageData.content,
                html: pageData.html,
                status_code: pageData.statusCode,
              });
              existingUrls.add(normalizedUrl);
              newCustomPages++;
            } catch (err) {
              // If scraping fails, skip this custom URL
              // Optionally, log error
            }
          }
        }
      }
      // After all inserts, increment pages_crawled once if any new custom pages were added
      if (newCustomPages > 0) {
        const { data: projectStats } = await supabase
          .from("audit_projects")
          .select("pages_crawled")
          .eq("id", project_id)
          .single();
        const newCount = (projectStats?.pages_crawled || 0) + newCustomPages;
        await supabase
          .from("audit_projects")
          .update({ pages_crawled: newCount })
          .eq("id", project_id);
      }
    }

    // Now estimatedTimeSec is in scope for the respons
    return NextResponse.json({
      message: "Crawling started",
      project_id,
      isRecrawl: project.status === "completed",
      estimated_time_sec: estimatedTimeSec,
      customUrlResults,
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
  crawlType?: string,
  scraperOptions?: any // or the correct type
) {
  const supabase = await createClient();
  const scraper = new WebScraper(baseUrl, scraperOptions);

  // Aggregate all images across all pages
  const allImages: Array<{
    src: string;
    alt: string;
    format: string;
    size: number | null;
    is_small: boolean | null;
    page_url: string;
  }> = [];
  // Aggregate all links across all pages
  const allLinks: Array<{
    href: string;
    type: "internal" | "external";
    text: string;
    page_url: string;
  }> = [];

  function getFileFormat(url: string): string {
    try {
      const u = new URL(url);
      const ext = u.pathname.split(".").pop();
      return ext ? ext.toLowerCase() : "";
    } catch {
      return "";
    }
  }

  // Helper function to check if URL is a data URL (base64 encoded)
  function isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  async function getImageSize(url: string, skipSizeCheck = false): Promise<number | null> {
    if (skipSizeCheck) return null;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        const size = res.headers.get("content-length");
        return size ? parseInt(size, 10) : null;
      }
    } catch {}
    return null;
  }

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
      // console.log(`Crawling page: ${pageData.url}`);
      // console.log(`Crawling page Data: ${JSON.stringify(pageData)}`);

      // Normalize the URL to prevent hash fragment duplicates
      const normalizedUrl = normalizeUrl(pageData.url);

      // Skip unwanted URLs
      if (shouldSkipUrl(normalizedUrl)) {
        // console.log(`Skipping static or upload URL: ${normalizedUrl}`);
        return; // Don't save or update this page
      }

      // Log if URL was normalized (different from original)
      if (normalizedUrl !== pageData.url) {
        // console.log(`URL normalized: ${pageData.url} → ${normalizedUrl}`);
      }

      // Check if page already exists (using normalized URL)
      const pageExists = existingUrls.has(normalizedUrl);

      if (pageExists) {
        // console.log(`Updating existing page: ${normalizedUrl}`);
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
      // console.log(`Pages crawled: ${pagesCrawled}`);
      // Update progress
      await supabase
        .from("audit_projects")
        .update({ pages_crawled: pagesCrawled })
        .eq("id", projectId);

      // Use shared utility for image and link extraction
      const allPageImages = extractImagesFromHtmlAndText(pageData.html, normalizedUrl);
      const allPageLinks = extractLinksFromHtmlAndText(pageData.html, normalizedUrl);
      allImages.push(...allPageImages);
      allLinks.push(...allPageLinks);
      console.log(`Image section completed - Found ${allPageImages.length} unique images`);
      console.log(`Link section completed - Found ${allPageLinks.length} unique links`);
    });

    // After crawling, store all image analysis in audit_projects
    await supabase
      .from("audit_projects")
      .update({ all_image_analysis: allImages })
      .eq("id", projectId);

    // After crawling, store all links analysis in audit_projects
    await supabase
      .from("audit_projects")
      .update({ all_links_analysis: allLinks })
      .eq("id", projectId);

    // Update project status to completed crawling (ready for analysis)
    await supabase
      .from("audit_projects")
      .update({
        status: "completed",
        total_pages: pagesCrawled,
      })
      .eq("id", projectId);

    // console.log(`Crawling completed (${crawlType || 'full'}): ${pagesCrawled} pages crawled`);
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
