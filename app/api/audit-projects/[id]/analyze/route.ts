/**
 * Web Page Analysis API Route
 * 
 * This module provides comprehensive web page analysis including:
 * - Grammar and content analysis using Gemini AI
 * - SEO optimization analysis
 * - Performance metrics using PageSpeed Insights
 * - UI/UX analysis with device-specific screenshots
 * - Image and link analysis
 * - Social media meta tag analysis
 * - HTML tag structure analysis
 * 
 * Performance optimizations:
 * - Parallel processing of all analysis types
 * - Intelligent caching of results
 * - Optimized screenshot capture
 * - Reduced API calls through batching
 * - Memory-efficient buffer handling
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer, { Page } from "puppeteer";
import path from "path";
import fs from "fs/promises";
import axios from "axios";
import { analyzePerformanceAndAccessibility } from "./analyzePerformanceWithPageSpeed";
import { analyzeImagesDetailed, analyzeLinksDetailed } from '@/lib/services/extract-resources';

// Initialize AI models and API keys once for better performance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;

// Cache Gemini model instance to avoid repeated initialization
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

/**
 * Updates the pages_analyzed count for a project
 * Optimized to use a single query with count aggregation
 */
async function updatePagesAnalyzedCount(supabase: any, projectId: string) {
  try {
    // Use count aggregation for better performance
    const { count, error } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('audit_project_id', projectId)
      .not('analysis_status', 'is', null)
      .neq('analysis_status', 'pending');

    if (error) {
      console.error('Error counting analyzed pages:', error);
      return;
    }

    const analyzedCount = count || 0;

    // Update project count
    const { error: updateError } = await supabase
      .from('audit_projects')
      .update({ pages_analyzed: analyzedCount })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating pages_analyzed count:', updateError);
    }
  } catch (error) {
    console.error('Error in updatePagesAnalyzedCount:', error);
  }
}

/**
 * Main API endpoint for analyzing web pages
 * Handles both single page (immediate) and multi-page (background) analysis
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body with defaults
    const body = await request.json();
    const {
      page_ids,
      analyze_all = false,
      analysis_types = ["grammar", "seo", "ui", "performance", "tagsAnalysis", "images", "links"],
      use_cache = true,
      background = null,
      force_refresh = false,
    } = body;
  
    // Verify project ownership and existence
    const { data: project, error: projectError } = await supabase
      .from("audit_projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch pages to analyze with optimized query
    const query = supabase
      .from("scraped_pages")
      .select("*")
      .eq("audit_project_id", id);

    const finalQuery = !analyze_all && page_ids?.length > 0 
      ? query.in("id", page_ids)
      : query;

    const { data: pages, error: pagesError } = await finalQuery;

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: "No pages to analyze" }, { status: 400 });
    }

    // Determine processing mode based on page count
    const shouldRunInBackground = background !== null ? background : pages.length > 1;

    if (shouldRunInBackground) {
      // Validate project state for background processing
      if (project.status !== "analyzing" && project.status !== "completed" && project.pages_crawled === 0) {
        return NextResponse.json(
          { error: "Project must have crawled pages before analysis" },
          { status: 400 }
        );
      }

      // Start background analysis
      await supabase
        .from("audit_projects")
        .update({ status: "analyzing" })
        .eq("id", id);

      // Fire and forget background processing
      analyzePages(id, pages, analysis_types, use_cache, force_refresh);

      return NextResponse.json({
        message: "Analysis started",
        pages_to_analyze: pages.length,
        background: true,
      });
    } else {
      // Single page immediate analysis
      const page = pages[0];
      const results = await performSinglePageAnalysis(
        supabase,
        page,
        project,
        analysis_types,
        use_cache,
        force_refresh
      );

      return NextResponse.json({
        ...results,
        background: false,
      });
    }
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Performs comprehensive analysis on a single page
 * Optimized for parallel processing and efficient caching
 */
