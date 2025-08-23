"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditProject, ScrapedPage } from "@/lib/types/database";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  Tag,
  AlertTriangle,
  FileText,
  BarChart3,
  Eye,
  Image,
  Globe,
  Calendar,
  Settings,
  Lightbulb,
  Target,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageDetailSkeleton } from "@/components/skeletons";
import { ImageAnalysisTable } from "@/components/audit/image-analysis-table";
import { LinksAnalysisTable } from "@/components/audit/links-analysis-table";
import { BackButton } from "@/components/ui/back-button";

interface PageAnalysis {
  metaTags: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    robots: string | null;
    canonical: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    viewport: string | null;
  };
  headingStructure: {
    h1Count: number;
    h1Text: string[];
    hasProperStructure: boolean;
    allHeadings: Array<{ level: number; text: string }>;
  };
  robotsCheck: {
    robotsTxt: boolean;
    robotsMeta: string | null;
    indexable: boolean;
  };
  linksCheck: {
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    brokenLinks: string[];
  };
  redirectCheck: {
    hasRedirect: boolean;
    finalUrl: string;
    redirectChain: string[];
  };
  httpsCheck: {
    isHttps: boolean;
    hasSecurityHeaders: boolean;
  };
  grammarCheck: {
    wordCount: number;
    sentenceCount: number;
    readabilityScore: number;
    estimatedReadingTime: number;
    grammarErrors: Array<{
      text: string;
      suggestion: string;
      type: string;
      explanation?: string;
    }>;
    spellingErrors: Array<{
      text: string;
      suggestion: string;
      position?: string;
    }>;
    issues: string[];
    suggestions: string[];
    tone: string;
    overallScore: number;
    contentQuality: number;
    companyInformation?: {
      hasExpectedInfo: boolean;
      companyInfoScore: number;
      foundInformation: {
        companyName: string | null;
        phoneNumber: string | null;
        email: string | null;
        address: string | null;
        customInfo: string | null;
      };
      issues: string[];
      suggestions: string[];
      complianceStatus: {
        companyName: string;
        phoneNumber: string;
        email: string;
        address: string;
        customInfo: string;
      };
    };
  } | null;
  seoAnalysis: {
    overallScore: number;
    issues: string[];
    recommendations: string[];
  } | null;
  phone_ui_quality_analysis?: any;
  tablet_ui_quality_analysis?: any;
  desktop_ui_quality_analysis?: any;
  imgTags?: {
    total: number;
    missingAltCount: number;
    imgTags: Array<{ src: string; hasAlt: boolean }>;
  };
  tags_analysis?: any;
  social_meta_analysis?: any;
  image_analysis?: Array<{
    src: string;
    alt: string | null;
    format: string | null;
    sizeKb: number | null;
    isLessThan500kb: boolean | null;
  }> | {
    totalImages: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;
    images: Array<{
      src: string;
      alt: string | null;
      format: string | null;
      sizeKb: number | null;
      isLessThan500kb: boolean | null;
      hasAlt: boolean;
      page_url: string;
    }>;
    issues: string[];
    recommendations: string[];
  };
  link_analysis?: {
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    linksWithText: number;
    linksWithoutText: number;
    links: Array<{
      href: string;
      type: string;
      text: string;
      page_url: string;
    }>;
    issues: string[];
    recommendations: string[];
  };
  performance_analysis?: any;
  custom_instructions_analysis?: any;
}

interface PageDetailSimpleProps {
  pageId: string;
}

function hasImgTags(
  obj: unknown
): obj is {
  imgTags: {
    total: number;
    missingAltCount: number;
    imgTags: Array<{ src: string; hasAlt: boolean }>;
  };
} {
  return (
    !!obj &&
    typeof obj === "object" &&
    "imgTags" in obj &&
    typeof (obj as any).imgTags === "object" &&
    Array.isArray((obj as any).imgTags.imgTags)
  );
}

