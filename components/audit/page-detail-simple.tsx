'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditSession, ScrapedPage } from '@/lib/types/database';
import { 
  Loader2, 
  ArrowLeft, 
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
  Link2,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  } | null;
  seoAnalysis: {
    overallScore: number;
    issues: string[];
    recommendations: string[];
  } | null;
}

interface PageDetailSimpleProps {
  pageId: string;
}

export function PageDetailSimple({ pageId }: PageDetailSimpleProps) {
  const [session, setSession] = useState<AuditSession | null>(null);
  const [page, setPage] = useState<ScrapedPage | null>(null);
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('grammar');
  const [activeGrammarTab, setActiveGrammarTab] = useState('grammar');
  const [grammarAnalyzing, setGrammarAnalyzing] = useState(false);
  const [seoAnalyzing, setSeoAnalyzing] = useState(false);
  const [grammarCached, setGrammarCached] = useState(false);
  const [seoCached, setSeoCached] = useState(false);
  const [grammarCachedAt, setGrammarCachedAt] = useState<string | null>(null);
  const [seoCachedAt, setSeoCachedAt] = useState<string | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  // Fetch results from audit_results table
  const fetchAnalysisResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      const data = await response.json();
      
      if (response.ok && data.results) {
        console.log('📊 Fetched analysis results:', data.results);
        
        // Update analysis state with fresh results
        setAnalysis(prev => {
          const newAnalysis = prev || analyzePage(data.page);
          
          if (data.results.grammar_analysis) {
            newAnalysis.grammarCheck = data.results.grammar_analysis;
            setGrammarCached(true);
            setGrammarCachedAt(data.results.created_at || data.results.updated_at);
            setGrammarAnalyzing(false);
          }
          
          if (data.results.seo_analysis) {
            newAnalysis.seoAnalysis = data.results.seo_analysis;
            setSeoCached(true);
            setSeoCachedAt(data.results.created_at || data.results.updated_at);
            setSeoAnalyzing(false);
          }
          
          return newAnalysis;
        });
        
        // Clear analyzing states
        setIsAnalysisRunning(false);
      }
    } catch (error) {
      console.error('Error fetching analysis results:', error);
    }
  }, [pageId]);

  const fetchPageData = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('🔍 Page data received:', {
          pageId: data.page?.id,
          analysis_status: data.page?.analysis_status,
          has_results: !!data.results,
          grammar_result: !!data.results?.grammar_analysis,
          seo_result: !!data.results?.seo_analysis
        });
        
        setSession(data.session);
        setPage(data.page);
        
        // Check if this specific page is currently being analyzed
        const isPageAnalyzing = data.page?.analysis_status === 'analyzing';
        setIsAnalysisRunning(isPageAnalyzing);
        
        // Analyze the page data
        if (data.page) {
          const basicAnalysis = analyzePage(data.page);
          let hasGrammarCache = false;
          let hasSeoCache = false;
          
          // Check for cached results and merge them
          if (data.results) {
            if (data.results.grammar_analysis) {
              basicAnalysis.grammarCheck = data.results.grammar_analysis;
              setGrammarCached(true);
              setGrammarCachedAt(data.results.created_at || data.results.updated_at);
              hasGrammarCache = true;
            }
            
            if (data.results.seo_analysis) {
              basicAnalysis.seoAnalysis = data.results.seo_analysis;
              setSeoCached(true);
              setSeoCachedAt(data.results.created_at || data.results.updated_at);
              hasSeoCache = true;
            }
          }
          
          setAnalysis(basicAnalysis);
          
          // Determine if we need to start analysis or show analyzing state
          if (isPageAnalyzing) {
            console.log('🔥 Page is analyzing - showing analyzing states');
            // Page is being analyzed - show analyzing state for missing analyses
            if (!hasGrammarCache) {
              setGrammarAnalyzing(true);
            }
            if (!hasSeoCache) {
              setSeoAnalyzing(true);
            }
          } else if (data.page.analysis_status === 'pending' || !data.page.analysis_status) {
            console.log('📝 Page needs analysis - starting fresh');
            // Page hasn't been analyzed yet - start fresh analysis for missing cached data
            if (!hasGrammarCache) {
              analyzeContentWithGemini();
            }
            if (!hasSeoCache) {
              analyzeSeoWithAPI();
            }
          }
        }
      } else {
        setError(data.error || 'Failed to fetch page data');
      }
    } catch (error) {
      setError('Failed to fetch page data');
    } finally {
      setLoading(false);
    }
  }, [pageId, grammarCached, seoCached]);

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
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scraped_pages',
            filter: `id=eq.${pageId}`
          },
          async (payload) => {
            console.log('🔄 Page status updated:', payload.new);
            const updatedPage = payload.new as any;
            
            // Update page state
            setPage(prev => ({ ...prev, ...updatedPage } as ScrapedPage));
            
            // Handle status changes
            if (updatedPage.analysis_status === 'analyzing') {
              console.log('▶️ Analysis started');
              setIsAnalysisRunning(true);
              if (!grammarCached) setGrammarAnalyzing(true);
              if (!seoCached) setSeoAnalyzing(true);
            } else if (updatedPage.analysis_status === 'completed') {
              console.log('✅ Analysis completed - fetching results');
              // Fetch the completed results
              await fetchAnalysisResults();
            } else if (updatedPage.analysis_status === 'failed') {
              console.log('❌ Analysis failed');
              setIsAnalysisRunning(false);
              setGrammarAnalyzing(false);
              setSeoAnalyzing(false);
            }
          }
        )
        .subscribe();

      channels.push(pageChannel);

      // Subscribe to analysis results updates
      const resultsChannel = supabase
        .channel(`results-update-${pageId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'audit_results',
            filter: `scraped_page_id=eq.${pageId}`
          },
          async (payload) => {
            console.log('📊 Results updated:', payload.eventType, payload.new);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // Fetch the latest results
              await fetchAnalysisResults();
            }
          }
        )
        .subscribe();

      channels.push(resultsChannel);

      console.log('🔌 Realtime subscriptions set up for page:', pageId);
    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [pageId, fetchAnalysisResults]);

  // Add polling fallback when analysis is running
  useEffect(() => {
    if (isAnalysisRunning) {
      console.log('🔄 Starting fallback polling for analysis status');
      
      const pollInterval = setInterval(async () => {
        console.log('⏰ Polling for updates...');
        await fetchPageData();
      }, 5000); // Poll every 5 seconds
      
      return () => {
        console.log('🛑 Stopping fallback polling');
        clearInterval(pollInterval);
      };
    }
  }, [isAnalysisRunning, fetchPageData]);

  // Manual analysis trigger for both
  const startFullAnalysis = async () => {
    if (!session?.id) return;
    
    setIsAnalysisRunning(true);
    setGrammarAnalyzing(true);
    setSeoAnalyzing(true);
    
    try {
      const response = await fetch(`/api/audit-sessions/${session.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_ids: [pageId],
          analysis_types: ['grammar', 'seo'],
          use_cache: false,
          background: false,
          force_refresh: true
        }),
      });
      
      if (response.ok) {
        console.log('✅ Full analysis started');
        // Results will come via realtime or polling
      }
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setIsAnalysisRunning(false);
      setGrammarAnalyzing(false);
      setSeoAnalyzing(false);
    }
  };

  const analyzeContentWithGemini = async (forceRefresh = false) => {
    setGrammarAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!session?.id) {
        console.error('No session ID available for analysis');
        return;
      }

      console.log('🚀 Starting grammar analysis...');
      const response = await fetch(`/api/audit-sessions/${session.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_ids: [pageId],
          analysis_types: ['grammar'],
          use_cache: !forceRefresh,
          background: false,
          force_refresh: forceRefresh
        }),
      });

      if (response.ok) {
        const grammarData = await response.json();
        console.log('✅ Grammar analysis response:', grammarData);
        
        // Check if this is cached data
        setGrammarCached(grammarData.cached || false);
        setGrammarCachedAt(grammarData.cached_at || null);
        
        // Remove caching metadata before setting analysis
        const { cached, cached_at, background, ...analysisData } = grammarData;
        
        if (analysisData.wordCount !== undefined) {
          // We got the results immediately
          setAnalysis(prev => prev ? {
            ...prev,
            grammarCheck: analysisData
          } : null);
          setGrammarAnalyzing(false);
          setIsAnalysisRunning(false);
        }
        // Otherwise, results will come via realtime subscription
      }
    } catch (error) {
      console.error('Grammar analysis error:', error);
      setGrammarAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  const refreshGrammarAnalysis = () => {
    analyzeContentWithGemini(true);
  };

  const analyzeSeoWithAPI = async (forceRefresh = false) => {
    setSeoAnalyzing(true);
    setIsAnalysisRunning(true);
    try {
      if (!session?.id) {
        console.error('No session ID available for analysis');
        return;
      }

      console.log('🚀 Starting SEO analysis...');
      const response = await fetch(`/api/audit-sessions/${session.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_ids: [pageId],
          analysis_types: ['seo'],
          use_cache: !forceRefresh,
          background: false,
          force_refresh: forceRefresh
        }),
      });

      if (response.ok) {
        const seoData = await response.json();
        console.log('✅ SEO analysis response:', seoData);
        
        // Check if this is cached data
        setSeoCached(seoData.cached || false);
        setSeoCachedAt(seoData.cached_at || null);
        
        // Remove caching metadata before setting analysis
        const { cached, cached_at, background, ...analysisData } = seoData;
        
        if (analysisData.overallScore !== undefined) {
          // We got the results immediately
          setAnalysis(prev => prev ? {
            ...prev,
            seoAnalysis: analysisData
          } : null);
          setSeoAnalyzing(false);
          setIsAnalysisRunning(false);
        }
        // Otherwise, results will come via realtime subscription
      }
    } catch (error) {
      console.error('SEO analysis error:', error);
      setSeoAnalyzing(false);
      setIsAnalysisRunning(false);
    }
  };

  const refreshSeoAnalysis = () => {
    analyzeSeoWithAPI(true);
  };

  const analyzePage = (pageData: ScrapedPage): PageAnalysis => {
    const html = pageData.html || '';
    const url = pageData.url;

    // Meta tags analysis
    const metaTags = {
      title: extractTitle(html) || pageData.title,
      description: extractMetaContent(html, 'description'),
      keywords: extractMetaContent(html, 'keywords'),
      robots: extractMetaContent(html, 'robots'),
      canonical: extractLinkHref(html, 'canonical'),
      ogTitle: extractMetaProperty(html, 'og:title'),
      ogDescription: extractMetaProperty(html, 'og:description'),
      viewport: extractMetaContent(html, 'viewport'),
    };

    // Heading structure analysis
    const headingStructure = analyzeHeadings(html);

    // Robots check
    const robotsCheck = {
      robotsTxt: false, // Would need separate request
      robotsMeta: metaTags.robots,
      indexable: !metaTags.robots?.includes('noindex'),
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
      isHttps: url.startsWith('https://'),
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
    const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`, 'i');
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
        .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu-related suffixes
        .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, '') // Remove toggle-related suffixes
        .replace(/\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i, '') // Remove social media suffixes
        .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu with dash separator
        .replace(/ExpandToggle.*$/i, '') // Remove specific "ExpandToggle" text
        .replace(/MenuExpand.*$/i, '') // Remove specific "MenuExpand" text
        .replace(/Facebook$/i, '') // Remove trailing "Facebook"
        .trim();
      
      return title || null;
    }
    return null;
  };

  const extractMetaProperty = (html: string, property: string): string | null => {
    const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  const extractLinkHref = (html: string, rel: string): string | null => {
    const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*?)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  const analyzeHeadings = (html: string) => {
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const allHeadingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
    
    const h1Text = h1Matches.map(match => match.replace(/<[^>]*>/g, '').trim());
    
    const allHeadings = allHeadingMatches.map(match => {
      const level = parseInt(match.match(/<h(\d)/)?.[1] || '1');
      const text = match.replace(/<[^>]*>/g, '').trim();
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
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
    const links = linkMatches.map(match => {
      const href = match.match(/href=["']([^"']*?)["']/)?.[1] || '';
      return href;
    }).filter(href => href && !href.startsWith('#'));

    const totalLinks = links.length;
    const externalLinks = links.filter(link => 
      link.startsWith('http') && !link.includes(new URL(baseUrl).hostname)
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
    return isGood ? 
      <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> : 
      <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
  };

  if (loading) {
        return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
              </div>
    );
  }

  if (!session || !page || !analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Page not found</p>
        <Link href={session ? `/audit?session=${session.id}` : "/audit"}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit
          </Button>
        </Link>
              </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button and refresh */}
      <div className="flex items-center justify-between">
        <Link href={session ? `/audit?session=${session.id}` : "/audit"}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
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
            <RefreshCw className={`h-4 w-4 mr-2 ${(grammarAnalyzing || seoAnalyzing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Start Analysis Button - show when no analysis is running and no results */}
          {!isAnalysisRunning && (!grammarCached || !seoCached) && (
            <Button
              onClick={startFullAnalysis}
              variant="default"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          )}
              </div>
              </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          {error}
            </div>
      )}

      {/* Page Title and URL */}
      {page && (
                <div className="space-y-2">
          <h1 className="text-3xl font-bold">{page.title || 'Untitled Page'}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
              {page.url}
              <ExternalLink className="h-3 w-3" />
            </a>
                  </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {page.analysis_status && (
              <Badge variant={
                page.analysis_status === 'completed' ? 'default' :
                page.analysis_status === 'analyzing' ? 'secondary' :
                page.analysis_status === 'failed' ? 'destructive' : 'outline'
              }>
                Page Status: {page.analysis_status}
              </Badge>
            )}
            
            {/* Content freshness indicator */}
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Content: {new Date(page.scraped_at).toLocaleDateString()} at {new Date(page.scraped_at).toLocaleTimeString()}
            </Badge>
            
            {/* Real-time analysis status */}
            {isAnalysisRunning && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Re-scraping & Analyzing...
              </Badge>
            )}
                  </div>
                  </div>
            )}

     

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Info - 1/4 width on large screens */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="text-lg">{page.title || 'Untitled'}</CardTitle>
                  <CardDescription className="break-all">{page.url}</CardDescription>
                  </div>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={page.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
              <div>
                  <p className="text-sm text-muted-foreground">Status Code</p>
                  <p className="font-medium">{page.status_code || 'Unknown'}</p>
              </div>
              <div>
                  <p className="text-sm text-muted-foreground">Protocol</p>
                  <p className="font-medium">{analysis.httpsCheck.isHttps ? 'HTTPS' : 'HTTP'}</p>
              </div>
              <div>
                  <p className="text-sm text-muted-foreground">Indexable</p>
                  <p className="font-medium">{analysis.robotsCheck.indexable ? 'Yes' : 'No'}</p>
              </div>
              <div>
                  <p className="text-sm text-muted-foreground">Has Redirects</p>
                  <p className="font-medium">{analysis.redirectCheck.hasRedirect ? 'Yes' : 'No'}</p>
          </div>
                <div>
                  <p className="text-sm text-muted-foreground">Content Date</p>
                  <p className="font-medium">{new Date(page.scraped_at).toLocaleDateString()} {new Date(page.scraped_at).toLocaleTimeString()}</p>
              </div>
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Links</span>
                    <span className="text-sm font-medium">{analysis.linksCheck.totalLinks}</span>
              </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Headings</span>
                    <span className="text-sm font-medium">{(analysis.headingStructure.allHeadings || []).length}</span>
              </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">H1 Tags</span>
                    <span className="text-sm font-medium">{analysis.headingStructure.h1Count}</span>
            </div>
                  {analysis.grammarCheck && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Word Count</span>
                        <span className="text-sm font-medium">{analysis.grammarCheck.wordCount}</span>
              </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Reading Time</span>
                        <span className="text-sm font-medium">{analysis.grammarCheck.estimatedReadingTime}m</span>
              </div>
                    </>
                  )}
              </div>
            </div>

              {/* Overall Scores */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Overall Scores</h4>
                <div className="space-y-2">
                  {analysis.grammarCheck && (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">Content Quality</span>
                      <span className="text-lg font-bold text-primary">{analysis.grammarCheck.overallScore}</span>
              </div>
            )}
                  {analysis.seoAnalysis && (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">SEO Score</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{analysis.seoAnalysis.overallScore}</span>
              </div>
            )}
                  {(!analysis.grammarCheck || !analysis.seoAnalysis) && (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">Scores will appear as analysis completes</p>
          </div>
                  )}
              </div>
              </div>
            </CardContent>
          </Card>
              </div>

        {/* Analysis Tabs - 3/4 width on large screens */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Detailed analysis across different aspects of your page</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Main Tab Navigation */}
              <div className="border-b mb-6">
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'grammar', label: 'Grammar & Content', icon: FileText, analyzing: grammarAnalyzing, cached: grammarCached },
                    { id: 'seo', label: 'SEO & Structure', icon: Tag, analyzing: seoAnalyzing, cached: seoCached },
                    { id: 'performance', label: 'Performance', icon: BarChart3, analyzing: false, cached: false },
                    { id: 'accessibility', label: 'Accessibility', icon: Shield, analyzing: false, cached: false },
                    { id: 'ui_quality', label: 'UI Quality', icon: Eye, analyzing: false, cached: false },
                    { id: 'images', label: 'Images', icon: Image, analyzing: false, cached: false },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAnalysisTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                          activeAnalysisTab === tab.id
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {tab.label}
                        {tab.analyzing && <Loader2 className="h-3 w-3 animate-spin" />}
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
                {activeAnalysisTab === 'grammar' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Grammar & Content Quality</h3>
                        {grammarAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {grammarCached && !grammarAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                </Badge>
                        )}
              </div>
                      {analysis.grammarCheck && !grammarAnalyzing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={refreshGrammarAnalysis}
                          disabled={grammarAnalyzing}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh Analysis
                        </Button>
              )}
            </div>

                    <p className="text-sm text-muted-foreground">
                      {grammarAnalyzing ? 'Re-scraping page and analyzing with AI...' : 
                       grammarCached && grammarCachedAt ? 
                         `Content analysis (from ${new Date(grammarCachedAt).toLocaleDateString()})` : 
                         'Content readability and writing quality analysis'}
                    </p>

                    {!analysis.grammarCheck || grammarAnalyzing ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-muted-foreground">
                            {grammarAnalyzing ? 'Analyzing Fresh Content with AI...' : 'Loading...'}
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
                          const allGrammarErrors = grammarCheck.grammarErrors || [];
                          const grammarErrors = allGrammarErrors.filter(e => e.type === 'grammar');
                          const punctuationErrors = allGrammarErrors.filter(e => e.type === 'punctuation');
                          const structureErrors = allGrammarErrors.filter(e => e.type === 'structure');
                          const ukEnglishErrors = allGrammarErrors.filter(e => e.type === 'US English');
                          const spellingErrors = grammarCheck.spellingErrors || [];
                          const issues = grammarCheck.issues || [];

                          const tabs = [
                            { id: 'grammar', label: 'Grammar', count: grammarErrors.length, errors: grammarErrors, type: 'error' },
                            { id: 'punctuation', label: 'Punctuation', count: punctuationErrors.length, errors: punctuationErrors, type: 'error' },
                            { id: 'structure', label: 'Structure', count: structureErrors.length, errors: structureErrors, type: 'error' },
                            { id: 'ukEnglish', label: 'UK English', count: ukEnglishErrors.length, errors: ukEnglishErrors, type: 'error' },
                            { id: 'spelling', label: 'Spelling', count: spellingErrors.length, errors: spellingErrors, type: 'error' },
                            { id: 'issues', label: 'Content Issues', count: issues.length, errors: issues, type: 'issue' }
                          ].filter(tab => tab.count > 0);

                          if (tabs.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                <p className="text-xl font-medium">Perfect Content!</p>
                                <p className="text-sm text-muted-foreground">No grammar, spelling, or content issues found.</p>
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
                                      onClick={() => setActiveGrammarTab(tab.id)}
                                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeGrammarTab === tab.id
                                          ? 'border-primary text-primary bg-primary/10'
                                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
                                    className={activeGrammarTab === tab.id ? 'block' : 'hidden'}
                                  >
                                    <div className="space-y-3">
                                      {tab.type === 'issue' ? (
                                        // Content Issues (strings)
                                        (tab.errors as string[]).map((issue, i) => (
                                          <div key={i} className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                                            <div className="flex items-start gap-3">
                                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                              <div>
                                                <h5 className="font-medium text-amber-800 dark:text-amber-200">Content Issue</h5>
                                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{issue}</p>
              </div>
              </div>
              </div>
                                        ))
                                      ) : (
                                        // Grammar, Spelling, etc. errors (objects)
                                        (tab.errors as Array<{text: string; suggestion: string; type?: string; explanation?: string; position?: string}>).map((error, i) => (
                                          <div key={i} className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                                            <div className="flex items-start gap-3">
                                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <h5 className="font-medium text-red-800 dark:text-red-200">
                                                    {tab.label} Error
                                                  </h5>
                                                  <Badge variant="outline" className="text-xs">
                                                    {error.type || 'error'}
                </Badge>
              </div>
                                                <div className="space-y-2">
                                                  <div>
                                                    <span className="text-sm text-red-700 dark:text-red-300">
                                                      <strong>Found:</strong> "{error.text}"
                                                    </span>
            </div>
              <div>
                                                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                                      <strong>Should be:</strong> "{error.suggestion}"
                                                    </span>
                                                  </div>
                                                  {error.explanation && (
                                                    <div>
                                                      <span className="text-sm text-muted-foreground">
                                                        <strong>Why:</strong> {error.explanation}
                                                      </span>
              </div>
            )}
                                                  {tab.id === 'spelling' && error.position && (
              <div>
                                                      <span className="text-xs text-muted-foreground">
                                                        <strong>Location:</strong> {error.position}
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
                          <h4 className="font-medium mb-4">Content Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">{analysis.grammarCheck.wordCount || 0}</p>
                              <p className="text-xs text-muted-foreground">Words</p>
              </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">{analysis.grammarCheck.estimatedReadingTime || 0}m</p>
                              <p className="text-xs text-muted-foreground">Reading Time</p>
              </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold capitalize">{analysis.grammarCheck.tone || 'neutral'}</p>
                              <p className="text-xs text-muted-foreground">Tone</p>
            </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-2xl font-semibold">{analysis.grammarCheck.readabilityScore || 0}</p>
                              <p className="text-xs text-muted-foreground">Readability</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
              </div>
            )}

                {/* SEO & Structure Tab */}
                {activeAnalysisTab === 'seo' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">SEO & Structure</h3>
                        {seoAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {seoCached && !seoAnalyzing && (
                          <Badge variant="outline" className="text-xs">
                            Cached
                          </Badge>
                        )}
              </div>
                      {analysis.seoAnalysis && !seoAnalyzing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={refreshSeoAnalysis}
                          disabled={seoAnalyzing}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh Analysis
                        </Button>
            )}
          </div>

                    <p className="text-sm text-muted-foreground">
                      {seoAnalyzing ? 'Re-scraping page and analyzing SEO...' : 
                       seoCached && seoCachedAt ? 
                         `SEO analysis (from ${new Date(seoCachedAt).toLocaleDateString()})` : 
                         'Technical SEO and structure analysis'}
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
                              <CardTitle className="text-base">Meta Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Title Tag</span>
                                  {getStatusIcon(!!analysis.metaTags.title)}
      </div>
                                  <p className="text-sm text-muted-foreground">
                                    {analysis.metaTags.title ? 
                                      `"${analysis.metaTags.title}" (${(analysis.metaTags.title || '').length} chars)` : 
                                      'Missing'
                                    }
                                  </p>
                                </div>

                                <div className="p-3 border rounded">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Meta Description</span>
                                    {getStatusIcon(!!analysis.metaTags.description)}
      </div>
                                  <p className="text-sm text-muted-foreground">
                                    {analysis.metaTags.description ? 
                                      `"${analysis.metaTags.description}" (${(analysis.metaTags.description || '').length} chars)` : 
                                      'Missing'
                                    }
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 border rounded text-center">
                                    <div className="font-medium mb-1">Viewport</div>
                                    <div className="text-2xl">{analysis.metaTags.viewport ? '✓' : '✗'}</div>
          </div>
                                  <div className="p-3 border rounded text-center">
                                    <div className="font-medium mb-1">Canonical</div>
                                    <div className="text-2xl">{analysis.metaTags.canonical ? '✓' : '✗'}</div>
        </div>
        </div>
                            </CardContent>
                          </Card>

                          {/* Heading Structure */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Heading Structure</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-3 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">H1 Tags</span>
                                  {getStatusIcon(analysis.headingStructure.h1Count === 1)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {analysis.headingStructure.h1Count} found
                                </p>
                                {(analysis.headingStructure.h1Text || []).length > 0 && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    "{analysis.headingStructure.h1Text[0]}"
                                  </p>
                                )}
      </div>

                                <div className="p-3 border rounded">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Heading Hierarchy</span>
                                    {getStatusIcon((analysis.headingStructure.allHeadings || []).length > 0)}
          </div>
                                    <p className="text-sm text-muted-foreground">
                                      {(analysis.headingStructure.allHeadings || []).length} total headings
                                    </p>
                                    {(analysis.headingStructure.allHeadings || []).length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {(analysis.headingStructure.allHeadings || []).slice(0, 8).map((h, i) => (
                                          <span key={i} className="px-2 py-1 bg-muted rounded text-xs">
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
                              <CardTitle className="text-base">Technical</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">HTTPS</span>
                                <span className={`text-2xl ${analysis.httpsCheck.isHttps ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {analysis.httpsCheck.isHttps ? '✓' : '✗'}
                                </span>
            </div>
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">Indexable</span>
                                <span className={`text-2xl ${analysis.robotsCheck.indexable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {analysis.robotsCheck.indexable ? '✓' : '✗'}
                                </span>
              </div>
                              <div className="flex items-center justify-between p-3 border rounded">
                                <span className="font-medium">Direct Access</span>
                                <span className={`text-2xl ${!analysis.redirectCheck.hasRedirect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {!analysis.redirectCheck.hasRedirect ? '✓' : '✗'}
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
                                  <div className="text-2xl font-bold">{analysis.linksCheck.totalLinks}</div>
                                  <div className="text-xs text-muted-foreground">Total</div>
            </div>
                                <div className="p-3 border rounded">
                                  <div className="text-2xl font-bold">{analysis.linksCheck.internalLinks}</div>
                                  <div className="text-xs text-muted-foreground">Internal</div>
            </div>
                                <div className="p-3 border rounded">
                                  <div className="text-2xl font-bold">{analysis.linksCheck.externalLinks}</div>
                                  <div className="text-xs text-muted-foreground">External</div>
            </div>
          </div>
        </CardContent>
      </Card>
                        </div>

                        {/* SEO Issues and Recommendations */}
                        {analysis.seoAnalysis && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {(analysis.seoAnalysis.issues || []).length > 0 && (
        <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-destructive">Issues Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {(analysis.seoAnalysis.issues || []).map((issue, i) => (
                                      <div key={i} className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                                        {issue}
              </div>
                                    ))}
            </div>
          </CardContent>
        </Card>
      )}

                            {(analysis.seoAnalysis.recommendations || []).length > 0 && (
        <Card>
                                <CardHeader>
                                  <CardTitle className="text-base text-primary">Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {(analysis.seoAnalysis.recommendations || []).map((rec, i) => (
                                      <div key={i} className="p-3 bg-primary/10 border border-primary/20 rounded text-primary text-sm">
                                        {rec}
                                      </div>
                                    ))}
            </div>
          </CardContent>
        </Card>
                            )}

                            {(analysis.seoAnalysis.issues || []).length === 0 && (analysis.seoAnalysis.recommendations || []).length === 0 && (
                              <div className="col-span-2 text-center py-8">
                                <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                                                                <p className="text-lg font-medium">Excellent SEO!</p>
                                <p className="text-sm text-muted-foreground">No issues found</p>
                    </div>
                            )}
                  </div>
                        )}
                      </>
                    )}
                    </div>
                )}

                {/* Other tabs - Coming Soon */}
                {['performance', 'accessibility', 'ui_quality', 'images'].includes(activeAnalysisTab) && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground">
                      {activeAnalysisTab.charAt(0).toUpperCase() + activeAnalysisTab.slice(1).replace('_', ' ')} analysis is being developed
                    </p>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
} 