async function performSinglePageAnalysis(
  supabase: any,
  page: any,
  project: any,
  analysisTypes: string[],
  useCache: boolean,
  forceRefresh: boolean
) {
  try {
    // Update page status to analyzing
    await supabase
      .from("scraped_pages")
      .update({ analysis_status: "analyzing" })
      .eq("id", page.id);

    console.log(`[ANALYSIS] Starting analysis for page ${page.id} (${page.url})`);

    // Initialize analysis variables
    let grammarAnalysis = null;
    let seoAnalysis = null;
    let cached = false;
    let cachedAt = null;

    // Check cache for existing results (performance optimization)
    if (useCache && !forceRefresh) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from("audit_results")
        .select("grammar_analysis, seo_analysis, created_at")
        .eq("scraped_page_id", page.id)
        .maybeSingle();

      if (!cacheError && cachedResult) {
        if (analysisTypes.includes("grammar") && cachedResult.grammar_analysis) {
          grammarAnalysis = cachedResult.grammar_analysis;
          cached = true;
          cachedAt = cachedResult.created_at;
          console.log(`[CACHE] Grammar analysis loaded for page ${page.id}`);
        }
        if (analysisTypes.includes("seo") && cachedResult.seo_analysis) {
          seoAnalysis = cachedResult.seo_analysis;
          cached = true;
          cachedAt = cachedResult.created_at;
          console.log(`[CACHE] SEO analysis loaded for page ${page.id}`);
        }
      }
    }

    // Initialize parallel analysis promises for optimal performance
    const analysisPromises: Promise<any>[] = [];

    // Grammar analysis (AI-powered content analysis)
    const grammarPromise = analysisTypes.includes("grammar") && !grammarAnalysis
      ? analyzeContentWithGemini(page.content || "", project)
      : Promise.resolve(grammarAnalysis);
    analysisPromises.push(grammarPromise);

    // SEO analysis (meta tags, headings, links)
    const seoPromise = analysisTypes.includes("seo") && !seoAnalysis
      ? analyzeSEO(page.html || "", page.url, page.title, page.status_code)
      : Promise.resolve(seoAnalysis);
    analysisPromises.push(seoPromise);

    // Performance analysis (PageSpeed Insights)
    const performancePromise = analysisTypes.includes("performance")
      ? analyzePerformanceAndAccessibility(page.url)
      : Promise.resolve(null);
    analysisPromises.push(performancePromise);

    // Tags analysis (HTML structure analysis)
    const tagsPromise = analysisTypes.includes("tagsAnalysis")
      ? analyzeTags(page.html || "")
      : Promise.resolve(null);
    analysisPromises.push(tagsPromise);

    // Social meta analysis (Open Graph, Twitter cards)
    const socialMetaPromise = analyzeSocialMetaTags(page.html || "");
    analysisPromises.push(socialMetaPromise);

    // Image analysis (extract and analyze images)
    const imagePromise = analysisTypes.includes("images")
      ? analyzeImagesDetailed(page.html || "", page.url)
      : Promise.resolve(null);
    analysisPromises.push(imagePromise);

    // Link analysis (extract and analyze links)
    const linkPromise = analysisTypes.includes("links")
      ? analyzeLinksDetailed(page.html || "", page.url)
      : Promise.resolve(null);
    analysisPromises.push(linkPromise);

    // UI analysis with screenshots (most resource-intensive)
    const screenshotUrls: Record<string, string | null> = { phone: null, tablet: null, desktop: null };
    
    if (analysisTypes.includes("ui")) {
      // Process UI analysis for all devices in parallel
      const uiPromises = ["phone", "tablet", "desktop"].map(async (device) => {
        try {
          console.log(`[UI] Starting ${device} analysis for page ${page.id}`);
          const buffer = await takeScreenshotBuffer(page.url, device as any);
          if (!buffer) return null;
          
          const storagePath = `project_${project.id}/screenshot_${page.id}_${device}.png`;
          const publicUrl = await uploadScreenshotBufferToStorage(buffer, storagePath);
          screenshotUrls[device] = publicUrl;
          
          if (publicUrl) {
            return await analyzeUIImageWithGemini(publicUrl, device);
          }
          return null;
        } catch (err) {
          console.error(`[ERROR] ${device} UI analysis failed:`, err);
          return null;
        }
      });
      
      analysisPromises.push(...uiPromises);
    } else {
      // Add null promises for UI analysis if not requested
      analysisPromises.push(Promise.resolve(null), Promise.resolve(null), Promise.resolve(null));
    }
    // Execute all analysis promises in parallel for maximum performance
    const results = await Promise.all(analysisPromises);
    
    // Extract results in order: grammar, seo, performance, tags, socialMeta, image, link, ui (3 devices)
    const [
      grammarResult, seoResult, performanceResult, tagsResult, socialMetaResult, 
      imageResult, linkResult, phoneUiResult, tabletUiResult, desktopUiResult
    ] = results;

    // Assign results to variables
    grammarAnalysis = grammarResult;
    seoAnalysis = seoResult;
    const performanceAnalysis = performanceResult;
    const tagsAnalysis = tagsResult;
    const socialMetaAnalysis = socialMetaResult;
    const imageAnalysis = imageResult;
    const linkAnalysis = linkResult;
    const phoneUiAnalysis = phoneUiResult;
    const tabletUiAnalysis = tabletUiResult;
    const desktopUiAnalysis = desktopUiResult;

    // Log the performanceAnalysis result
    console.log('[PERFORMANCE ANALYSIS]', performanceAnalysis);

    // Save screenshot URLs in DB
    await supabase
      .from("scraped_pages")
      .update({
        page_screenshot_url_phone: screenshotUrls.phone,
        page_screenshot_url_tablet: screenshotUrls.tablet,
        page_screenshot_url_desktop: screenshotUrls.desktop,
      })
      .eq("id", page.id);


    // --- Custom Instructions Analysis ---
    let customInstructionsAnalysis = null;
    // Defensive: handle both array and string for services
    let servicesArr = Array.isArray(project.services)
      ? project.services
      : typeof project.services === "string"
        ? project.services.split(",").map((s: string) => s.trim())
        : [];
    if (
      project.instructions &&
      servicesArr.includes("custom_instructions")
    ) {
      customInstructionsAnalysis = await analyzeCustomInstructions(
        project.instructions,
        page.html || "",
        screenshotUrls
      );
    }
    console.log("customInstructionsAnalysis**********", customInstructionsAnalysis);
    // Calculate combined score if both analyses are requested
    let overallScore = 0;
    if (grammarAnalysis && seoAnalysis) {
      overallScore = Math.round(
        grammarAnalysis.overallScore * 0.6 + seoAnalysis.overallScore * 0.4
      );
    } else if (grammarAnalysis) {
      overallScore = grammarAnalysis.overallScore;
    } else if (seoAnalysis) {
      overallScore = seoAnalysis.overallScore;
    }

    // Save results to cache
    await upsertAnalysisResult(
      supabase,
      page,
      grammarAnalysis,
      seoAnalysis,
      phoneUiAnalysis,
      tabletUiAnalysis,
      desktopUiAnalysis,
      performanceAnalysis,
      overallScore,
      tagsAnalysis,
      socialMetaAnalysis,
      imageAnalysis,
      linkAnalysis
    );
    console.log(`[DB] Analysis results saved for page ${page.id}`);

    // Mark page as completed
    await supabase
      .from("scraped_pages")
      .update({ analysis_status: "completed" })
      .eq("id", page.id);
    console.log(`[DONE] Analysis completed for page ${page.id}`);

    // Update the pages_analyzed count for the project
    await updatePagesAnalyzedCount(supabase, project.id);

    // Return appropriate response based on what was requested
    if (analysisTypes.includes("performance")) {
      return {
        grammar_analysis: grammarAnalysis,
        seo_analysis: seoAnalysis,
        performance_analysis: performanceAnalysis,
        overall_score: overallScore,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
        custom_instructions_analysis: customInstructionsAnalysis,
        social_meta_analysis: socialMetaAnalysis,
      };
    }
    if (analysisTypes.includes("grammar") && analysisTypes.includes("seo")) {
      return {
        grammar_analysis: grammarAnalysis,
        seo_analysis: seoAnalysis,
        overall_score: overallScore,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
        custom_instructions_analysis: customInstructionsAnalysis,
        social_meta_analysis: socialMetaAnalysis,
      };
    } else if (analysisTypes.includes("grammar")) {
      return {
        ...grammarAnalysis,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
        custom_instructions_analysis: customInstructionsAnalysis,
        social_meta_analysis: socialMetaAnalysis,
      };
    } else if (analysisTypes.includes("seo")) {
      return {
        ...seoAnalysis,
        company_information: null, // SEO analysis doesn't include company info
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
        custom_instructions_analysis: customInstructionsAnalysis,
        social_meta_analysis: socialMetaAnalysis,
      };
    }
    if (analysisTypes.includes("tagsAnalysis")) {
      return {
        grammar_analysis: grammarAnalysis,
        seo_analysis: seoAnalysis,
        performance_analysis: performanceAnalysis,
        tags_analysis: tagsAnalysis,
        overall_score: overallScore,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
        custom_instructions_analysis: customInstructionsAnalysis,
        social_meta_analysis: socialMetaAnalysis,
      };
    }
    if (analysisTypes.includes("images")) {
      return {
        image_analysis: imageAnalysis,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
      };
    }
    if (analysisTypes.includes("links")) {
      return {
        link_analysis: linkAnalysis,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true,
      };
    }

    return { error: "No valid analysis types specified" };
  } catch (error) {
    console.error(`Single page analysis failed for page ${page.id}:`, error);

    // Mark page as failed
    await supabase
      .from("scraped_pages")
      .update({ analysis_status: "failed" })
      .eq("id", page.id);

    // Update the pages_analyzed count for the project (even for failed pages)
    await updatePagesAnalyzedCount(supabase, project.id);

    throw error;
  }
}