export function PageDetailSimple({ pageId }: PageDetailSimpleProps) {
  const [project, setProject] = useState<AuditProject | null>(null);
  const [page, setPage] = useState<ScrapedPage | null>(null);
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("grammar");
  const [activeGrammarTab, setActiveGrammarTab] = useState("grammar");
  const [grammarAnalyzing, setGrammarAnalyzing] = useState(false);
  const [seoAnalyzing, setSeoAnalyzing] = useState(false);
  const [uiAnalyzing, setUiAnalyzing] = useState(false);
  const [grammarCached, setGrammarCached] = useState(false);
  const [uiCached, setUiCached] = useState(false);
  const [seoCached, setSeoCached] = useState(false);
  const [uiQualityCached, setUiQualityCached] = useState(false);
  const [grammarCachedAt, setGrammarCachedAt] = useState<string | null>(null);
  const [seoCachedAt, setSeoCachedAt] = useState<string | null>(null);
  const [uiQualityCachedAt, setUiQualityCachedAt] = useState<string | null>(
    null
  );
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [activeUiTab, setActiveUiTab] = useState<
    "phone" | "tablet" | "desktop"
  >("phone");
  const [activePerformanceTab, setActivePerformanceTab] = useState<'mobile' | 'desktop'>('mobile');
  const [performanceAnalyzing, setPerformanceAnalyzing] = useState(false);
  const [performanceCached, setPerformanceCached] = useState(false);
  const [performanceCachedAt, setPerformanceCachedAt] = useState<string | null>(null);
  const [customInstructionsAnalyzing, setCustomInstructionsAnalyzing] = useState(false);
  const [customInstructionsCached, setCustomInstructionsCached] = useState(false);
  const [customInstructionsCachedAt, setCustomInstructionsCachedAt] = useState<string | null>(null);
  const [activeTechnicalTab, setActiveTechnicalTab] = useState("tags_analysis");
  const [imagesAnalyzing, setImagesAnalyzing] = useState(false);
  const [technicalAnalyzing, setTechnicalAnalyzing] = useState(false);
  const [customInstructionInput, setCustomInstructionInput] = useState("");
  const [isCustomInstructionLoading, setIsCustomInstructionLoading] = useState(false);
  const [customInstructionResult, setCustomInstructionResult] = useState<any>(null);

  // Fetch results from audit_results table
  const fetchAnalysisResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      const data = await response.json();

      if (response.ok && data.results) {

        // Update analysis state with fresh results
        setAnalysis((prev) => {
          const newAnalysis = prev || analyzePage(data.page);

          if (data.results.grammar_analysis) {
            newAnalysis.grammarCheck = data.results.grammar_analysis;
            setGrammarCached(true);
            setGrammarCachedAt(
              data.results.created_at || data.results.updated_at
            );
            setGrammarAnalyzing(false);
          }

          if (data.results.seo_analysis) {
            newAnalysis.seoAnalysis = data.results.seo_analysis;

            setSeoCached(true);
            setSeoCachedAt(data.results.created_at || data.results.updated_at);
            setSeoAnalyzing(false);
          }
          if (data.results.tags_analysis) {
            newAnalysis.tags_analysis = data.results.tags_analysis;
          }
          if (data.results.social_meta_analysis) {
            newAnalysis.social_meta_analysis = data.results.social_meta_analysis;
          }
          if (data.results.image_analysis) {
            newAnalysis.image_analysis = data.results.image_analysis;
          }
          if (data.results.link_analysis) {
            newAnalysis.link_analysis = data.results.link_analysis;
          }
          if (data.results.performance_analysis) {
            newAnalysis.performance_analysis = data.results.performance_analysis;
          }
          if (data.results.phone_ui_quality_analysis) {
            newAnalysis.phone_ui_quality_analysis =
              data.results.phone_ui_quality_analysis;
          }
          if (data.results.tablet_ui_quality_analysis) {
            newAnalysis.tablet_ui_quality_analysis =
              data.results.tablet_ui_quality_analysis;
          }
          if (data.results.desktop_ui_quality_analysis) {
            newAnalysis.desktop_ui_quality_analysis =
              data.results.desktop_ui_quality_analysis;
          }
          setUiQualityCached(
            !!(
              data.results.phone_ui_quality_analysis ||
              data.results.tablet_ui_quality_analysis ||
              data.results.desktop_ui_quality_analysis
            )
          );
          setUiQualityCachedAt(
            data.results.created_at || data.results.updated_at
          );
          setUiAnalyzing(false);

          // Performance analysis
          if (data.results.performance_analysis) {
            newAnalysis.performance_analysis = data.results.performance_analysis;
            setPerformanceCached(true);
            setPerformanceCachedAt(data.results.created_at || data.results.updated_at);
            setPerformanceAnalyzing(false);
          }

          if (data.results.instructions) {
            newAnalysis.custom_instructions_analysis = data.results.instructions;
            setCustomInstructionsCached(true);
            setCustomInstructionsCachedAt(data.results.created_at || data.results.updated_at);
            setCustomInstructionsAnalyzing(false);
          }

          if (data.results.image_analysis) {
            newAnalysis.image_analysis = data.results.image_analysis;
            setImagesAnalyzing(false);
          }
          if (data.results.link_analysis) {
            newAnalysis.link_analysis = data.results.link_analysis;
            setTechnicalAnalyzing(false);
          }
          if (data.results.tags_analysis) {
            newAnalysis.tags_analysis = data.results.tags_analysis;
            setTechnicalAnalyzing(false);
          }
          if (data.results.social_meta_analysis) {
            newAnalysis.social_meta_analysis = data.results.social_meta_analysis;
            setTechnicalAnalyzing(false);
          }
          if (data.results.performance_analysis) {
            newAnalysis.performance_analysis = data.results.performance_analysis;
          }

          return newAnalysis;
        });

        // Clear analyzing states
        setIsAnalysisRunning(false);
      }
    } catch (error) {
      console.error("Error fetching analysis results:", error);
    }
  }, [pageId]);

  const fetchPageData = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      const data = await response.json();
      if (response.ok) {
        setProject(data.project);
        setPage(data.page);

        // Check if this specific page is currently being analyzed
        const isPageAnalyzing = data.page?.analysis_status === "analyzing";
        
        // Check if page has been stuck in analyzing status for too long (more than 10 minutes)
        const pageUpdatedAt = data.page?.updated_at ? new Date(data.page.updated_at) : null;
        const now = new Date();
        const isStuck = pageUpdatedAt && isPageAnalyzing && 
          (now.getTime() - pageUpdatedAt.getTime()) > 10 * 60 * 1000; // 10 minutes
        
        if (isStuck) {
          console.warn('Page appears to be stuck in analyzing status, resetting to pending');
          // Reset the page status to pending
          try {
            await fetch(`/api/pages/${pageId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ analysis_status: 'pending' })
            });
          } catch (error) {
            console.error('Failed to reset stuck page status:', error);
          }
          setIsAnalysisRunning(false);
        } else {
          setIsAnalysisRunning(isPageAnalyzing);
        }

        // Analyze the page data
        if (data.page) {
          const basicAnalysis = analyzePage(data.page);
          let hasGrammarCache = false;
          let hasSeoCache = false;
          let hasUiQualityCache = false;
          let hasPerformanceCache = false;
          let hasCustomInstructionsCache = false;

          // Check for cached results and merge them
          if (data.results) {
            if (data.results.grammar_analysis) {
              basicAnalysis.grammarCheck = data.results.grammar_analysis;
              setGrammarCached(true);
              setGrammarCachedAt(
                data.results.created_at || data.results.updated_at
              );
              hasGrammarCache = true;
            }

            if (data.results.seo_analysis) {
              basicAnalysis.seoAnalysis = data.results.seo_analysis;
              setSeoCached(true);
              setSeoCachedAt(
                data.results.created_at || data.results.updated_at
              );
              hasSeoCache = true;
            }
            if (data.results.tags_analysis) {
              basicAnalysis.tags_analysis = data.results.tags_analysis;
            }
            if (data.results.social_meta_analysis) {
              basicAnalysis.social_meta_analysis = data.results.social_meta_analysis;
            }
              if (data.results.image_analysis) {
                basicAnalysis.image_analysis = data.results.image_analysis;
              }
              if (data.results.link_analysis) {
                basicAnalysis.link_analysis = data.results.link_analysis;
              }
            if (data.results.performance_analysis) {
              basicAnalysis.performance_analysis = data.results.performance_analysis;
            }
            if (data.results.phone_ui_quality_analysis) {
              basicAnalysis.phone_ui_quality_analysis =
                data.results.phone_ui_quality_analysis;
              hasUiQualityCache = true;
            }
            if (data.results.tablet_ui_quality_analysis) {
              basicAnalysis.tablet_ui_quality_analysis =
                data.results.tablet_ui_quality_analysis;
              hasUiQualityCache = true;
            }
            if (data.results.desktop_ui_quality_analysis) {
              basicAnalysis.desktop_ui_quality_analysis =
                data.results.desktop_ui_quality_analysis;
              hasUiQualityCache = true;
            }
            setUiQualityCached(
              !!(
                data.results.phone_ui_quality_analysis ||
                data.results.tablet_ui_quality_analysis ||
                data.results.desktop_ui_quality_analysis
              )
            );
            setUiQualityCachedAt(
              data.results.created_at || data.results.updated_at
            );
            // Performance analysis
            if (data.results.performance_analysis) {
              setPerformanceCached(true);
              setPerformanceCachedAt(data.results.created_at || data.results.updated_at);
              hasPerformanceCache = true;
            }
            if (data.results.instructions) {
              basicAnalysis.custom_instructions_analysis = data.results.instructions;
              setCustomInstructionsCached(true);
              setCustomInstructionsCachedAt(data.results.created_at || data.results.updated_at);
              hasCustomInstructionsCache = true;
            }
          }

          setAnalysis(basicAnalysis);

          // Determine if we need to start analysis or show analyzing state
          if (isPageAnalyzing) {
            // Page is being analyzed - show analyzing state for missing analyses
            if (!hasGrammarCache) {
              setGrammarAnalyzing(true);
            }
            if (!hasSeoCache) {
              setSeoAnalyzing(true);
            }
            if (!hasUiQualityCache) {
              setUiAnalyzing(true);
            }
            if (!hasPerformanceCache) {
              setPerformanceAnalyzing(true);
            }
            if (!hasCustomInstructionsCache) {
              setCustomInstructionsAnalyzing(true);
            }
          } else if (
            data.page.analysis_status === "pending" ||
            !data.page.analysis_status
          ) {
            // Page hasn't been analyzed yet - start fresh analysis for missing cached data
            if (!hasGrammarCache) {
              analyzeContentWithGemini();
            }
            if (!hasSeoCache) {
              analyzeSeoWithAPI();
            }
            if (!hasPerformanceCache) {
              analyzePerformanceWithAPI();
            }
          }
        }
      } else {
        setError(data.error || "Failed to fetch page data");
      }
    } catch (error) {
      setError("Failed to fetch page data");
    } finally {
      setLoading(false);
    }
  }, [pageId, grammarCached, seoCached, performanceCached, customInstructionsCached]);

  useEffect(() => {
    fetchPageData();

    // Set up Supabase Realtime subscriptions
    const supabase = createClient();
    const channels: any[] = [];

    const setupRealtimeSubscriptions = () => {
      if (!pageId) return;

      // Subscribe to page status changes
      const pageChannel = supabase
        .channel(`page-status-${pageId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "scraped_pages",
            filter: `id=eq.${pageId}`,
          },
          async (payload) => {
            const updatedPage = payload.new as any;

            // Update page state
            setPage((prev) => ({ ...prev, ...updatedPage } as ScrapedPage));

            // Handle status changes
            if (updatedPage.analysis_status === "analyzing") {
              setIsAnalysisRunning(true);
              if (!grammarCached) setGrammarAnalyzing(true);
              if (!seoCached) setSeoAnalyzing(true);
              if (!uiQualityCached) setUiAnalyzing(true);
              if (!performanceCached) setPerformanceAnalyzing(true);
              if (!customInstructionsCached) setCustomInstructionsAnalyzing(true);
            } else if (updatedPage.analysis_status === "completed") {
              // Fetch the completed results

              await fetchAnalysisResults();
            } else if (updatedPage.analysis_status === "failed") {
              setIsAnalysisRunning(false);
              setGrammarAnalyzing(false);
              setSeoAnalyzing(false);
              setUiAnalyzing(false);
              setPerformanceAnalyzing(false);
              setCustomInstructionsAnalyzing(false);
            }
          }
        )
        .subscribe();

      channels.push(pageChannel);

      // Subscribe to analysis results updates
      const resultsChannel = supabase
        .channel(`results-update-${pageId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "audit_results",
            filter: `scraped_page_id=eq.${pageId}`,
          },
          async (payload) => {

            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              // Fetch the latest results
              await fetchAnalysisResults();
            }
          }
        )
        .subscribe();

      channels.push(resultsChannel);

    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [pageId, fetchAnalysisResults]);

  // Add polling fallback when analysis is running with timeout
  useEffect(() => {
    if (isAnalysisRunning) {
      let pollCount = 0;
      const maxPolls = 60; // Maximum 5 minutes of polling (60 * 5 seconds)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        // Stop polling if we've exceeded the maximum time
        if (pollCount >= maxPolls) {
          console.warn('Polling timeout reached for page analysis');
          setIsAnalysisRunning(false);
          clearInterval(pollInterval);
          return;
        }
        
        await fetchPageData();
      }, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [isAnalysisRunning, fetchPageData]);

  // Manual analysis trigger for both
  const startFullAnalysis = async () => {
    if (!project?.id) return;

    setIsAnalysisRunning(true);
    setGrammarAnalyzing(true);
    setSeoAnalyzing(true);
    setUiAnalyzing(true);
    setPerformanceAnalyzing(true);
    try {
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["grammar", "seo", "ui", "performance"],
            use_cache: false,
            background: false,
            force_refresh: true,
          }),
        }
      );

      if (response.ok) {
        // Results will come via realtime or polling
      }
    } catch (error) {
      console.error("Failed to start analysis:", error);
      setIsAnalysisRunning(false);
      setGrammarAnalyzing(false);
      setSeoAnalyzing(false);
      setUiAnalyzing(false);
      setPerformanceAnalyzing(false);
    }
  };

  // --- NEW: Grammar-only analysis ---
  const analyzeGrammarOnly = async (forceRefresh = false) => {
    setGrammarAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!project?.id) {
        console.error("No project ID available for analysis");
        return;
      }
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["grammar"],
            use_cache: !forceRefresh,
            background: false,
            force_refresh: forceRefresh,
          }),
        }
      );
      if (response.ok) {
        const grammarData = await response.json();
        setGrammarCached(grammarData.cached || false);
        setGrammarCachedAt(grammarData.cached_at || null);
        const { cached, cached_at, background, ...analysisData } = grammarData;
        if (analysisData.wordCount !== undefined) {
          setAnalysis((prev) =>
            prev
              ? {
                  ...prev,
                  grammarCheck: analysisData,
                }
              : null
          );
          setGrammarAnalyzing(false);
          setIsAnalysisRunning(false);
        }
      }
    } catch (error) {
      console.error("Grammar analysis error:", error);
      setGrammarAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  // --- NEW: UI-only analysis ---
  const analyzeUiQuality = async (
    device: "phone" | "tablet" | "desktop",
    forceRefresh = false
  ) => {
    setUiAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!project?.id) {
        console.error("No project ID available for analysis");
        return;
      }

      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["ui"],
            ui_devices: [device],
            use_cache: !forceRefresh,
            background: false,
            force_refresh: forceRefresh,
          }),
        }
      );
      if (response.ok) {
        // UI analysis is async, results will come via realtime or polling
        setUiAnalyzing(false); // Optionally keep true until realtime update
        setIsAnalysisRunning(false);
      }
    } catch (error) {
      console.error("UI quality analysis error:", error);
      setUiAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  // --- Update refresh handlers ---
  const refreshGrammarAnalysis = () => {
    analyzeGrammarOnly(true);
  };

  const refreshSeoAnalysis = () => {
    analyzeSeoWithAPI(true);
  };

  const refreshUiQualityAnalysis = () => {
    analyzeUiQuality(activeUiTab, true);
  };

  const refreshPerformanceAnalysis = () => {
    analyzePerformanceWithAPI(true);
  };

  const refreshImagesAnalysis = async () => {
    if (!project?.id) return;
    
    setImagesAnalyzing(true);
    setIsAnalysisRunning(true);
    
    try {
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["images"],
            use_cache: false,
            background: false,
            force_refresh: true,
          }),
        }
      );
      
      if (response.ok) {
        // Results will come via realtime or polling
        await fetchAnalysisResults();
      }
    } catch (error) {
      console.error("Images analysis error:", error);
      setImagesAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  const refreshTechnicalAnalysis = async () => {
    if (!project?.id) return;
    
    setTechnicalAnalyzing(true);
    setIsAnalysisRunning(true);
    
    try {
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["tags", "social", "links"],
            use_cache: false,
            background: false,
            force_refresh: true,
          }),
        }
      );
      
      if (response.ok) {
        // Results will come via realtime or polling
        await fetchAnalysisResults();
      }
    } catch (error) {
      console.error("Technical analysis error:", error);
      setTechnicalAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  // Handle custom instruction analysis without saving to DB
  const analyzeCustomInstruction = async () => {
    if (!customInstructionInput.trim() || !project?.id) return;
    
    setIsCustomInstructionLoading(true);
    setCustomInstructionResult(null);
    
    try {
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["custom_instructions"],
            custom_instruction: customInstructionInput.trim(),
            use_cache: false,
            background: false,
            force_refresh: true,
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log("Custom instruction result:", result);
        setCustomInstructionResult(result.custom_instructions_analysis);
      } else {
        console.error("Custom instruction analysis failed");
      }
    } catch (error) {
      console.error("Custom instruction analysis error:", error);
    } finally {
      setIsCustomInstructionLoading(false);
    }
  };

  const analyzeContentWithGemini = async (forceRefresh = false) => {
    setGrammarAnalyzing(true);
    setIsAnalysisRunning(true);
    setUiAnalyzing(true);
    try {
      if (!project?.id) {
        console.error("No project ID available for analysis");
        return;
      }


      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["grammar", "seo", "ui"],
            use_cache: !forceRefresh,
            background: false,
            force_refresh: forceRefresh,
          }),
        }
      );

      if (response.ok) {
        const grammarData = await response.json();


        // Check if this is cached data
        setGrammarCached(grammarData.cached || false);
        setGrammarCachedAt(grammarData.cached_at || null);

        // Remove caching metadata before setting analysis
        const { cached, cached_at, background, ...analysisData } = grammarData;

        if (analysisData.wordCount !== undefined) {
          // We got the results immediately
          setAnalysis((prev) =>
            prev
              ? {
                  ...prev,
                  grammarCheck: analysisData,
                }
              : null
          );
          setGrammarAnalyzing(false);
          setIsAnalysisRunning(false);
        }
        // Otherwise, results will come via realtime subscription
      }
    } catch (error) {
      console.error("Grammar analysis error:", error);
      setGrammarAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  const analyzeSeoWithAPI = async (forceRefresh = false) => {
    setSeoAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!project?.id) {
        console.error("No project ID available for analysis");
        return;
      }


      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["seo"],
            use_cache: !forceRefresh,
            background: false,
            force_refresh: forceRefresh,
          }),
        }
      );

      if (response.ok) {
        const seoData = await response.json();


        // Check if this is cached data
        setSeoCached(seoData.cached || false);
        setSeoCachedAt(seoData.cached_at || null);

        // Remove caching metadata before setting analysis
        const { cached, cached_at, background, ...analysisData } = seoData;

        if (analysisData.overallScore !== undefined) {
          // We got the results immediately
          setAnalysis((prev) =>
            prev
              ? {
                  ...prev,
                  seoAnalysis: analysisData,
                }
              : null
          );
          setSeoAnalyzing(false);
          setIsAnalysisRunning(false);
        }
        // Otherwise, results will come via realtime subscription
      }
    } catch (error) {
      console.error("SEO analysis error:", error);
      setSeoAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  const analyzePage = (pageData: ScrapedPage): PageAnalysis => {
    const html = pageData.html || "";
    const url = pageData.url;

    // Meta tags analysis
    const metaTags = {
      title: extractTitle(html) || pageData.title,
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

    // Redirect check
    const redirectCheck = {
      hasRedirect: pageData.status_code !== 200,
      finalUrl: url,
      redirectChain: [], // Would need to track during crawling
    };

    // HTTPS check
    const httpsCheck = {
      isHttps: url.startsWith("https://"),
      hasSecurityHeaders: false, // Would need response headers
    };

    return {
      metaTags,
      headingStructure,
      robotsCheck,
      linksCheck,
      redirectCheck,
      httpsCheck,
      grammarCheck: null, // Will be populated by Gemini API
      seoAnalysis: null, // Will be populated by SEO API
    };
  };

  const extractMetaContent = (html: string, name: string): string | null => {
    const regex = new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`,
      "i"
    );
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  const extractTitle = (html: string): string | null => {
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
  };

  const extractMetaProperty = (
    html: string,
    property: string
  ): string | null => {
    const regex = new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`,
      "i"
    );
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  const extractLinkHref = (html: string, rel: string): string | null => {
    const regex = new RegExp(
      `<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*?)["']`,
      "i"
    );
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  const analyzeHeadings = (html: string) => {
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const allHeadingMatches =
      html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];

    const h1Text = h1Matches.map((match) =>
      match.replace(/<[^>]*>/g, "").trim()
    );

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
  };

  const analyzeLinks = (html: string, baseUrl: string) => {
    const linkMatches =
      html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
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
  };

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
    );
  };

  // Helper: Render a radial score chart
  const RadialScore = ({ score, label, color }: { score: number; label: string; color: string }) => {
    const radius = 32;
    const stroke = 8;
    const normalizedScore = Math.max(0, Math.min(score, 100));
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedScore / 100) * circumference;
    return (
      <div className="flex flex-col items-center">
        <svg width="80" height="80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s' }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            fontSize="1.5rem"
            fill={color}
            fontWeight="bold"
          >
            {normalizedScore}
          </text>
        </svg>
        <span className="text-xs mt-1 text-muted-foreground">{label}</span>
      </div>
    );
  };

  // --- Performance Analysis Handler ---
  const analyzePerformanceWithAPI = async (forceRefresh = false) => {
    setPerformanceAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!project?.id) {
        console.error("No project ID available for analysis");
        return;
      }
      const response = await fetch(
        `/api/audit-projects/${project.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page_ids: [pageId],
            analysis_types: ["performance"],
            use_cache: !forceRefresh,
            background: false,
            force_refresh: forceRefresh,
          }),
        }
      );
      if (response.ok) {
        const perfData = await response.json();
        setPerformanceCached(perfData.cached || false);
        setPerformanceCachedAt(perfData.cached_at || null);
        setPerformanceAnalyzing(false);
        setIsAnalysisRunning(false);
      }
    } catch (error) {
      console.error("Performance analysis error:", error);
      setPerformanceAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  if (loading) {
    return <PageDetailSkeleton />;
  }

  if (!project || !page || !analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 ">
              {/* Back Button - Top Left */}
        <div className="mb-4">
          <BackButton href={project ? `/audit?project=${project.id}` : "/audit"} id={`page-detail-${pageId || 'default'}`}>
            Back to Audit
          </BackButton>
        </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Page Header with Title, URL, and Action Buttons */}
      {page && (
        <div className="flex items-start justify-between gap-4">
          {/* Page Title and URL */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">
                {page.title || "Untitled Page"}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {page.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {page.analysis_status && (
                <Badge
                  variant={
                    page.analysis_status === "completed"
                      ? "default"
                      : page.analysis_status === "analyzing"
                      ? "secondary"
                      : page.analysis_status === "failed"
                      ? "destructive"
                      : "outline"
                  }
                >
                  Page Status: {page.analysis_status}
                </Badge>
              )}

              {/* Content freshness indicator */}
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Content: {new Date(page.scraped_at).toLocaleDateString()} at{" "}
                {new Date(page.scraped_at).toLocaleTimeString()}
              </Badge>

              {/* Real-time analysis status */}
              {isAnalysisRunning && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-950 text-xs"
                >
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Re-scraping & Analyzing...
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Analysis Status Indicator */}
            {isAnalysisRunning && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Analysis Running
              </Badge>
            )}

            {/* Manual Refresh Button */}
            <Button
              onClick={fetchPageData}
              disabled={grammarAnalyzing || seoAnalyzing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  grammarAnalyzing || seoAnalyzing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="h-7 px-3"
              onClick={startFullAnalysis}
              disabled={grammarAnalyzing || seoAnalyzing || uiAnalyzing}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-Analyze
            </Button>

            {/* Start Analysis Button - show when no analysis is running and no results */}
            {!isAnalysisRunning && (!grammarCached || !seoCached) && (
              <Button onClick={startFullAnalysis} variant="default" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1  gap-6">
      
        <div className="">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Detailed analysis across different aspects of your page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Main Tab Navigation */}
              <div className="border-b mb-6">
                <div className="flex flex-wrap gap-1">
                  {[
                    {
                      id: "grammar",
                      label: "Grammar & Content",
                      icon: FileText,
                      analyzing: grammarAnalyzing,
                      cached: grammarCached,
                    },
                    {
                      id: "seo",
                      label: "SEO & Structure",
                      icon: Tag,
                      analyzing: seoAnalyzing,
                      cached: seoCached,
                    },
                    {
                      id: "performance_analysis",
                      label: "Performance & Accessibility",
                      icon: BarChart3,
                      analyzing: performanceAnalyzing,
                      cached: performanceCached,
                    },
                    {
                      id: "ui_quality",
                      label: "UI Quality",
                      icon: Eye,
                      analyzing: uiAnalyzing,
                      cached: uiQualityCached,
                    },
                    {
                      id: "custom_instructions",
                      label: "Custom Instructions",
                      icon: Settings,
                      analyzing: customInstructionsAnalyzing,
                      cached: customInstructionsCached,
                    },
                    {
                      id: "images",
                      label: "Images",
                      icon: Image,
                      analyzing: imagesAnalyzing,
                      cached: false,
                    },
                    {
                      id: "technical_fixes",
                      label: "Technical Fixes",
                      icon: Shield,
                      analyzing: technicalAnalyzing,
                      cached: false,
                    },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAnalysisTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                          activeAnalysisTab === tab.id
                            ? "border-primary text-primary bg-primary/10"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {tab.label}
                        {tab.analyzing && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        )}
                        {tab.cached && !tab.analyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {/* Grammar & Content Tab */}
                {activeAnalysisTab === "grammar" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          Grammar & Content Quality
                        </h3>
                        {grammarAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {grammarCached && !grammarAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                      </div>

                    </div>

                    <p className="text-sm text-muted-foreground">
                      {grammarAnalyzing
                        ? "Re-scraping page and analyzing with AI..."
                        : grammarCached && grammarCachedAt
                        ? `Content analysis (from ${new Date(
                            grammarCachedAt
                          ).toLocaleDateString()})`
                        : "Content readability and writing quality analysis"}
                    </p>

                    {!analysis.grammarCheck || grammarAnalyzing ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-muted-foreground">
                            {grammarAnalyzing
                              ? "Analyzing Fresh Content with AI..."
                              : "Loading..."}
                          </p>
                          {grammarAnalyzing && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Re-scraping page for latest content
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Grammar Sub-tabs */}
                        {(() => {
                          const grammarCheck = analysis.grammarCheck;
                          if (!grammarCheck) return null;

                          // Categorize all errors by type with safety checks
                          const allGrammarErrors =
                            grammarCheck.grammarErrors || [];
                          const grammarErrors = allGrammarErrors.filter(
                            (e) => e.type === "grammar"
                          );
                          const punctuationErrors = allGrammarErrors.filter(
                            (e) => e.type === "punctuation"
                          );
                          const structureErrors = allGrammarErrors.filter(
                            (e) => e.type === "structure"
                          );
                          const ukEnglishErrors = allGrammarErrors.filter(
                            (e) => e.type === "US English"
                          );
                          const spellingErrors =
                            grammarCheck.spellingErrors || [];
                          const issues = grammarCheck.issues || [];

                          // Company information tab data
                          const companyInfo = grammarCheck.companyInformation;
                          const hasCompanyInfo =
                            companyInfo?.hasExpectedInfo || false;
                          const companyInfoIssues = companyInfo?.issues || [];
                          const companyInfoCount = hasCompanyInfo
                            ? companyInfoIssues.length
                            : 0;

                          const tabs = [
                            {
                              id: "grammar",
                              label: "Grammar",
                              count: grammarErrors.length,
                              errors: grammarErrors,
                              type: "error" as const,
                            },
                            {
                              id: "punctuation",
                              label: "Punctuation",
                              count: punctuationErrors.length,
                              errors: punctuationErrors,
                              type: "error" as const,
                            },
                            {
                              id: "structure",
                              label: "Structure",
                              count: structureErrors.length,
                              errors: structureErrors,
                              type: "error" as const,
                            },
                            {
                              id: "ukEnglish",
                              label: "UK English",
                              count: ukEnglishErrors.length,
                              errors: ukEnglishErrors,
                              type: "error" as const,
                            },
                            {
                              id: "spelling",
                              label: "Spelling",
                              count: spellingErrors.length,
                              errors: spellingErrors,
                              type: "error" as const,
                            },
                            {
                              id: "issues",
                              label: "Content Issues",
                              count: issues.length,
                              errors: issues,
                              type: "issue" as const,
                            },
                            ...(hasCompanyInfo
                              ? [
                                  {
                                    id: "company",
                                    label: "Company Information",
                                    count: companyInfoCount,
                                    errors: companyInfoIssues,
                                    type: "company" as const,
                                    data: companyInfo,
                                  },
                                ]
                              : []),
                          ].filter(
                            (tab) => tab.count > 0 || tab.type === "company"
                          );

                          if (tabs.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                <p className="text-xl font-medium">
                                  Perfect Content!
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  No grammar, spelling, or content issues found.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Grammar Sub-tab Navigation */}
                              <div className="border-b">
                                <div className="flex flex-wrap gap-1">
                                  {tabs.map((tab) => (
                                    <button
                                      key={tab.id}
                                      onClick={() =>
                                        setActiveGrammarTab(tab.id)
                                      }
                                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeGrammarTab === tab.id
                                          ? "border-primary text-primary bg-primary/10"
                                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                      }`}
                                    >
                                      {tab.label} ({tab.count})
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Grammar Sub-tab Content */}
                              <div className="min-h-[200px]">
                                {tabs.map((tab) => (
                                  <div
                                    key={tab.id}
                                    className={
                                      activeGrammarTab === tab.id
                                        ? "block"
                                        : "hidden"
                                    }
                                  >
                                    <div className="space-y-3">
                                      {tab.type === "company" ? (
                                        // Company Information Tab
                                        <div className="space-y-6">
                                          {/* Company Information Score */}
                                          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-medium text-blue-800 dark:text-blue-200">
                                                Company Information Score
                                              </h5>
                                              <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                  {companyInfo?.companyInfoScore ||
                                                    0}
                                                </span>
                                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                                  /100
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Expected vs Found Information */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Found Information */}
                                            <div className="p-4 border rounded-lg">
                                              <h6 className="font-medium mb-3 text-foreground">
                                                Information Found on Page
                                              </h6>
                                              <div className="space-y-2">
                                                {companyInfo?.foundInformation &&
                                                  Object.entries(
                                                    companyInfo.foundInformation
                                                  ).map(([key, value]) => (
                                                    <div
                                                      key={key}
                                                      className="flex items-center justify-between py-1"
                                                    >
                                                      <span className="text-sm text-muted-foreground capitalize">
                                                        {key
                                                          .replace(
                                                            /([A-Z])/g,
                                                            " $1"
                                                          )
                                                          .toLowerCase()}
                                                        :
                                                      </span>
                                                      <span className="text-sm font-medium">
                                                        {value
                                                          ? typeof value ===
                                                            "string"
                                                            ? `"${value}"`
                                                            : "Found"
                                                          : "Not found"}
                                                      </span>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>

                                            {/* Compliance Status */}
                                            <div className="p-4 border rounded-lg">
                                              <h6 className="font-medium mb-3 text-foreground">
                                                Compliance Status
                                              </h6>
                                              <div className="space-y-2">
                                                {companyInfo?.complianceStatus &&
                                                  Object.entries(
                                                    companyInfo.complianceStatus
                                                  ).map(([key, status]) => (
                                                    <div
                                                      key={key}
                                                      className="flex items-center justify-between py-1"
                                                    >
                                                      <span className="text-sm text-muted-foreground capitalize">
                                                        {key
                                                          .replace(
                                                            /([A-Z])/g,
                                                            " $1"
                                                          )
                                                          .toLowerCase()}
                                                        :
                                                      </span>
                                                      <Badge
                                                        variant={
                                                          status === "correct"
                                                            ? "default"
                                                            : status ===
                                                              "missing"
                                                            ? "destructive"
                                                            : status ===
                                                              "incorrect"
                                                            ? "destructive"
                                                            : "secondary"
                                                        }
                                                        className="text-xs"
                                                      >
                                                        {status}
                                                      </Badge>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Company Information Issues */}
                                          {companyInfoIssues.length > 0 && (
                                            <div>
                                              <h6 className="font-medium mb-3 text-foreground">
                                                Company Information Issues
                                              </h6>
                                              <div className="space-y-3">
                                                {companyInfoIssues.map(
                                                  (issue, i) => (
                                                    <div
                                                      key={i}
                                                      className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
                                                    >
                                                      <div className="flex items-start gap-3">
                                                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                          <h5 className="font-medium text-orange-800 dark:text-orange-200">
                                                            Company Information
                                                            Issue
                                                          </h5>
                                                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                                            {issue}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Company Information Suggestions */}
                                          {(companyInfo?.suggestions || [])
                                            .length > 0 && (
                                            <div>
                                              <h6 className="font-medium mb-3 text-foreground">
                                                Suggestions for Improvement
                                              </h6>
                                              <div className="space-y-3">
                                                {(
                                                  companyInfo?.suggestions || []
                                                ).map(
                                                  (
                                                    suggestion: string,
                                                    i: number
                                                  ) => (
                                                    <div
                                                      key={i}
                                                      className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
                                                    >
                                                      <div className="flex items-start gap-3">
                                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                          <h5 className="font-medium text-green-800 dark:text-green-200">
                                                            Suggestion
                                                          </h5>
                                                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                            {suggestion}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Perfect Company Information Message */}
                                          {companyInfoIssues.length === 0 &&
                                            (companyInfo?.companyInfoScore ||
                                              0) >= 95 && (
                                              <div className="text-center py-8">
                                                <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                                <p className="text-xl font-medium">
                                                  Perfect Company Information!
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                  All expected company
                                                  information is present and
                                                  correctly displayed.
                                                </p>
                                              </div>
                                            )}
                                        </div>
                                      ) : tab.type === "issue" ? (
                                        // Content Issues (strings)
                                        (tab.errors as string[]).map(
                                          (issue, i) => (
                                            <div
                                              key={i}
                                              className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20"
                                            >
                                              <div className="flex items-start gap-3">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                  <h5 className="font-medium text-amber-800 dark:text-amber-200">
                                                    Content Issue
                                                  </h5>
                                                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                    {issue}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )
                                      ) : (
                                        // Grammar, Spelling, etc. errors (objects)
                                        (
                                          tab.errors as Array<{
                                            text: string;
                                            suggestion: string;
                                            type?: string;
                                            explanation?: string;
                                            position?: string;
                                          }>
                                        ).map((error, i) => (
                                          <div
                                            key={i}
                                            className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20"
                                          >
                                            <div className="flex items-start gap-3">
                                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <h5 className="font-medium text-red-800 dark:text-red-200">
                                                    {tab.label} Error
                                                  </h5>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {error.type || "error"}
                                                  </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                  <div>
                                                    <span className="text-sm text-red-700 dark:text-red-300">
                                                      <strong>Found:</strong> "
                                                      {error.text}"
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                                      <strong>
                                                        Should be:
                                                      </strong>{" "}
                                                      "{error.suggestion}"
                                                    </span>
                                                  </div>
                                                  {error.explanation && (
                                                    <div>
                                                      <span className="text-sm text-muted-foreground">
                                                        <strong>Why:</strong>{" "}
                                                        {error.explanation}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {tab.id === "spelling" &&
                                                    error.position && (
                                                      <div>
                                                        <span className="text-xs text-muted-foreground">
                                                          <strong>
                                                            Location:
                                                          </strong>{" "}
                                                          {error.position}
                                                        </span>
                                                      </div>
                                                    )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}

                        {/* Content Statistics */}
                        <div className="mt-8 pt-6 border-t">
                          <h4 className="font-medium mb-4">
                            Content Statistics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">
                                {analysis.grammarCheck.wordCount || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Words
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">
                                {analysis.grammarCheck.estimatedReadingTime ||
                                  0}
                                m
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Reading Time
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold capitalize">
                                {analysis.grammarCheck.tone || "neutral"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Tone
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">
                                {analysis.grammarCheck.readabilityScore || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Readability
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* SEO & Structure Tab */}
                {activeAnalysisTab === "seo" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          SEO & Structure
                        </h3>
                        {seoAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {seoCached && !seoAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                      </div>

                    </div>

                    <p className="text-sm text-muted-foreground">
                      {seoAnalyzing
                        ? "Re-scraping page and analyzing SEO..."
                        : seoCached && seoCachedAt
                        ? `SEO analysis (from ${new Date(
                            seoCachedAt
                          ).toLocaleDateString()})`
                        : "Technical SEO and structure analysis"}
                    </p>

                    {seoAnalyzing ? (
                      // Show loading placeholder when SEO analysis is running
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
                          <p className="text-sm text-muted-foreground">
                            Analyzing Fresh SEO Content...
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Re-scraping page for latest structure and meta data
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* SEO Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Meta Tags */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Meta Tags
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Title Tag</span>
                                  {getStatusIcon(!!analysis.metaTags.title)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {analysis.metaTags.title
                                    ? `"${analysis.metaTags.title}" (${
                                        (analysis.metaTags.title || "").length
                                      } chars)`
                                    : "Missing"}
                                </p>
                              </div>

                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    Meta Description
                                  </span>
                                  {getStatusIcon(
                                    !!analysis.metaTags.description
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {analysis.metaTags.description
                                    ? `"${analysis.metaTags.description}" (${
                                        (analysis.metaTags.description || "")
                                          .length
                                      } chars)`
                                    : "Missing"}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 border rounded text-center">
                                  <div className="font-medium mb-1">
                                    Viewport
                                  </div>
                                  <div className="text-2xl">
                                    {analysis.metaTags.viewport ? "✓" : "✗"}
                                  </div>
                                </div>
                                <div className="p-3 border rounded text-center">
                                  <div className="font-medium mb-1">
                                    Canonical
                                  </div>
                                  <div className="text-2xl">
                                    {analysis.metaTags.canonical ? "✓" : "✗"}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Heading Structure */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Heading Structure
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">H1 Tags</span>
                                  {getStatusIcon(
                                    analysis.headingStructure.h1Count === 1
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {analysis.headingStructure.h1Count} found
                                </p>
                                {(analysis.headingStructure.h1Text || [])
                                  .length > 0 && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    "{analysis.headingStructure.h1Text[0]}"
                                  </p>
                                )}
                              </div>

                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    Heading Hierarchy
                                  </span>
                                  {getStatusIcon(
                                    (
                                      analysis.headingStructure.allHeadings ||
                                      []
                                    ).length > 0
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {
                                    (
                                      analysis.headingStructure.allHeadings ||
                                      []
                                    ).length
                                  }{" "}
                                  total headings
                                </p>
                                {(analysis.headingStructure.allHeadings || [])
                                  .length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {(
                                      analysis.headingStructure.allHeadings ||
                                      []
                                    )
                                      .slice(0, 8)
                                      .map((h, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-muted rounded text-xs"
                                        >
                                          H{h.level}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Technical SEO */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Technical
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">HTTPS</span>
                                <span
                                  className={`text-2xl ${
                                    analysis.httpsCheck.isHttps
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {analysis.httpsCheck.isHttps ? "✓" : "✗"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">Indexable</span>
                                <span
                                  className={`text-2xl ${
                                    analysis.robotsCheck.indexable
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {analysis.robotsCheck.indexable ? "✓" : "✗"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">
                                  Direct Access
                                </span>
                                <span
                                  className={`text-2xl ${
                                    !analysis.redirectCheck.hasRedirect
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {!analysis.redirectCheck.hasRedirect
                                    ? "✓"
                                    : "✗"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Links Analysis */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Links</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 border rounded">
                                  <div className="text-2xl font-bold">
                                    {analysis.linksCheck.totalLinks}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total
                                  </div>
                                </div>
                                <div className="p-3 border rounded">
                                  <div className="text-2xl font-bold">
                                    {analysis.linksCheck.internalLinks}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Internal
                                  </div>
                                </div>
                                <div className="p-3 border rounded">
                                  <div className="text-2xl font-bold">
                                    {analysis.linksCheck.externalLinks}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    External
                                  </div>
                                </div>
                              </div>
                              {/* Image Tag Analysis */}

                              {hasImgTags(analysis.seoAnalysis) && (
                                <>
                                  <div className="grid grid-cols-2 gap-3 text-center mt-4">
                                    <div className="p-3 border rounded">
                                      <div className="text-2xl font-bold">
                                        {analysis.seoAnalysis.imgTags.total ||
                                          0}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Images (&lt;img&gt; tags)
                                      </div>
                                    </div>
                                    <div className="p-3 border rounded">
                                      <div className="text-2xl font-bold">
                                        {analysis.seoAnalysis.imgTags
                                          .missingAltCount || 0}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Missing alt attribute
                                      </div>
                                    </div>
                                  </div>
                                  {/* List images missing alt */}
                                  {Array.isArray(
                                    analysis.seoAnalysis.imgTags.imgTags
                                  ) &&
                                    analysis.seoAnalysis.imgTags.imgTags.filter(
                                      (img: any) => !img.hasAlt
                                    ).length > 0 && (
                                      <div className="mt-4 text-left">
                                        <div className="font-medium text-destructive mb-2 text-sm">
                                          Images missing alt attribute:
                                        </div>
                                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                          {analysis.seoAnalysis.imgTags.imgTags
                                            .filter((img: any) => !img.hasAlt)
                                            .map((img: any, idx: number) => (
                                              <li
                                                key={idx}
                                                className="break-all"
                                              >
                                                {img.src}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* SEO Issues and Recommendations */}
                        {analysis.seoAnalysis && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {(analysis.seoAnalysis.issues || []).length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-destructive">
                                    Issues Found
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {(analysis.seoAnalysis.issues || []).map(
                                      (issue, i) => (
                                        <div
                                          key={i}
                                          className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm"
                                        >
                                          {issue}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {(analysis.seoAnalysis.recommendations || [])
                              .length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-primary">
                                    Recommendations
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {(
                                      analysis.seoAnalysis.recommendations || []
                                    ).map((rec, i) => (
                                      <div
                                        key={i}
                                        className="p-3 bg-primary/10 border border-primary/20 rounded text-primary text-sm"
                                      >
                                        {rec}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {(analysis.seoAnalysis.issues || []).length === 0 &&
                              (analysis.seoAnalysis.recommendations || [])
                                .length === 0 && (
                                <div className="col-span-2 text-center py-8">
                                  <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                  <p className="text-lg font-medium">
                                    Excellent SEO!
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    No issues found
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* *********************************************************************************** */}
                {activeAnalysisTab === "ui_quality" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">UI Quality</h3>
                        {uiAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {uiQualityCached && !uiAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                      </div>
                      {/* Refresh Button for UI Quality */}

                    </div>

                    {/* UI Device Tabs */}
                    <div className="border-b mb-4">
                      <div className="flex gap-1">
                        {["phone", "tablet", "desktop"].map((device) => (
                          <button
                            key={device}
                            onClick={() =>
                              setActiveUiTab(
                                device as "phone" | "tablet" | "desktop"
                              )
                            }
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              activeUiTab === device
                                ? "border-primary text-primary bg-primary/10"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                          >
                            {device.charAt(0).toUpperCase() + device.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Tab Content */}
                    {uiAnalyzing ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-muted-foreground">
                            Analyzing UI screenshot with AI...
                          </p>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const deviceKey =
                          `${activeUiTab}_ui_quality_analysis` as keyof PageAnalysis;
                        const deviceAnalysis = analysis?.[deviceKey];
                        if (!deviceAnalysis) {
                          return (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">
                                No UI Quality data available for this device.
                              </p>
                            </div>
                          );
                        }
                        return (
                          <>
                            {deviceAnalysis.overall_summary && (
                              <Card className="mb-6">
                                <CardHeader>
                                  <CardTitle className="text-base">
                                    Overall Summary
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-muted-foreground">
                                    {deviceAnalysis.overall_summary}
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                            <div className="space-y-4">
                              {deviceAnalysis.issues &&
                              deviceAnalysis.issues.length > 0 ? (
                                deviceAnalysis.issues.map(
                                  (
                                    issue: {
                                      type: string;
                                      description: string;
                                      suggestion: string;
                                    },
                                    idx: number
                                  ) => (
                                    <Card
                                      key={idx}
                                      className="border-l-4 border-yellow-400"
                                    >
                                      <CardContent className="py-4">
                                        <div className="flex items-start gap-3">
                                          <AlertTriangle className="h-6 w-6 text-yellow-200 mt-1" />
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-semibold text-yellow-700">
                                                {issue.type}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >{`Issue ${idx + 1}`}</Badge>
                                            </div>
                                            <p className="text-sm mb-2">
                                              {issue.description}
                                            </p>
                                            <div className="text-xs text-muted-foreground">
                                              <span className="font-semibold">
                                                Suggestion:
                                              </span>{" "}
                                              {issue.suggestion}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                )
                              ) : (
                                <div className="text-center py-8">
                                  <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                  <p className="text-lg font-medium">
                                    No UI issues found!
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Your UI looks great.
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                )}
                {/* *********************************************************************************** */}

                {activeAnalysisTab === "performance_analysis" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Performance & Accessibility</h3>
                        {performanceAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {performanceCached && !performanceAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
                      </div>

                    </div>
                    {(() => {
                      let perf: any = (analysis as any)?.performance_analysis;
                      if (!perf && typeof (analysis as any)?.performance_analysis === 'string') {
                        try {
                          perf = JSON.parse((analysis as any).performance_analysis);
                        } catch {
                          perf = null;
                        }
                      }
                      if (!perf) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No performance data available.</p>
                          </div>
                        );
                      }
                      // Summary Section
                      return (
                        <>
                          {/* Summary & Quick Wins */}
                          {perf.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div className="font-medium">Overall Grade: <span className="text-lg font-bold">{perf.summary.overallGrade || '-'}</span></div>
                                    {perf.summary.primaryIssues && perf.summary.primaryIssues.length > 0 && (
                                      <div>
                                        <div className="font-medium text-destructive mb-1 text-sm">Primary Issues:</div>
                                        <ul className="list-disc list-inside text-xs text-destructive space-y-1">
                                          {perf.summary.primaryIssues.map((issue: string, idx: number) => (
                                            <li key={idx}>{issue}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                              {perf.summary.quickWins && perf.summary.quickWins.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Quick Wins</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="list-disc list-inside text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                                      {perf.summary.quickWins.map((win: string, idx: number) => (
                                        <li key={idx}>{win}</li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                          {/* Metrics & Scores */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Performance Metrics</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                  {perf.performance && perf.performance.metrics && Object.entries(perf.performance.metrics).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-2 border rounded text-center">
                                      <div className="text-xs text-muted-foreground mb-1">{key}</div>
                                      <div className="text-lg font-bold">{value !== undefined && value !== null ? value : 'N/A'}</div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Scores</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-8 items-center justify-center">
                                  <RadialScore score={perf.performance?.score || 0} label="Performance" color="#10b981" />
                                  <RadialScore score={perf.accessibility?.score || 0} label="Accessibility" color="#6366f1" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          {/* Core Web Vitals */}
                          {perf.performance && perf.performance.coreWebVitals && (
                            <div className="mt-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Core Web Vitals</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(perf.performance.coreWebVitals).map(([key, val]: [string, any]) => (
                                      <div key={key} className="p-2 border rounded text-center">
                                        <div className="text-xs text-muted-foreground mb-1">{key}</div>
                                        <div className="text-lg font-bold">{val.value !== undefined && val.value !== null ? val.value : 'N/A'}</div>
                                        <div className={`text-xs mt-1 ${val.rating === 'good' ? 'text-emerald-600' : val.rating === 'poor' ? 'text-red-600' : 'text-yellow-600'}`}>{val.rating}</div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                          {/* Opportunities */}
                          {perf.performance && perf.performance.opportunities && perf.performance.opportunities.length > 0 && (
                            <div className="mt-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-yellow-700">Opportunities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {perf.performance.opportunities.map((opp: any, i: number) => (
                                      <div key={i} className="p-3 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                                        <div className="font-semibold">{opp.title}</div>
                                        <div className="text-xs text-muted-foreground">{opp.description}</div>
                                        {opp.savings && <div className="text-xs mt-1">Estimated savings: {opp.savings}ms</div>}
                                        {opp.impact && <div className="text-xs mt-1">Impact: {opp.impact}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                          {/* Accessibility Issues */}
                          {perf.accessibility && perf.accessibility.issues && perf.accessibility.issues.length > 0 && (
                            <div className="mt-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-destructive">Accessibility Issues</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {perf.accessibility.issues.map((issue: any, i: number) => (
                                      <div key={i} className="p-3 border-l-4 border-red-400 bg-red-50 dark:bg-red-950/20 rounded">
                                        <div className="font-semibold">{issue.title}</div>
                                        <div className="text-xs text-muted-foreground">{issue.description}</div>
                                        {issue.severity && <div className="text-xs mt-1">Severity: {issue.severity}</div>}
                                        {issue.impact && <div className="text-xs mt-1">Impact: {issue.impact}</div>}
                                        {issue.elements && <div className="text-xs mt-1">Elements: {issue.elements}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                          {/* Accessibility Recommendations */}
                          {perf.accessibility && perf.accessibility.recommendations && perf.accessibility.recommendations.length > 0 && (
                            <div className="mt-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-primary">Accessibility Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {perf.accessibility.recommendations.map((rec: any, i: number) => (
                                      <div key={i} className="p-3 bg-primary/10 border border-primary/20 rounded text-primary text-sm">
                                        <div className="font-semibold">{rec.title}</div>
                                        <div className="text-xs text-muted-foreground">{rec.description}</div>
                                        {rec.priority && <div className="text-xs mt-1">Priority: {rec.priority}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                {/* *********************************************************************************** */}

                {activeAnalysisTab === "images" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Images</h3>
                        {imagesAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                      </div>
                    </div>
                    {((): React.ReactNode => {
                      // Show loading state when analyzing
                      if (imagesAnalyzing) {
                        return (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                              <p className="text-sm text-muted-foreground">
                                Analyzing images...
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Extracting and analyzing image data
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle the detailed image analysis data structure
                      let imageAnalysis: any = analysis.image_analysis;
                      
                      // If it's a string, try to parse it
                      if (typeof imageAnalysis === 'string') {
                        try {
                          imageAnalysis = JSON.parse(imageAnalysis);
                        } catch {
                          imageAnalysis = undefined;
                        }
                      }
                      
                      if (!imageAnalysis) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No image analysis data available.</p>
                          </div>
                        );
                      }
                      
                      // Handle the detailed analysis structure
                      if (imageAnalysis && typeof imageAnalysis === 'object' && 'images' in imageAnalysis && Array.isArray(imageAnalysis.images)) {
                        // Transform the data to match ImageAnalysisTable interface
                        const transformedImages = imageAnalysis.images.map((img: any) => ({
                          src: img.src || '',
                          alt: img.alt || '',
                          size: img.sizeKb ? img.sizeKb * 1024 : null, // Convert KB to bytes
                          format: img.format || '',
                          is_small: img.isLessThan500kb,
                          page_url: page?.url || ''
                        }));
                        
                        return (
                          <div className="space-y-6">
                            {/* Image Statistics Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-2xl font-bold text-primary">{imageAnalysis.totalImages}</div>
                                  <div className="text-sm text-muted-foreground">Total Images</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-2xl font-bold text-green-600">{imageAnalysis.imagesWithAlt}</div>
                                  <div className="text-sm text-muted-foreground">With Alt Text</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-2xl font-bold text-orange-600">{imageAnalysis.imagesWithoutAlt}</div>
                                  <div className="text-sm text-muted-foreground">Missing Alt Text</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-2xl font-bold text-blue-600">{imageAnalysis.imagesWithAlt || 0}</div>
                                  <div className="text-sm text-muted-foreground">With Alt Text</div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Issues and Recommendations */}
                            {(imageAnalysis.issues?.length > 0 || imageAnalysis.recommendations?.length > 0) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {imageAnalysis.issues?.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-destructive">Issues Found</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-2">
                                        {imageAnalysis.issues.map((issue: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{issue}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )}
                                {imageAnalysis.recommendations?.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-green-600">Recommendations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-2">
                                        {imageAnalysis.recommendations.map((rec: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{rec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}

                            {/* Images Table */}
                            {transformedImages.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Detailed Image Analysis</h3>
                                <ImageAnalysisTable images={transformedImages} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Fallback for simple array structure
                      if (Array.isArray(imageAnalysis)) {
                        const transformedImages = imageAnalysis.map((img: any) => ({
                          src: img.src || '',
                          alt: img.alt || '',
                          size: img.sizeKb ? img.sizeKb * 1024 : null,
                          format: img.format || '',
                          is_small: img.isLessThan500kb,
                          page_url: page?.url || ''
                        }));
                        
                        return <ImageAnalysisTable images={transformedImages} />;
                      }
                      
                      return (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No images found on this page.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {activeAnalysisTab === "custom_instructions" && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Custom Instructions Analysis
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ask questions about this page or use saved instructions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {customInstructionsAnalyzing && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analyzing...</span>
                          </div>
                        )}
                        {customInstructionsCached && !customInstructionsAnalyzing && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
                            Cached
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Custom Instruction Input */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Ask a Question
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="custom-instruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What would you like to know about this page?
                          </label>
                          <textarea
                            id="custom-instruction"
                            value={customInstructionInput}
                            onChange={(e) => setCustomInstructionInput(e.target.value)}
                            placeholder="e.g., How many images are on this page? What's the site name? Are there any contact forms?"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 resize-none"
                            rows={3}
                            disabled={isCustomInstructionLoading}
                          />
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={analyzeCustomInstruction}
                            disabled={!customInstructionInput.trim() || isCustomInstructionLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isCustomInstructionLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analyze
                              </>
                            )}
                          </Button>
                          
                          {customInstructionResult && (
                            <Button
                              onClick={() => {
                                setCustomInstructionInput("");
                                setCustomInstructionResult(null);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                                          {(() => {
                        // Show temporary result if available, otherwise show saved analysis
                        const analysisToShow = customInstructionResult || (analysis as any)?.custom_instructions_analysis;
                        
                        if (!analysisToShow) {
                          return (
                            <div className="text-center py-16">
                              <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                                  <Settings className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="max-w-md">
                                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    No Analysis Available
                                  </h4>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    Ask a question above or wait for saved instructions analysis to complete.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                                              // Handle error state
                        if (analysisToShow.error) {
                          return (
                            <div className="text-center py-12">
                              <div className="flex flex-col items-center gap-4">
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-full">
                                  <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                                <div className="max-w-md">
                                  <h4 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                                    Analysis Error
                                  </h4>
                                  <p className="text-red-600 dark:text-red-400 text-sm">
                                    {analysisToShow.error}
                                  </p>
                                  {analysisToShow.details && (
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                                      {analysisToShow.details}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Handle legacy response format
                        if (analysisToShow.response) {
                        return (
                          <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Analysis Response
                              </h4>
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {analysisToShow.response}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Handle both old and new analysis formats
                      const isNewFormat = analysisToShow.answer !== undefined;
                      
                      if (isNewFormat) {
                        // New focused format
                        return (
                          <div className="space-y-6">
                            {/* Direct Answer */}
                            {analysisToShow.answer && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    Analysis Result
                                  </h4>
                                </div>
                                
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                                  <div 
                                    className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: analysisToShow.answer }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Details Section */}
                            {analysisToShow.details && Object.keys(analysisToShow.details).length > 0 && (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Detailed Information
                                  </h4>
                                </div>
                                
                                <div className="grid gap-4">
                                  {Object.entries(analysisToShow.details).map(([key, value]) => {
                                    if (!value || value === "Information not found in the provided page content") return null;
                                    
                                    return (
                                      <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </h5>
                                        <div 
                                          className="text-sm text-gray-700 dark:text-gray-300"
                                          dangerouslySetInnerHTML={{ __html: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Summary Section */}
                            {analysisToShow.summary && analysisToShow.summary !== "Analysis completed" && (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Summary
                                  </h4>
                                </div>
                                
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div 
                                    className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: analysisToShow.summary }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        // Old comprehensive format - handle gracefully
                        return (
                          <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                  Analysis Result
                                </h4>
                              </div>
                              
                              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  {typeof analysisToShow === 'string' 
                                    ? analysisToShow 
                                    : JSON.stringify(analysisToShow, null, 2)
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                {activeAnalysisTab === "technical_fixes" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Technical Fixes</h3>
                        {technicalAnalyzing && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Sub-tabs for Technical Fixes */}
                    <div className="border-b mb-4">
                      <div className="flex gap-1">
                        {[
                          { id: "tags_analysis", label: "Tags Analysis" },
                          { id: "social_share_preview", label: "Social Share Preview" },
                          { id: "links_analysis", label: "Links Analysis" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTechnicalTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              activeTechnicalTab === tab.id
                                ? "border-primary text-primary bg-primary/10"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Sub-tab Content */}
                    {activeTechnicalTab === "tags_analysis" && (
                      <div>
                        {(() => {
                          // Show loading state when analyzing
                          if (technicalAnalyzing) {
                            return (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                                  <p className="text-sm text-muted-foreground">
                                    Analyzing technical elements...
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Checking tags, social meta, and links
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          
                          const tagsAnalysis = (analysis as any)?.tags_analysis;
                          if (!tagsAnalysis || !tagsAnalysis.detectedTags || Object.keys(tagsAnalysis.detectedTags).length === 0) {
                            return (
                              <div className="text-center py-12">
                                <p className="text-muted-foreground">No tags analysis data present.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {Object.entries(tagsAnalysis.detectedTags).map(([tag, info]: [string, any]) => (
                                <div key={tag} className="rounded-xl shadow-lg border border-primary/20  dark:from-zinc-900 dark:via-blue-950 dark:to-zinc-900 p-6 flex flex-col gap-3 relative hover:scale-[1.02] transition-transform">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="rounded-full bg-primary/10 p-2">
                                      <Shield className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="font-bold text-lg text-primary tracking-wide uppercase">{tag}</span>
                                    {info.message && (
                                      <span className="ml-2 text-xs text-muted-foreground italic" title="{info.message}">
                                        {info.message}
                                      </span>
                                    )}
                                  </div>
                                  {info.ids && info.ids.length > 0 && (
                                    <div className="mb-1">
                                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">IDs:</span>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {info.ids.map((id: string, idx: number) => (
                                          <span key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-mono shadow-sm border border-blue-200 dark:border-blue-800">
                                            {id}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {info.links && info.links.length > 0 && (
                                    <div className="mb-1">
                                      <span className="text-xs font-semibold text-green-700 dark:text-green-300">Links:</span>
                                      <ul className="list-none mt-1 space-y-1">
                                        {info.links.map((link: string, idx: number) => (
                                          <li key={idx}>
                                            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 hover:underline text-xs font-medium">
                                              <ExternalLink className="h-3 w-3 inline" />
                                              {link}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {info.details && info.details.length > 0 && (
                                    <div className="mb-1">
                                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Details:</span>
                                      <ul className="list-disc list-inside text-xs ml-4 mt-1 text-muted-foreground space-y-1">
                                        {info.details.map((detail: string, idx: number) => (
                                          <li key={idx}>{detail}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {typeof info.script === "boolean" && (
                                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${info.script ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'}`}
                                        title="Script tag present">
                                        Script: {info.script ? "Yes" : "No"}
                                      </span>
                                    )}
                                    {typeof info.noscript === "boolean" && (
                                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${info.noscript ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'}`}
                                        title="NoScript tag present">
                                        NoScript: {info.noscript ? "Yes" : "No"}
                                      </span>
                                    )}
                                    {typeof info.found === "boolean" && (
                                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${info.found ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'}`}
                                        title="Tag found">
                                        Found: {info.found ? "Yes" : "No"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {activeTechnicalTab === "social_share_preview" && (
                      <div>
                        {(() => {
                          // Show loading state when analyzing
                          if (technicalAnalyzing) {
                            return (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                                  <p className="text-sm text-muted-foreground">
                                    Analyzing social meta tags...
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Checking Open Graph and Twitter cards
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          
                          const socialMeta = (analysis as any)?.social_meta_analysis;
                          if (!socialMeta) {
                            return (
                              <div className="text-center py-12">
                                <p className="text-muted-foreground">No social share preview data present.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-6">
                              {/* Main Preview */}
                              {socialMeta.main && (
                                <div className="flex flex-col md:flex-row gap-6 items-start border rounded-lg p-4 bg-muted/10">
                                  {socialMeta.main.image && (
                                    <img
                                      src={socialMeta.main.image}
                                      alt="Social Preview"
                                      className="w-40 h-40 object-cover rounded border"
                                    />
                                  )}
                                  <div className="flex-1 space-y-2">
                                    <div className="font-bold text-lg">{socialMeta.main.title}</div>
                                    <div className="text-muted-foreground text-sm">{socialMeta.main.description}</div>
                                    <div className="text-xs text-blue-700 dark:text-blue-300 break-all">{socialMeta.main.url}</div>
                                  </div>
                                </div>
                              )}
                              {/* Summary */}
                              {Array.isArray(socialMeta.summary) && socialMeta.summary.length > 0 && (
                                <div className="space-y-1">
                                  <div className="font-medium mb-1">Summary</div>
                                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                                    {socialMeta.summary.map((item: string, idx: number) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {/* Platforms */}
                              {socialMeta.platforms && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {Object.entries(socialMeta.platforms).map(([platform, info]: [string, any]) => (
                                    <div key={platform} className="border rounded-lg p-4 bg-muted/5">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-primary">{platform}</span>
                                        {info.present ? (
                                          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800">Present</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800">Missing</Badge>
                                        )}
                                      </div>
                                      {/* Tags */}
                                      {info.tags && Object.keys(info.tags).length > 0 && (
                                        <div className="mb-2">
                                          <div className="font-medium text-xs mb-1">Tags</div>
                                          <ul className="list-disc list-inside text-xs ml-4 text-muted-foreground">
                                            {Object.entries(info.tags).map(([tag, value]: [string, any]) => (
                                              <li key={tag}><span className="font-semibold">{tag}:</span> {value}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {/* Missing Tags */}
                                      {Array.isArray(info.missing) && info.missing.length > 0 && (
                                        <div className="mb-2">
                                          <div className="font-medium text-xs mb-1 text-destructive">Missing Tags</div>
                                          <ul className="list-disc list-inside text-xs ml-4 text-destructive">
                                            {info.missing.map((tag: string, idx: number) => (
                                              <li key={idx}>{tag}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {activeTechnicalTab === "links_analysis" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">Links Analysis</h3>
                          </div>
                        </div>

                        {(() => {
                          // Show loading state when analyzing
                          if (technicalAnalyzing) {
                            return (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                                  <p className="text-sm text-muted-foreground">
                                    Analyzing links...
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Extracting and categorizing page links
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          // Handle the detailed link analysis data structure
                          let linkAnalysis: any = analysis.link_analysis;
                          
                          // Debug log removed to prevent continuous logging
                          
                          // If it's a string, try to parse it
                          if (typeof linkAnalysis === 'string') {
                            try {
                              linkAnalysis = JSON.parse(linkAnalysis);
                            } catch {
                              linkAnalysis = undefined;
                            }
                          }
                          
                          // If no detailed analysis, try to create from basic link data
                          if (!linkAnalysis && analysis.linksCheck) {
                            linkAnalysis = {
                              totalLinks: analysis.linksCheck.totalLinks,
                              internalLinks: analysis.linksCheck.internalLinks,
                              externalLinks: analysis.linksCheck.externalLinks,
                              linksWithText: 0,
                              linksWithoutText: 0,
                              links: [],
                              issues: [],
                              recommendations: []
                            };
                            
                            // Generate basic issues and recommendations
                            if (analysis.linksCheck.totalLinks === 0) {
                              linkAnalysis.issues.push('No links found on the page');
                              linkAnalysis.recommendations.push('Add relevant internal and external links to improve navigation and SEO');
                            }
                            
                            if (analysis.linksCheck.internalLinks === 0 && analysis.linksCheck.externalLinks > 0) {
                              linkAnalysis.issues.push('No internal links found - only external links present');
                              linkAnalysis.recommendations.push('Add internal links to improve site navigation and SEO');
                            }
                            
                            if (analysis.linksCheck.externalLinks === 0 && analysis.linksCheck.internalLinks > 0) {
                              linkAnalysis.issues.push('No external links found');
                              linkAnalysis.recommendations.push('Consider adding relevant external links for credibility and user value');
                            }
                          }
                          
                          
                          if (!linkAnalysis) {
                            return (
                              <div className="text-center py-12">
                                <div className="max-w-md mx-auto">
                                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold mb-2">No Link Analysis Data</h3>
                                  <p className="text-muted-foreground mb-4">
                                    No link analysis data is available for this page. Run a full analysis to get detailed link insights.
                                  </p>
                                                                      <Button onClick={() => startFullAnalysis()}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Run Full Analysis
                                    </Button>
                                </div>
                              </div>
                            );
                          }
                          
                          // Handle the detailed analysis structure
                          if (linkAnalysis.links && Array.isArray(linkAnalysis.links)) {
                            // Transform links to match LinksAnalysisTable interface
                            const transformedLinks = linkAnalysis.links.map((link: any) => ({
                              href: link.href || '',
                              type: link.type || 'unknown',
                              text: link.text || '',
                              page_url: link.page_url || page?.url || ''
                            }));
                            
                            return (
                              <div className="space-y-6">
                                {/* Link Statistics Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold text-primary">{linkAnalysis.totalLinks}</div>
                                      <div className="text-sm text-muted-foreground">Total Links</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold text-green-600">{linkAnalysis.internalLinks}</div>
                                      <div className="text-sm text-muted-foreground">Internal Links</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold text-blue-600">{linkAnalysis.externalLinks}</div>
                                      <div className="text-sm text-muted-foreground">External Links</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold text-orange-600">{linkAnalysis.linksWithText}</div>
                                      <div className="text-sm text-muted-foreground">Links with Text</div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Additional Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Link Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Internal Links</span>
                                          <span className="font-medium">{linkAnalysis.internalLinks}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>External Links</span>
                                          <span className="font-medium">{linkAnalysis.externalLinks}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>With Text</span>
                                          <span className="font-medium">{linkAnalysis.linksWithText}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>Without Text</span>
                                          <span className="font-medium">{linkAnalysis.linksWithoutText || 0}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Link Quality</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Internal Ratio</span>
                                          <span className="font-medium">
                                            {linkAnalysis.totalLinks > 0 
                                              ? `${((linkAnalysis.internalLinks / linkAnalysis.totalLinks) * 100).toFixed(1)}%`
                                              : '0%'
                                            }
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>External Ratio</span>
                                          <span className="font-medium">
                                            {linkAnalysis.totalLinks > 0 
                                              ? `${((linkAnalysis.externalLinks / linkAnalysis.totalLinks) * 100).toFixed(1)}%`
                                              : '0%'
                                            }
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>Text Coverage</span>
                                          <span className="font-medium">
                                            {linkAnalysis.totalLinks > 0 
                                              ? `${((linkAnalysis.linksWithText / linkAnalysis.totalLinks) * 100).toFixed(1)}%`
                                              : '0%'
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">SEO Impact</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          {linkAnalysis.internalLinks > 0 ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                          <span>Internal Links</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          {linkAnalysis.externalLinks > 0 ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                          <span>External Links</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          {linkAnalysis.linksWithText > 0 ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                          <span>Descriptive Text</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Issues and Recommendations */}
                                {(linkAnalysis.issues?.length > 0 || linkAnalysis.recommendations?.length > 0) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {linkAnalysis.issues?.length > 0 && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-destructive flex items-center gap-2">
                                            <XCircle className="h-5 w-5" />
                                            Issues Found ({linkAnalysis.issues.length})
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <ul className="space-y-3">
                                            {linkAnalysis.issues.map((issue: string, idx: number) => (
                                              <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                                <span className="text-sm">{issue}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </CardContent>
                                      </Card>
                                    )}
                                    {linkAnalysis.recommendations?.length > 0 && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-green-600 flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Recommendations ({linkAnalysis.recommendations.length})
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <ul className="space-y-3">
                                            {linkAnalysis.recommendations.map((rec: string, idx: number) => (
                                              <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm">{rec}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </div>
                                )}

                                {/* Links Table */}
                                {transformedLinks.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-lg font-semibold">Detailed Link Analysis</h3>
                                      <Badge variant="outline">
                                        {transformedLinks.length} links found
                                      </Badge>
                                    </div>
                                    <div className="mb-4 p-4 bg-muted/10 rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Debug Info:</strong> Found {transformedLinks.length} links in analysis data
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Sample: {transformedLinks.slice(0, 2).map((link: any) => `${link.href} (${link.type})`).join(', ')}
                                      </p>
                                    </div>
                                    <LinksAnalysisTable links={transformedLinks} />
                                  </div>
                                )}

                                {/* No Links Found */}
                                {transformedLinks.length === 0 && (
                                  <Card>
                                    <CardContent className="text-center py-8">
                                      <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-muted-foreground">No links found in the detailed analysis.</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        This could mean the page has no links or the analysis didn't capture them properly.
                                      </p>
                                      <div className="mt-4 p-3 bg-muted/10 rounded text-xs">
                                        <p><strong>Debug:</strong> linkAnalysis.links = {JSON.stringify(linkAnalysis.links?.slice(0, 2))}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            );
                          }
                          
                          // Fallback to basic link statistics
                          return (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-primary">{linkAnalysis.totalLinks || 0}</div>
                                    <div className="text-sm text-muted-foreground">Total Links</div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">{linkAnalysis.internalLinks || 0}</div>
                                    <div className="text-sm text-muted-foreground">Internal Links</div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">{linkAnalysis.externalLinks || 0}</div>
                                    <div className="text-sm text-muted-foreground">External Links</div>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <Card>
                                <CardContent className="text-center py-8">
                                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground">Basic link statistics available</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Run a full analysis to get detailed link insights and recommendations.
                                  </p>
                                                                      <Button className="mt-4" onClick={() => startFullAnalysis()}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Run Full Analysis
                                    </Button>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                {/* *********************************************************************************** */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