async function upsertAnalysisResult(
  supabase: any,
  page: any,
  grammarAnalysis: any,
  seoAnalysis: any,
  phoneUiAnalysis: any,
  tabletUiAnalysis: any,
  desktopUiAnalysis: any,
  performanceAnalysis: any,
  overallScore: number,
  tagsAnalysis: any = null,
  socialMetaAnalysis: any = null,
  imageAnalysis: any = null,
  linkAnalysis: any = null
) {
  const status =
    overallScore >= 80 ? "pass" : overallScore >= 60 ? "warning" : "fail";

  const updateData: any = {
    scraped_page_id: page.id,
    page_name: page.title || page.url,
    overall_score: overallScore,
    overall_status: status,
    updated_at: new Date().toISOString(),
  };

  if (grammarAnalysis) {
    updateData.grammar_analysis = grammarAnalysis;

    // Extract company information if available
    if (grammarAnalysis.companyInformation) {
      updateData.company_information_analysis =
        grammarAnalysis.companyInformation;
      console.log(
        `Saving company information analysis for page ${page.id}: score ${grammarAnalysis.companyInformation.companyInfoScore}`
      );
    }
  }

  if (seoAnalysis) {
    updateData.seo_analysis = seoAnalysis;
  }
  if (performanceAnalysis) {
    updateData.performance_analysis = performanceAnalysis;
  }
  if (phoneUiAnalysis) {
    updateData.phone_ui_quality_analysis = phoneUiAnalysis;
   
  }
  if (tabletUiAnalysis) {
    updateData.tablet_ui_quality_analysis = tabletUiAnalysis;
   
  }
  if (desktopUiAnalysis) {
    updateData.desktop_ui_quality_analysis = desktopUiAnalysis;
  
  }
  if (tagsAnalysis) {
    updateData.tags_analysis = tagsAnalysis;
  }
  if (socialMetaAnalysis) {
    updateData.social_meta_analysis = socialMetaAnalysis;
  }
  if (imageAnalysis) {
    updateData.image_analysis = imageAnalysis;
  }
  if (linkAnalysis) {
    updateData.link_analysis = linkAnalysis;
  }

  const { error } = await supabase.from("audit_results").upsert(updateData, {
    onConflict: "scraped_page_id",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(
      `Failed to save analysis results for page ${page.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Processes multiple pages in controlled batches to prevent API overload
 * Optimized for high-throughput processing with error handling and timeout management
 */
async function analyzePages(
  projectId: string,
  pages: any[],
  analysisTypes: string[],
  useCache: boolean,
  forceRefresh: boolean
) {
  const supabase = await createClient();

  try {
    // Get project data for analysis
    const { data: project, error: projectError } = await supabase
      .from("audit_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Failed to get project data for analysis");
    }

    console.log(`Starting dynamic concurrency queue analysis for ${pages.length} pages`);

    // Configuration for dynamic concurrency queue
    const MAX_CONCURRENT = 5; // Maximum concurrent page analyses
    const TIMEOUT_MS = 300000; // 5 minutes timeout per page
    const MAX_RETRIES = 2; // Maximum retries per page

    let successfulCount = 0;
    let failedCount = 0;
    const failedPages: Array<{pageId: string, error: string}> = [];
    const pageQueue = [...pages]; // Copy pages to queue
    const activePromises = new Map<string, Promise<any>>(); // Track active analyses
    const completedPages = new Set<string>(); // Track completed pages

    // Function to process a single page with retry logic
    const processPage = async (page: any): Promise<any> => {
      let retries = 0;
      
      while (retries <= MAX_RETRIES) {
        try {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Analysis timeout')), TIMEOUT_MS);
          });

          // Create analysis promise
          const analysisPromise = performSinglePageAnalysis(
            supabase,
            page,
            project,
            analysisTypes,
            useCache,
            forceRefresh
          );

          // Race between analysis and timeout
          await Promise.race([analysisPromise, timeoutPromise]);
          
          console.log(`Successfully analyzed page ${page.id}`);
          return { success: true, pageId: page.id };
        } catch (error: any) {
          retries++;
          console.error(`Attempt ${retries} failed for page ${page.id}:`, error.message);
          
          if (retries > MAX_RETRIES) {
            // Mark page as failed after all retries
            await supabase
              .from("scraped_pages")
              .update({ 
                analysis_status: "failed",
                error_message: error.message || "Analysis failed after retries"
              })
              .eq("id", page.id);
            
            return {
              success: false,
              pageId: page.id,
              error: error.message || "Analysis failed after retries",
            };
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    };

    // Function to start processing a page and add to active promises
    const startPageAnalysis = (page: any) => {
      if (completedPages.has(page.id)) return; // Skip if already completed
      
      const promise = processPage(page).then((result) => {
        // Remove from active promises when done
        activePromises.delete(page.id);
        
        // Handle result
        if (result.success) {
          successfulCount++;
        } else {
          failedCount++;
          failedPages.push({
            pageId: result.pageId,
            error: result.error
          });
        }
        
        completedPages.add(page.id);
        console.log(`Page ${page.id} completed. Active: ${activePromises.size}, Queue: ${pageQueue.length}, Completed: ${successfulCount + failedCount}/${pages.length}`);
        
        // Try to start next page from queue
        if (pageQueue.length > 0) {
          const nextPage = pageQueue.shift();
          if (nextPage) {
            startPageAnalysis(nextPage);
          }
        }
        
        return result;
      }).catch((error) => {
        // Handle unexpected errors
        activePromises.delete(page.id);
        failedCount++;
        failedPages.push({
          pageId: page.id,
          error: error.message || 'Unexpected error'
        });
        completedPages.add(page.id);
        console.error(`Unexpected error for page ${page.id}:`, error);
        
        // Try to start next page from queue
        if (pageQueue.length > 0) {
          const nextPage = pageQueue.shift();
          if (nextPage) {
            startPageAnalysis(nextPage);
          }
        }
      });
      
      activePromises.set(page.id, promise);
    };

    // Start initial batch of concurrent analyses
    const initialBatch = Math.min(MAX_CONCURRENT, pages.length);
    console.log(`Starting initial batch of ${initialBatch} concurrent analyses`);
    
    for (let i = 0; i < initialBatch; i++) {
      const page = pageQueue.shift();
      if (page) {
        startPageAnalysis(page);
      }
    }

    // Wait for all pages to complete
    while (activePromises.size > 0 || pageQueue.length > 0) {
      console.log(`Waiting... Active: ${activePromises.size}, Queue: ${pageQueue.length}, Completed: ${successfulCount + failedCount}/${pages.length}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
    }

    // Calculate final statistics
    const finalStatus = failedCount === pages.length ? "failed" : "completed";
    const errorMessage = failedCount > 0 ? 
      `Analysis completed with ${failedCount} failures out of ${pages.length} pages` : null;

    // Update project status and counts
    await Promise.all([
      updatePagesAnalyzedCount(supabase, projectId),
      supabase
        .from("audit_projects")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", projectId)
    ]);

    console.log(`Dynamic concurrency queue analysis completed: ${successfulCount} successful, ${failedCount} failed`);
    
    // Log detailed failure information
    if (failedPages.length > 0) {
      console.error('Failed pages details:', failedPages);
    }
  } catch (error: any) {
    console.error("Dynamic concurrency queue analysis failed:", error);

    // Mark project as failed
    await supabase
      .from("audit_projects")
      .update({
        status: "failed",
        error_message: error.message || "Analysis failed",
      })
      .eq("id", projectId);
  }
}

/**
 * Analyzes content using Gemini AI with optimized performance
 * Includes company information verification and UK English compliance
 */
async function analyzeContentWithGemini(content: string, project?: any) {
  try {
    // Early return for empty content
    if (!content.trim()) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        readabilityScore: 0,
        estimatedReadingTime: 0,
        grammarErrors: [],
        spellingErrors: [],
        issues: ["No content available for analysis"],
        suggestions: ["Add meaningful content to the page"],
        tone: "neutral",
        overallScore: 0,
        contentQuality: 0,
      };
    }

    // Use cached model instance for better performance
    const model = geminiModel;

    // Build comprehensive company information verification section
    let expectedCompanyInfo = "";
    let hasCompanyInfo = false;

    if (
      project &&
      (project.company_name ||
        project.phone_number ||
        project.email ||
        project.address ||
        project.custom_info)
    ) {
      hasCompanyInfo = true;
      expectedCompanyInfo = `

COMPREHENSIVE COMPANY INFORMATION VERIFICATION:
This website should contain accurate and consistent company information. Please verify the following expected details against the website content:

Expected Company Information:`;

      if (project.company_name) {
        expectedCompanyInfo += `\n- Company/Business Name: "${project.company_name}"`;
        expectedCompanyInfo += `\n  → Check if this exact name appears prominently (header, footer, about page, contact page)`;
        expectedCompanyInfo += `\n  → Flag any variations, misspellings, or inconsistencies`;
      }

      if (project.phone_number) {
        expectedCompanyInfo += `\n- Phone Number: "${project.phone_number}"`;
        expectedCompanyInfo += `\n  → Check if this number appears correctly formatted`;
        expectedCompanyInfo += `\n  → Flag any different numbers or formatting inconsistencies`;
      }

      if (project.email) {
        expectedCompanyInfo += `\n- Email Address: "${project.email}"`;
        expectedCompanyInfo += `\n  → Check if this email appears and is properly formatted`;
        expectedCompanyInfo += `\n  → Flag any different email addresses`;
      }

      if (project.address) {
        expectedCompanyInfo += `\n- Physical Address: "${project.address}"`;
        expectedCompanyInfo += `\n  → Check if this address appears consistently`;
        expectedCompanyInfo += `\n  → Flag any variations or incomplete address information`;
      }

      if (project.custom_info) {
        expectedCompanyInfo += `\n- Additional Business Info: "${project.custom_info}"`;
        expectedCompanyInfo += `\n  → Check if this information is accurately represented`;
      }

      expectedCompanyInfo += `

COMPANY INFORMATION ANALYSIS REQUIREMENTS:
1. MISSING INFORMATION: If any expected company details are completely missing from the page content, add specific issues like:
   - "Missing company name '${
     project.company_name || "[Company Name]"
   }' - not found on this page"
   - "Missing contact phone number '${
     project.phone_number || "[Phone]"
   }' - should be visible for customer contact"
   - "Missing email address '${
     project.email || "[Email]"
   }' - important for customer communication"
   - "Missing physical address '${
     project.address || "[Address]"
   }' - essential for business credibility"

2. INCONSISTENT INFORMATION: If company information appears but differs from expected, add issues like:
   - "Company name inconsistency: found '[found name]' but expected '${
     project.company_name || "[Expected]"
   }'"
   - "Phone number mismatch: found '[found number]' but expected '${
     project.phone_number || "[Expected]"
   }'"
   - "Email inconsistency: found '[found email]' but expected '${
     project.email || "[Expected]"
   }'"
   - "Address discrepancy: found '[found address]' but expected '${
     project.address || "[Expected]"
   }'"

3. FORMATTING ISSUES: Check for proper formatting and professional presentation:
   - Phone numbers should be properly formatted (e.g., +44 123 456 7890 or (01234) 567890)
   - Email addresses should be clickable links where appropriate
   - Addresses should be complete and properly formatted
   - Company names should be consistently styled

4. PLACEMENT RECOMMENDATIONS: Add suggestions for better company information placement:
   - "Add company name to page header for better brand visibility"
   - "Include contact information in footer for easy access"
   - "Add contact phone number to contact page"
   - "Display business address prominently for local SEO"

5. CREDIBILITY IMPROVEMENTS: Suggest ways to enhance business credibility:
   - "Add company registration number or VAT number for transparency"
   - "Include business hours information"
   - "Add multiple contact methods for customer convenience"
   - "Consider adding company logo alongside name for brand recognition"

This company information verification should impact the overall content quality score significantly, as accurate business information is crucial for user trust and SEO.`;
    }

    const prompt = `
Analyze the following website content for grammar, spelling, and content quality. You MUST strictly follow UK English conventions and flag any US English spellings as grammar errors.

Content to analyze:
"${content}"${expectedCompanyInfo}

Return a JSON object with this exact structure:
{
  "wordCount": number,
  "sentenceCount": number,
  "readabilityScore": number (1-100, where 100 is easiest to read),
  "grammarErrors": [
    {
      "text": "exact text that contains the error",
      "suggestion": "corrected version",
      "type": "grammar|punctuation|structure|US English",
      "explanation": "detailed explanation of why this is incorrect and what rule it violates"
    }
  ],
  "spellingErrors": [
    {
      "text": "misspelled word",
      "suggestion": "correct UK English spelling",
      "position": "context where the error appears"
    }
  ],
  "issues": [
    "detailed description of content issues with specific recommendations for improvement"
  ],
  "suggestions": [
    "specific actionable suggestions for content improvement"
  ],
  "companyInformation": {
    "hasExpectedInfo": boolean,
    "companyInfoScore": number (1-100),
    "foundInformation": {
      "companyName": "name found on page or null",
      "phoneNumber": "phone found on page or null", 
      "email": "email found on page or null",
      "address": "address found on page or null",
      "customInfo": "custom info found or null"
    },
    "issues": [
      "specific company information issues"
    ],
    "suggestions": [
      "specific company information suggestions"
    ],
    "complianceStatus": {
      "companyName": "missing|correct|incorrect|partial",
      "phoneNumber": "missing|correct|incorrect|partial",
      "email": "missing|correct|incorrect|partial", 
      "address": "missing|correct|incorrect|partial",
      "customInfo": "missing|correct|incorrect|partial"
    }
  },
  "tone": "professional|casual|formal|conversational|academic|marketing",
  "overallScore": number (1-100),
  "contentQuality": number (1-100),
  "estimatedReadingTime": number (in minutes, rounded up)
}

CRITICAL REQUIREMENTS:
1. UK English ONLY - flag ALL US spellings as "US English" type grammar errors:
   - color → colour, center → centre, organize → organise, realize → realise
   - license → licence (noun), defense → defence, gray → grey
   - traveled → travelled, canceled → cancelled, fulfill → fulfil
   
2. Provide detailed explanations for each error:
   - Grammar: Explain the grammatical rule being violated
   - Punctuation: Explain the punctuation rule and correct usage
   - Structure: Explain why the sentence structure is problematic
   - US English: Explain this is US spelling and provide UK equivalent
   
3. For spelling errors, provide context about where the error appears

4. Content issues should be specific and actionable:
   - "The introduction lacks a clear hook to engage readers"
   - "This paragraph contains too many complex sentences that hurt readability"
   - "The conclusion doesn't summarize the main points effectively"
   
5. Make suggestions concrete and implementable:
   - "Break the 45-word sentence in paragraph 2 into two shorter sentences"
   - "Add transition words between paragraphs 3 and 4 to improve flow"
   - "Replace jargon terms with simpler alternatives for broader accessibility"

${
  hasCompanyInfo
    ? `
6. COMPANY INFORMATION ANALYSIS (CRITICAL):
   - Set "hasExpectedInfo" to true since company information was provided for verification
   - Carefully extract any company information found on the page into "foundInformation"
   - Compare found information with expected information and set appropriate "complianceStatus"
   - Calculate "companyInfoScore" based on completeness and accuracy (0-100):
     * 100: All expected information present and correct
     * 80-99: Most information present with minor issues
     * 60-79: Some information present but incomplete or inconsistent  
     * 40-59: Limited information present with major issues
     * 20-39: Very little correct company information
     * 0-19: No expected company information found
   - Include detailed company-specific issues in "companyInformation.issues"
   - Provide actionable company information suggestions in "companyInformation.suggestions"
   - Company information score should significantly impact the overall content score
`
    : `
6. COMPANY INFORMATION ANALYSIS:
   - Set "hasExpectedInfo" to false since no company information was provided for verification
   - Set "companyInfoScore" to 100 (N/A - no expected information to verify)
   - Leave "foundInformation" fields as null
   - Set all "complianceStatus" fields to "correct" (N/A)
   - Keep "issues" and "suggestions" arrays empty
`
}

Focus on being helpful and educational. Each error should teach the user something about proper UK English and good writing practices. Company information accuracy is crucial for business credibility and local SEO.`;

    // Add timeout handling for Gemini API calls
    const GEMINI_TIMEOUT = 120000; // 2 minutes timeout for Gemini API
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), GEMINI_TIMEOUT);
    });
    
    const geminiPromise = model.generateContent(prompt);
    
    const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
    const response = await result.response;
    const text = response.text();

    // Clean up response and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const analysis = JSON.parse(cleanedText);

      // Validate required fields and provide defaults
      const result = {
        wordCount: Math.max(0, analysis.wordCount || 0),
        sentenceCount: Math.max(0, analysis.sentenceCount || 0),
        readabilityScore: Math.min(
          100,
          Math.max(0, analysis.readabilityScore || 0)
        ),
        estimatedReadingTime: Math.max(1, analysis.estimatedReadingTime || 1),
        grammarErrors: Array.isArray(analysis.grammarErrors)
          ? analysis.grammarErrors
          : [],
        spellingErrors: Array.isArray(analysis.spellingErrors)
          ? analysis.spellingErrors
          : [],
        issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        suggestions: Array.isArray(analysis.suggestions)
          ? analysis.suggestions
          : [],
        tone: analysis.tone || "neutral",
        overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
        contentQuality: Math.min(
          100,
          Math.max(0, analysis.contentQuality || 0)
        ),
        companyInformation: {
          hasExpectedInfo: hasCompanyInfo,
          companyInfoScore: 100,
          foundInformation: {
            companyName: null,
            phoneNumber: null,
            email: null,
            address: null,
            customInfo: null,
          },
          issues: [],
          suggestions: [],
          complianceStatus: {
            companyName: "correct",
            phoneNumber: "correct",
            email: "correct",
            address: "correct",
            customInfo: "correct",
          },
        },
      };

      // If company information was expected, validate and use AI analysis
      if (hasCompanyInfo && analysis.companyInformation) {
        const companyInfo = analysis.companyInformation;
        result.companyInformation = {
          hasExpectedInfo: hasCompanyInfo,
          companyInfoScore: Math.min(
            100,
            Math.max(0, companyInfo.companyInfoScore || 0)
          ),
          foundInformation: {
            companyName: companyInfo.foundInformation?.companyName || null,
            phoneNumber: companyInfo.foundInformation?.phoneNumber || null,
            email: companyInfo.foundInformation?.email || null,
            address: companyInfo.foundInformation?.address || null,
            customInfo: companyInfo.foundInformation?.customInfo || null,
          },
          issues: Array.isArray(companyInfo.issues) ? companyInfo.issues : [],
          suggestions: Array.isArray(companyInfo.suggestions)
            ? companyInfo.suggestions
            : [],
          complianceStatus: {
            companyName: companyInfo.complianceStatus?.companyName || "missing",
            phoneNumber: companyInfo.complianceStatus?.phoneNumber || "missing",
            email: companyInfo.complianceStatus?.email || "missing",
            address: companyInfo.complianceStatus?.address || "missing",
            customInfo: companyInfo.complianceStatus?.customInfo || "missing",
          },
        };

        // Adjust overall score based on company information score if it's significantly lower
        if (result.companyInformation.companyInfoScore < 70) {
          const penalty =
            (70 - result.companyInformation.companyInfoScore) * 0.2; // Up to 14 point penalty
          result.overallScore = Math.max(0, result.overallScore - penalty);
          console.log(
            `Applied company info penalty: -${penalty.toFixed(
              1
            )} points for score ${result.companyInformation.companyInfoScore}`
          );
        }
      }
      console.log("endanalyzing content with gemini");
      return result;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", cleanedText);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to analyze content with Gemini");
  }
}

async function analyzeSEO(
  html: string,
  url: string,
  pageTitle: string | null,
  statusCode: number | null
) {
  console.log("analyzing seo");
  // Meta tags analysis
  const cleanTitle = extractTitle(html) || pageTitle;
  const metaTags = {
    title: cleanTitle,
    description: extractMetaContent(html, "description"),
    keywords: extractMetaContent(html, "keywords"),
    robots: extractMetaContent(html, "robots"),
    canonical: extractLinkHref(html, "canonical"),
    ogTitle: extractMetaProperty(html, "og:title"),
    ogDescription: extractMetaProperty(html, "og:description"),
    viewport: extractMetaContent(html, "viewport"),
  };

  // Heading structure analysis
  const headingStructure = analyzeHeadings(html);

  // Robots check
  const robotsCheck = {
    robotsTxt: false, // Would need separate request
    robotsMeta: metaTags.robots,
    indexable: !metaTags.robots?.includes("noindex"),
  };

  // Links analysis
  const linksCheck = analyzeLinks(html, url);
  const imgTags = analyzeImgTags(html);
 
  // Redirect check
  const redirectCheck = {
    hasRedirect: statusCode !== 200,
    finalUrl: url,
    redirectChain: [], // Would need to track during crawling
  };

  // HTTPS check
  const httpsCheck = {
    isHttps: url.startsWith("https://"),
    hasSecurityHeaders: false, // Would need response headers
  };

  // Calculate overall SEO score
  let score = 0;
  const issues = [];
  const recommendations = [];

  // Title tag scoring (20 points)
  if (metaTags.title) {
    if (metaTags.title.length >= 30 && metaTags.title.length <= 60) {
      score += 20;
    } else if (metaTags.title.length > 0) {
      score += 10;
      issues.push(
        `Title tag length is ${metaTags.title.length} characters (optimal: 30-60)`
      );
      recommendations.push("Optimize title tag length to 30-60 characters");
    }
  } else {
    issues.push("Missing title tag");
    recommendations.push("Add a descriptive title tag");
  }

  // Description meta tag scoring (15 points)
  if (metaTags.description) {
    if (
      metaTags.description.length >= 120 &&
      metaTags.description.length <= 160
    ) {
      score += 15;
    } else if (metaTags.description.length > 0) {
      score += 8;
      issues.push(
        `Meta description length is ${metaTags.description.length} characters (optimal: 120-160)`
      );
      recommendations.push(
        "Optimize meta description length to 120-160 characters"
      );
    }
  } else {
    issues.push("Missing meta description");
    recommendations.push("Add a compelling meta description");
  }

  // H1 tag scoring (15 points)
  if (headingStructure.hasProperStructure) {
    score += 15;
  } else if (headingStructure.h1Count === 0) {
    issues.push("Missing H1 tag");
    recommendations.push("Add exactly one H1 tag to the page");
  } else if (headingStructure.h1Count > 1) {
    score += 8;
    issues.push(`Multiple H1 tags found (${headingStructure.h1Count})`);
    recommendations.push("Use only one H1 tag per page");
  }

  // Heading hierarchy scoring (10 points)
  if (headingStructure.allHeadings.length > 1) {
    score += 10;
  } else {
    issues.push("Poor heading structure");
    recommendations.push("Use proper heading hierarchy (H1 > H2 > H3...)");
  }

  // HTTPS scoring (10 points)
  if (httpsCheck.isHttps) {
    score += 10;
  } else {
    issues.push("Page not served over HTTPS");
    recommendations.push("Implement HTTPS for better security and SEO");
  }

  // Indexability scoring (10 points)
  if (robotsCheck.indexable) {
    score += 10;
  } else {
    issues.push("Page is not indexable (noindex directive found)");
    recommendations.push("Remove noindex directive if page should be indexed");
  }

  // Canonical URL scoring (5 points)
  if (metaTags.canonical) {
    score += 5;
  } else {
    issues.push("Missing canonical URL");
    recommendations.push(
      "Add canonical URL to prevent duplicate content issues"
    );
  }

  // Viewport meta tag scoring (5 points)
  if (metaTags.viewport) {
    score += 5;
  } else {
    issues.push("Missing viewport meta tag");
    recommendations.push("Add viewport meta tag for mobile responsiveness");
  }

  // Links scoring (5 points)
  if (linksCheck.totalLinks > 0) {
    score += 5;
  } else {
    issues.push("No links found on the page");
    recommendations.push("Add relevant internal and external links");
  }

  // Open Graph scoring (5 points)
  if (metaTags.ogTitle && metaTags.ogDescription) {
    score += 5;
  } else {
    issues.push("Missing Open Graph tags");
    recommendations.push("Add Open Graph tags for better social media sharing");
  }

  if(imgTags.missingAltCount > 0) {
    score -= 5;
    issues.push(`${imgTags.missingAltCount} images are missing alt tags`);
    recommendations.push("Add alt tags to all images");
  }
  else{
    score += 5;
  }
  console.log("end analyzing seo");
  return {
    metaTags,
    headingStructure,
    robotsCheck,
    linksCheck,
    redirectCheck,
    httpsCheck,
    overallScore: Math.min(100, score),
    issues,
    recommendations,
    imgTags
  };
}

function extractTitle(html: string): string | null {
  // Try to extract clean title from <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    let title = titleMatch[1].trim();

    // Clean up common unwanted text patterns
    title = title
      .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, "") // Remove menu-related suffixes
      .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, "") // Remove toggle-related suffixes
      .replace(
        /\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i,
        ""
      ) // Remove social media suffixes
      .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, "") // Remove menu with dash separator
      .replace(/ExpandToggle.*$/i, "") // Remove specific "ExpandToggle" text
      .replace(/MenuExpand.*$/i, "") // Remove specific "MenuExpand" text
      .replace(/Facebook$/i, "") // Remove trailing "Facebook"
      .trim();

    return title || null;
  }
  return null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractMetaProperty(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const regex = new RegExp(
    `<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*?)["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

function analyzeHeadings(html: string) {
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const allHeadingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];

  const h1Text = h1Matches.map((match) => match.replace(/<[^>]*>/g, "").trim());

  const allHeadings = allHeadingMatches.map((match) => {
    const level = parseInt(match.match(/<h(\d)/)?.[1] || "1");
    const text = match.replace(/<[^>]*>/g, "").trim();
    return { level, text };
  });

  return {
    h1Count: h1Matches.length,
    h1Text,
    hasProperStructure: h1Matches.length === 1,
    allHeadings,
  };
}

function analyzeLinks(html: string, baseUrl: string) {
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
  const links = linkMatches
    .map((match) => {
      const href = match.match(/href=["']([^"']*?)["']/)?.[1] || "";
      return href;
    })
    .filter((href) => href && !href.startsWith("#"));

  const totalLinks = links.length;
  const externalLinks = links.filter(
    (link) =>
      link.startsWith("http") && !link.includes(new URL(baseUrl).hostname)
  ).length;
  const internalLinks = totalLinks - externalLinks;

  return {
    totalLinks,
    internalLinks,
    externalLinks,
    brokenLinks: [], // Would need to check each link
  };
}

function analyzeImgTags(html: string) {
  const imgMatches = html.match(/<img[^>]*src=["']([^"']*?)["'][^>]*>/gi) || [];
  const imgTags = imgMatches.map((match) => {
    const src = match.match(/src=["']([^"']*?)["']/)?.[1] || "";
    const hasAlt = /alt=["'][^"']*["']/i.test(match);
    return { src, hasAlt };
  });
  const total = imgTags.length;
  const missingAlt = imgTags.filter(img => !img.hasAlt);
  return {
    total,
    missingAltCount: missingAlt.length,
    missingAltSrcs: missingAlt.map(img => img.src),
    imgTags // for reference, can be removed if not needed
  };
}
// Analyze HTML tags for structure, presence, and best practices
async function analyzeTags(html: string) {
  const results: any = {
    detectedTags: {
      gtm: {
        script: false,
        noscript: false,
        details: [],
        message: '',
      },
      gtag: {
        found: false,
        details: [],
        message: '',
      },
      clickcease: {
        script: false,
        noscriptImg: false,
        noscriptAnchor: false,
        details: [],
        message: '',
      },
    },
  };

  // 1. Google Tag Manager (GTM)
  const gtmScriptPattern = /\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':/;
  const gtmIdPattern = /GTM-[A-Z0-9]+/g;
  const gtmJsPattern = /googletagmanager\.com\/gtm\.js/;
  const gtmNoscriptPattern = /<iframe[^>]+src=["']https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+/i;

  // 2. Google tag (gtag.js)
  const gtagJsPattern = /googletagmanager\.com\/gtag\/js/;

  // 3. ClickCease
  const clickceaseScriptPattern = /clickcease\.com\/monitor\/stat\.js/;
  const clickceaseNoscriptImgPattern = /<img[^>]+src=['"]https:\/\/monitor\.clickcease\.com\/stats\/stats\.aspx/i;
  const clickceaseNoscriptAnchorPattern = /<a[^>]+href=['"]https:\/\/www\.clickcease\.com/i;

  // GTM detection
  const gtmScriptFound = gtmScriptPattern.test(html) || gtmJsPattern.test(html) || gtmIdPattern.test(html);
  const gtmScriptDetails = [
    ...(html.match(gtmScriptPattern) || []),
    ...(html.match(gtmJsPattern) || []),
    ...(html.match(gtmIdPattern) || []),
  ];
  const gtmNoscriptFound = gtmNoscriptPattern.test(html);
  const gtmNoscriptDetails = html.match(gtmNoscriptPattern) || [];
  // Extract all GTM container IDs
  const gtmIds = Array.from(new Set((html.match(/GTM-[A-Z0-9]+/g) || [])));
  results.detectedTags.gtm.script = gtmScriptFound;
  results.detectedTags.gtm.noscript = gtmNoscriptFound;
  results.detectedTags.gtm.details = [...gtmScriptDetails, ...gtmNoscriptDetails];
  results.detectedTags.gtm.ids = gtmIds;
  results.detectedTags.gtm.message = gtmScriptFound || gtmNoscriptFound
    ? 'Google Tag Manager detected.'
    : 'No Google Tag Manager detected.';

  // gtag.js detection
  const gtagFound = gtagJsPattern.test(html);
  const gtagDetails = html.match(gtagJsPattern) || [];
  // Extract all gtag.js Measurement IDs (GA4)
  const gtagIds = Array.from(new Set((html.match(/G-[A-Z0-9]+/g) || [])));
  // Extract all gtag.js script links
  const gtagLinkPattern = /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/g;
  const gtagLinks = Array.from(new Set((html.match(gtagLinkPattern) || [])));
  results.detectedTags.gtag.found = gtagFound;
  results.detectedTags.gtag.details = gtagDetails;
  results.detectedTags.gtag.ids = gtagIds;
  results.detectedTags.gtag.links = gtagLinks;
  results.detectedTags.gtag.message = gtagFound
    ? 'Google tag (gtag.js) detected.'
    : 'No Google tag (gtag.js) detected.';

  // ClickCease detection
  const clickceaseScriptFound = clickceaseScriptPattern.test(html);
  const clickceaseScriptDetails = html.match(clickceaseScriptPattern) || [];
  const clickceaseNoscriptImgFound = clickceaseNoscriptImgPattern.test(html);
  const clickceaseNoscriptImgDetails = html.match(clickceaseNoscriptImgPattern) || [];
  const clickceaseNoscriptAnchorFound = clickceaseNoscriptAnchorPattern.test(html);
  const clickceaseNoscriptAnchorDetails = html.match(clickceaseNoscriptAnchorPattern) || [];
  results.detectedTags.clickcease.script = clickceaseScriptFound;
  results.detectedTags.clickcease.noscriptImg = clickceaseNoscriptImgFound;
  results.detectedTags.clickcease.noscriptAnchor = clickceaseNoscriptAnchorFound;
  results.detectedTags.clickcease.details = [
    ...clickceaseScriptDetails,
    ...clickceaseNoscriptImgDetails,
    ...clickceaseNoscriptAnchorDetails,
  ];
  results.detectedTags.clickcease.message =
    clickceaseScriptFound || clickceaseNoscriptImgFound || clickceaseNoscriptAnchorFound
      ? 'ClickCease detected.'
      : 'No ClickCease detected.';

  // Print the result for debugging
  console.log('[analyzeTags] Tag detection result:', JSON.stringify(results, null, 2));

  return results;
}
// Analyze UI image using Gemini Vision API
// This version ignores the image and just sends a simple prompt to Gemini for testing.

async function analyzeUIImageWithGemini(
  imageUrl: string,
  device: string
): Promise<any | null> {
  try {
 console.log("analyzing ui image with gemini for device", device);

    let deviceNote = "";
    if (device === "phone") {
      deviceNote = "Focus especially on mobile usability aspects like touch target sizes, finger-friendly spacing, and vertical responsiveness.";
    } else if (device === "tablet") {
      deviceNote = "Focus especially on tablet usability aspects like adaptable grid layouts, comfortable spacing for medium screen sizes, and touch interaction design.";
    } else if (device === "desktop") {
      deviceNote = "Focus especially on desktop usability aspects like wide-screen layout alignment, hover interactions, and detailed visual hierarchy.";
    }

    const prompt = `
You are an expert UI/UX reviewer. Please carefully analyze this image as if you are conducting a detailed design and accessibility review.

Identify and describe all UI-related issues, including but not limited to:
- Alignment problems
- Inconsistent margins or paddings
- Overlapping or clipped elements
- Color contrast and accessibility concerns
- Font consistency and readability issues
- Button or input field design problems
- Icon or image misplacements
- Responsiveness or scaling concerns
- Visual hierarchy and clarity
- Any other visual or functional issues that could affect usability or user experience

Consider that this UI is being viewed on a ${device} device. ${deviceNote}
In addition to pointing out issues, also mention what aspects of the design are good, effective, or well executed. Highlight strengths such as visual consistency, clear hierarchy, good readability, effective use of space, appealing color schemes, or any strong points that contribute positively to the user experience.
Provide the analysis strictly in the following JSON format, without any extra text or formatting don't add any '\\n'. Do not include markdown backticks, code blocks, or escape characters. Only return plain JSON text:

{
  "issues": [
    {
      "type": "Alignment",
      "description": "Description of the issue here",
      "suggestion": "Suggestion to fix it"
    }
    // More issues...
  ],
  "overall_summary": "Short overall summary of the UI quality and general recommendations."
}
`;

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const contents = [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
        ],
      },
    ];

    let result;
    try {
      // Add timeout handling for Gemini Vision API
      const GEMINI_VISION_TIMEOUT = 180000; // 3 minutes for vision API
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini Vision API timeout')), GEMINI_VISION_TIMEOUT);
      });
      
      const geminiPromise = model.generateContent({ contents });
      
      result = await Promise.race([geminiPromise, timeoutPromise]) as any;
      
    } catch (err) {
      console.error("[Gemini UI] Gemini Vision API error (inner):", err);
      return null;
    }

    let geminiResponse: string | null = null;
    if (typeof result?.response?.text === "function") {
      geminiResponse = result.response.text();
    } else if (typeof result?.response?.text === "string") {
      geminiResponse = result.response.text;
    } else {
      geminiResponse = null;
    }

    // Clean up Gemini's response: remove markdown/code block markers and extract JSON
    let cleaned = (geminiResponse || "").replace(/```json|```/g, "").trim();
    // Try to extract the first JSON object if extra text is present
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("[Gemini UI] Failed to parse Gemini response:", geminiResponse);
      return null;
    }
  } catch (error) {
    console.error("[Gemini UI] Gemini Vision API error (outer):", error);
    return null;
  }
}

async function analyzeCustomInstructions(
  instructions: string,
  pageHtml: string,
  screenshotUrls: Record<string, string | null>
): Promise<any> {
  try {
    console.log("instructions start**********", instructions);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    let prompt = `You are an expert web auditor.
    \n\nFollow these custom instructions:
    \n${instructions}\n\n
    You are provided with the following page HTML and screenshots.
    \n\nIMPORTANT LIMITATION: Only use the provided page HTML and screenshots.
     Do NOT use any external or general knowledge. Limit your response strictly to what 
     is present in the data. If you cannot answer something based on the provided data,
      say so.\n\nPage HTML:\n${pageHtml}\n`;
    // Add screenshot references
    for (const device of ["phone", "tablet", "desktop"]) {
      if (screenshotUrls[device]) {
        prompt += `\nScreenshot (${device}): [image attached]`;
      }
    }
    // Prepare Gemini content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
    for (const device of ["phone", "tablet", "desktop"]) {
      if (screenshotUrls[device]) {
        // Fetch and attach image as base64
        const response = await axios.get(screenshotUrls[device]!, { responseType: "arraybuffer" });
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        });
      }
    }
    const contents = [{ role: "user", parts }];
    let result;
    try {
      // Add timeout handling for Gemini Custom Instructions API
      const GEMINI_CUSTOM_TIMEOUT = 180000; // 3 minutes for custom instructions
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini Custom Instructions API timeout')), GEMINI_CUSTOM_TIMEOUT);
      });
      
      const geminiPromise = model.generateContent({ contents });
      
      result = await Promise.race([geminiPromise, timeoutPromise]) as any;
    } catch (err) {
      console.error("[Gemini Custom Instructions] Gemini API error:", err);
      return { error: "Gemini API error" };
    }
    let geminiResponse = typeof result?.response?.text === "function" ? result.response.text() : result?.response?.text || null;
    // Clean up Gemini's response
    let cleaned = (geminiResponse || "").replace(/```json|```/g, "").trim();
    // Try to extract the first JSON object if extra text is present
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // If not JSON, just return the text
      return { response: geminiResponse };
    }
  } catch (error) {
    console.error("[Gemini Custom Instructions] Error:", error);
    return { error: "Failed to process custom instructions" };
  }
}

async function takeAllScreenshots(url: string, pageId: number) {
  const devices: Array<"phone" | "tablet" | "desktop"> = [
    "phone",
    "tablet",
    "desktop",
  ];

  const screenshotPromises = devices.map(device =>
    takeScreenshot(url, pageId, device).then(result => [device, result])
  );
  const results = await Promise.all(screenshotPromises);
  const screenshots: Record<string, string> = Object.fromEntries(results);
  return screenshots;
}

async function takeScreenshot(
  url: string,
  pageId: number,
  device: "phone" | "tablet" | "desktop"
): Promise<string> {
  let browser: import("puppeteer").Browser | null = null;
  try {
    console.log("taking screenshot for device", device);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport based on device
    let viewport;
    let suffix;
    switch (device) {
      case "phone":
        viewport = { width: 375, height: 812 };
        suffix = "phone";
        break;
      case "tablet":
        viewport = { width: 768, height: 1024 };
        suffix = "tablet";
        break;
      default:
        viewport = { width: 1440, height: 3000 };
        suffix = "desktop";
    }
    await page.setViewport(viewport);

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("body");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await autoScroll(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const screenshotPath = path.join(
      process.cwd(),
      "public",
      `screenshot_${pageId}_${suffix}.png`
    ) as `${string}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return `/screenshot_${pageId}_${suffix}.png`;
  } catch (error) {
    console.error("Error taking screenshot:", error);
    return "";
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}

/**
 * Optimized auto-scroll function for better performance
 * Reduces scroll time and improves screenshot quality
 */
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 800; // Increased distance for faster scroll
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200); // Faster scroll interval
    });
  });
}

async function uploadScreenshotToStorage(
  localPath: string,
  storagePath: string
): Promise<string | null> {
  console.log("uploading screenshot to storage");
  const supabase = await createClient();
  const fileBuffer = await fs.readFile(localPath);
  const { data, error } = await supabase.storage
    .from("screenshots") // bucket name
    .upload(storagePath, fileBuffer, {
      upsert: true,
      contentType: "image/png",
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    return null;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("screenshots").getPublicUrl(storagePath);
  return publicUrl;
}

/**
 * Takes a screenshot of a webpage as a buffer
 * Optimized for performance with reduced wait times and better error handling
 */
async function takeScreenshotBuffer(
  url: string,
  device: "phone" | "tablet" | "desktop"
): Promise<Buffer | null> {
  let browser: import("puppeteer").Browser | null = null;
  try {
    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ],
    });
    
    const page = await browser.newPage();
    
    // Set device-specific viewport
    const viewports = {
      phone: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 900 }
    };
    await page.setViewport(viewports[device]);
    
    // Navigate with optimized settings
    await page.goto(url, { 
      waitUntil: "domcontentloaded", // Faster than networkidle2
      timeout: 30000 
    });
    
    // Reduced wait time for better performance
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await autoScroll(page);
    
    // Take screenshot
    const buffer = await page.screenshot({ 
      type: "png", 
      fullPage: true,
      optimizeForSpeed: true
    });
    
    return buffer as Buffer;
  } catch (error) {
    console.error(`Screenshot failed for ${device}:`, error);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Browser close error:", closeError);
      }
    }
  }
}

// New buffer-based upload function
async function uploadScreenshotBufferToStorage(
  buffer: Buffer,
  storagePath: string
): Promise<string | null> {
  console.log("uploading screenshot buffer to storage");
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("screenshots") // bucket name
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "image/png",
    });
  if (error) {
    console.error("Supabase Storage upload error (buffer):", error);
    return null;
  }
  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("screenshots").getPublicUrl(storagePath);
  return publicUrl;
}

/**
 * Analyze social media meta tags (Open Graph, Twitter, etc.) in the HTML.
 * Returns a JSON object with presence, platform, image link, title, description, and other relevant info.
 */
async function analyzeSocialMetaTags(html: string): Promise<any> {
  // Helper to extract meta property or name
  function extractMeta(html: string, key: string, attr: 'property' | 'name' = 'property'): string | null {
    const regex = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']*?)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  // Platforms and their relevant tags
  const platforms = [
    {
      name: 'Open Graph',
      keys: [
        { key: 'og:title', label: 'title' },
        { key: 'og:description', label: 'description' },
        { key: 'og:image', label: 'image' },
        { key: 'og:url', label: 'url' },
        { key: 'og:type', label: 'type' },
        { key: 'og:site_name', label: 'site_name' },
      ],
      attr: 'property',
    },
    {
      name: 'Twitter',
      keys: [
        { key: 'twitter:card', label: 'card' },
        { key: 'twitter:title', label: 'title' },
        { key: 'twitter:description', label: 'description' },
        { key: 'twitter:image', label: 'image' },
        { key: 'twitter:url', label: 'url' },
        { key: 'twitter:site', label: 'site' },
        { key: 'twitter:creator', label: 'creator' },
      ],
      attr: 'name',
    },
    // Add more platforms if needed
  ];

  const result: any = {
    platforms: {},
    summary: [],
  };

  for (const platform of platforms) {
    const platformResult: any = { present: false, tags: {}, missing: [] };
    for (const tag of platform.keys) {
      const value = extractMeta(html, tag.key, platform.attr as any);
      if (value) {
        platformResult.present = true;
        platformResult.tags[tag.label] = value;
      } else {
        platformResult.missing.push(tag.label);
      }
    }
    result.platforms[platform.name] = platformResult;
    if (platformResult.present) {
      result.summary.push(`${platform.name} meta tags present: ${Object.keys(platformResult.tags).join(', ')}`);
    } else {
      result.summary.push(`${platform.name} meta tags missing`);
    }
  }

  // Collect all images for preview
  result.images = [];
  for (const platform of platforms) {
    const img = result.platforms[platform.name]?.tags?.image;
    if (img) {
      result.images.push({ platform: platform.name, url: img });
    }
  }

  // Add a quick access for main title/description/image
  result.main = {
    title: result.platforms['Open Graph']?.tags?.title || result.platforms['Twitter']?.tags?.title || null,
    description: result.platforms['Open Graph']?.tags?.description || result.platforms['Twitter']?.tags?.description || null,
    image: result.platforms['Open Graph']?.tags?.image || result.platforms['Twitter']?.tags?.image || null,
    url: result.platforms['Open Graph']?.tags?.url || result.platforms['Twitter']?.tags?.url || null,
  };
 
  return result;
}



