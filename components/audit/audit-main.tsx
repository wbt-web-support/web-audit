'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuditProject, ScrapedPage } from '@/lib/types/database';
import { 
  Loader2, 
  Globe, 
  Search, 
  Settings,
  Eye,
  Play,
  Square,
  BarChart3,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
  CodeSquare
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { RootState } from '@/app/stores/store';
import { AuditMainSkeleton } from '@/components/skeletons';
import { BackButton } from '@/components/ui/back-button';
import {
  initializeSession,
  startCrawling,
  stopCrawling,
  updateLiveCounts,
  updateCrawledPages,
  updateAnalyzedPages,
  toggleImageAnalysis,
  toggleLinksAnalysis,
  completeCrawling,
  setActiveProject,
} from '@/app/stores/auditSlice';

// Import sub-components
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectMetrics } from './components/ProjectMetrics';
import { ProcessStatusCard } from './components';
import { CustomUrlsCard } from './components';
import { PagesTable } from './components/PagesTable';

import { ImageAnalysisTable } from './image-analysis-table';
import { LinksAnalysisTable } from './links-analysis-table';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnalyzedPage {
  page: ScrapedPage & {
    analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed';
  };
  project: {
    id: string;
    base_url: string;
    status: string;
  };
  resultCount: number;
  overallScore: number;
  overallStatus: string;
}

interface PageStatus {
  pageId: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed' | 'timeout' | 'error';
  hasResults: boolean;
  error?: string;
  lastChecked?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the analysis status of a page
 */
const getAnalysisStatus = (page: AnalyzedPage): string => {
  if (page.page.analysis_status === 'analyzing') return 'analyzing';
  return page.resultCount > 0 ? 'analyzed' : 'not-analyzed';
};

/**
 * Check if a page is currently being analyzed
 */
const isPageAnalyzing = (page: AnalyzedPage, analyzingPages: Set<string>): boolean => {
  return analyzingPages.has(page.page.id) || page.page.analysis_status === 'analyzing';
};

/**
 * Get status badge component
 */
const getStatusBadge = (status: string) => {
  const variants = {
    pass: 'bg-emerald-100 text-emerald-700 w-full text-center justify-center',
    warning: 'bg-amber-100 text-amber-700 w-full text-center justify-center',
    fail: 'bg-red-100 text-red-700 w-full text-center justify-center',
    pending: 'bg-slate-100 text-slate-600 w-full text-center justify-center'
  };

  const statusLabels = {
    pass: 'GOOD',
    warning: 'MODERATE',
    fail: 'POOR',
    pending: 'PENDING'
  };

  return (
    <Badge className={variants[status as keyof typeof variants] || 'bg-slate-100 text-slate-600'}>
      {statusLabels[status as keyof typeof statusLabels] || status.toUpperCase()}
    </Badge>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuditMain() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  
  // Redux state
  const auditState = useSelector((state: RootState) => state.audit);
  const currentSession = selectedProjectId ? auditState.sessions[selectedProjectId] : null;
  
  // Local state
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [analyzingPages, setAnalyzingPages] = useState<Set<string>>(new Set());
  const [deletingPages, setDeletingPages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [analysisFilter, setAnalysisFilter] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 100 });
  const [sortField, setSortField] = useState<'title' | 'status' | 'score'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Refs
  const crawlingStartedRef = useRef(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize component and fetch data
  useEffect(() => {
    fetchData();
    
    if (selectedProjectId) {
      dispatch(initializeSession({ projectId: selectedProjectId }));
      dispatch(setActiveProject({ projectId: selectedProjectId }));
    }
    
    // Check for any background crawling processes that need to be resumed
    checkAndResumeBackgroundProcesses();
    
    return () => {
      crawlingStartedRef.current = false;
    };
  }, [selectedProjectId, dispatch]);

  // Function to check and resume background processes
  const checkAndResumeBackgroundProcesses = async () => {
    try {
      const response = await fetch('/api/audit-projects/background-status');
      if (response.ok) {
        const data = await response.json();
        
        // Resume any background crawling processes
        data.crawlingProjects?.forEach((project: any) => {
          if (project.status === 'crawling') {
            dispatch(initializeSession({ projectId: project.id }));
            dispatch(startCrawling({ projectId: project.id, background: true }));
            
            // Update live counts
            if (project.crawl_progress) {
              dispatch(updateLiveCounts({
                projectId: project.id,
                imageCount: project.crawl_progress.total_images || 0,
                linkCount: project.crawl_progress.total_links || 0,
                internalLinks: project.crawl_progress.internal_links || 0,
                externalLinks: project.crawl_progress.external_links || 0,
                pagesCount: project.crawl_progress.pages_crawled || 0
              }));
            }
          }
        });
      }
    } catch (error) {
      console.error('Error resuming background processes:', error);
    }
  };

  // Poll for crawl progress when crawling is active
  useEffect(() => {
    const shouldPoll = currentSession?.isCrawling || currentSession?.backgroundCrawling || (projects[0]?.status === 'crawling');
    
    if (!shouldPoll || !projects[0]) return;
    
    const interval = setInterval(async () => {
      await pollCrawlStatus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentSession?.isCrawling, currentSession?.backgroundCrawling, projects, dispatch, selectedProjectId]);

  // Global background crawling status check - runs even when component unmounts
  useEffect(() => {
    let globalInterval: NodeJS.Timeout;
    
    const checkGlobalCrawlingStatus = async () => {
      try {
        // Check if any projects are crawling in the background
        const response = await fetch('/api/audit-projects/background-status');
        if (response.ok) {
          const data = await response.json();
          
          // Update Redux state for any background crawling projects
          data.crawlingProjects?.forEach((project: any) => {
            if (project.status === 'crawling') {
              dispatch(initializeSession({ projectId: project.id }));
              dispatch(startCrawling({ projectId: project.id, background: true }));
              
              // Update live counts if available
              if (project.crawl_progress) {
                dispatch(updateLiveCounts({
                  projectId: project.id,
                  imageCount: project.crawl_progress.total_images || 0,
                  linkCount: project.crawl_progress.total_links || 0,
                  internalLinks: project.crawl_progress.internal_links || 0,
                  externalLinks: project.crawl_progress.external_links || 0,
                  pagesCount: project.crawl_progress.pages_crawled || 0
                }));
              }
            }
          });
        }
      } catch (error) {
        console.error('Global crawling status check error:', error);
      }
    };

    // Check immediately
    checkGlobalCrawlingStatus();
    
    // Then check every 10 seconds for background processes
    globalInterval = setInterval(checkGlobalCrawlingStatus, 10000);
    
    return () => {
      if (globalInterval) clearInterval(globalInterval);
    };
  }, [dispatch]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch project data and analyzed pages
   */
  const fetchData = async (retryCount = 0) => {
    try {
      if (!selectedProjectId) {
        router.push('/projects');
        return;
      }

      const projectResponse = await fetch(`/api/audit-projects/${selectedProjectId}`);
      const projectData = await projectResponse.json();
      
      if (projectResponse.ok) {
        setProjects([projectData.project]);
        
        dispatch(initializeSession({ projectId: selectedProjectId }));
        dispatch(setActiveProject({ projectId: selectedProjectId }));
        
        // Start crawling if project is pending
        if (projectData.project.status === "pending" && !crawlingStartedRef.current) {
          crawlingStartedRef.current = true;
          startCrawlingProcess(projectData.project.id, true); // Start in background by default
          return;
        }
        
        if (projectData.project.status !== "pending") {
          crawlingStartedRef.current = false;
        }
        
        await fetchAnalyzedPages(selectedProjectId, retryCount);
      } else {
        setError(projectData.error || 'Failed to fetch project');
      }
    } catch (error) {
      setError('Failed to fetch data');
      setLoading(false);
    } finally {
      setLoading(false);
      setError('');
    }
  };

  /**
   * Fetch analyzed pages with timeout handling
   */
  const fetchAnalyzedPages = async (projectId: string, retryCount: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
          
      const resultsResponse = await fetch(`/api/audit-projects/${projectId}/results`, {
        signal: controller.signal
      });
          
      clearTimeout(timeoutId);
      const resultsData = await resultsResponse.json();

      if (resultsResponse.ok && resultsData.pageResults) {
        const pages = resultsData.pageResults.map((pageResult: any) => {
          const results = pageResult.results;
          const analysisTypes = ['grammar_analysis', 'content_analysis', 'seo_analysis', 'performance_analysis', 'accessibility_analysis', 'ui_quality_analysis', 'image_relevance_analysis', 'context_analysis'];
          const completedAnalyses = results ? analysisTypes.filter(type => results[type]).length : 0;
          
          return {
            page: pageResult.page,
            project: {
              id: projectId,
              base_url: projects[0]?.base_url || '',
              status: projects[0]?.status || 'pending'
            },
            resultCount: completedAnalyses,
            overallScore: results?.overall_score || 0,
            overallStatus: results?.overall_status || 'pending'
          };
        });
        
        dispatch(updateAnalyzedPages({ projectId, pages }));
        updateAnalyzingPagesState(pages);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' && retryCount < 2) {
        setTimeout(() => fetchData(retryCount + 1), 2000);
        return;
      }
      
      dispatch(updateAnalyzedPages({ projectId, pages: [] }));
    }
  };

  /**
   * Poll crawl status for real-time updates
   */
  const pollCrawlStatus = async () => {
    if (!projects[0]?.id) return;
    
    try {
      const res = await fetch(`/api/audit-projects/${projects[0].id}/crawl-status`);
      const data = await res.json();
      
      if (!data.is_crawling) {
        dispatch(completeCrawling({ projectId: projects[0].id }));
        fetchData();
        return;
      }
      
      // Update live counts
      dispatch(updateLiveCounts({
        projectId: projects[0].id,
        imageCount: data.project.total_images || 0,
        linkCount: data.project.total_links || 0,
        internalLinks: data.project.internal_links || 0,
        externalLinks: data.project.external_links || 0,
        pagesCount: data.project.pages_crawled || 0
      }));
      
      // Update project data
      setProjects(prev => prev.map(p => 
        p.id === projects[0].id 
          ? { 
              ...p, 
              pages_crawled: data.project.pages_crawled,
              total_pages: data.project.total_pages
            }
          : p
      ));
      
      // Update crawled pages
      if (data.recent_pages && data.recent_pages.length > 0) {
        const crawledPages = data.recent_pages.map((page: any) => ({
          page: {
            id: page.id,
            url: page.url,
            title: page.title || 'Untitled',
            status_code: page.status_code,
            analysis_status: 'pending'
          },
          project: {
            id: projects[0]?.id || selectedProjectId,
            base_url: projects[0]?.base_url || '',
            status: projects[0]?.status || 'crawling'
          },
          resultCount: 0,
          overallScore: 0,
          overallStatus: 'pending'
        }));
        
        dispatch(updateCrawledPages({ projectId: projects[0].id, pages: data.recent_pages }));
        dispatch(updateAnalyzedPages({ projectId: projects[0].id, pages: crawledPages }));
      }
    } catch (error) {
      console.error('Crawl status polling error:', error);
    }
  };

  /**
   * Update analyzing pages state based on database status
   */
  const updateAnalyzingPagesState = (pages: AnalyzedPage[]) => {
    setAnalyzingPages(prev => {
      const newAnalyzing = new Set<string>();
      
      pages.forEach((page: AnalyzedPage) => {
        if (page.page.analysis_status === 'analyzing') {
          newAnalyzing.add(page.page.id);
        }
      });
      
      prev.forEach(pageId => {
        const page = pages.find((p: AnalyzedPage) => p.page.id === pageId);
        if (page && page.page.analysis_status !== 'completed' && page.page.analysis_status !== 'failed') {
          newAnalyzing.add(pageId);
        }
      });
      
      return newAnalyzing;
    });
  };

  // ============================================================================
  // CRAWLING OPERATIONS
  // ============================================================================

  /**
   * Start the crawling process
   */
  const startCrawlingProcess = async (projectId: string, background: boolean = false) => {
    setCrawling(true);
    setError('');
    
    // Reset project state
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            pages_crawled: 0,
            total_pages: 0,
            all_image_analysis: [],
            all_links_analysis: [],
            custom_urls_analysis: [],
            stripe_keys_analysis: [],
            status: 'crawling'
          }
        : p
    ));
    
    dispatch(updateAnalyzedPages({ projectId, pages: [] }));
    dispatch(updateCrawledPages({ projectId, pages: [] }));
    dispatch(initializeSession({ projectId }));
    dispatch(startCrawling({ projectId, background }));
    
    try {
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project_id: projectId,
          background: background 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to start crawling';
        setError(errorMessage);
        dispatch(stopCrawling({ projectId }));
        return;
      }

      if (background) {
        toast.success('Background crawling started! You can continue using the app while crawling runs in the background.');
      } else if (data.estimated_time_sec) {
        toast.success(`Crawling started! Estimated time: ${Math.round(data.estimated_time_sec)} seconds`);
      } else {
        toast.success('Crawling started!');
      }
    } catch (error) {
      console.error('Start crawling error:', error);
      setError('Failed to start crawling');
      dispatch(stopCrawling({ projectId }));
    } finally {
      setCrawling(false);
    }
  };

  /**
   * Stop the crawling process
   */
  const stopProcess = async (projectId: string) => {
    dispatch(stopCrawling({ projectId }));
    setError('');
    
    const stopToast = toast.loading('Stopping crawling process...');
    
    try {
      const response = await fetch(`/api/audit-projects/${projectId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to stop process');
        dispatch(startCrawling({ projectId }));
        toast.dismiss(stopToast);
        return;
      }

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: 'failed' } : p
      ));
      
      toast.dismiss(stopToast);
      toast.success('Crawling process stopped successfully');
    } catch (error) {
      console.error('Stop process network error:', error);
      setError('Network error while stopping process');
      dispatch(startCrawling({ projectId }));
      toast.dismiss(stopToast);
      toast.error('Network error while stopping process');
    }
  };

  // ============================================================================
  // ANALYSIS OPERATIONS
  // ============================================================================

  /**
   * Analyze a single page with improved performance and state management
   */
  const analyzeSinglePage = async (pageId: string) => {
    if (!projects[0]) return;

    setAnalyzingPages(prev => new Set(prev).add(pageId));
    setError('');
    
    let timeoutId: NodeJS.Timeout | undefined;
    let pollInterval: NodeJS.Timeout | undefined;
    
    try {
      // Start analysis with timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const response = await fetch(`/api/audit-projects/${projects[0].id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          page_ids: [pageId],
          background: false,
          analysis_types: ["grammar", "seo", "ui", "performance", "tagsAnalysis", "images", "links"]
        }),
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      // Analysis completed successfully
      toast.success('Analysis completed successfully!');
      
      // Remove from analyzing pages
      setAnalyzingPages(prev => {
        const newAnalyzing = new Set(prev);
        newAnalyzing.delete(pageId);
        return newAnalyzing;
      });

      // Immediately fetch updated data
      await fetchData();
      
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (pollInterval) clearInterval(pollInterval);
      
      if (error.name === 'AbortError') {
        toast.error('Analysis timed out. Please try again.');
        setError('Analysis timed out after 5 minutes');
      } else {
        setError(error.message || 'Failed to start analysis');
      }
      
      // Remove from analyzing pages on error
      setAnalyzingPages(prev => {
        const newAnalyzing = new Set(prev);
        newAnalyzing.delete(pageId);
        return newAnalyzing;
      });
    }
  };

  /**
   * Stop analysis for a single page
   */
  const stopAnalysis = async (pageId: string) => {
    if (!projects[0]) return;

    try {
      const response = await fetch(`/api/audit-projects/${projects[0].id}/analyze/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          page_id: pageId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop analysis');
      }

      toast.success('Analysis stopped successfully!');
      
      // Immediately fetch updated data
      await fetchData();
      
    } catch (error: any) {
      console.error(error.message || 'Failed to stop analysis');
      throw error;
    }
  };

  /**
   * Poll for analysis status updates
   */
  const pollAnalysisStatus = async (pageId: string, maxAttempts: number = 60) => {
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.warn(`Polling timeout for page ${pageId}`);
        return;
      }
      
      try {
        const response = await fetch(`/api/audit-projects/${projects[0]?.id}/results`);
        const data = await response.json();
        
        if (response.ok && data.pageResults) {
          const pageResult = data.pageResults.find((p: any) => p.page.id === pageId);
          
          if (pageResult && pageResult.page.analysis_status === 'completed') {
            // Analysis completed, update UI
            setAnalyzingPages(prev => {
              const newAnalyzing = new Set(prev);
              newAnalyzing.delete(pageId);
              return newAnalyzing;
            });
            
            await fetchData();
            return;
          } else if (pageResult && pageResult.page.analysis_status === 'failed') {
            // Analysis failed
            setAnalyzingPages(prev => {
              const newAnalyzing = new Set(prev);
              newAnalyzing.delete(pageId);
              return newAnalyzing;
            });
            
            setError(`Analysis failed for page: ${pageResult.page.error_message || 'Unknown error'}`);
            return;
          }
        }
        
        // Continue polling
        attempts++;
        setTimeout(poll, 2000); // Poll every 2 seconds
        
      } catch (error) {
        console.error('Error polling analysis status:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };
    
    poll();
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Manual refresh function
   */
  const manualRefresh = async () => {
    console.log('Manual refresh triggered');
    setError('');
    setLoading(true);
    await fetchData();
  };

  /**
   * Check if analysis is disabled
   */
  const isAnalysisDisabled = (): boolean => {
    return Boolean(projects[0]?.status === 'crawling' || currentSession?.isCrawling || currentSession?.backgroundCrawling);
  };

  /**
   * Filter and sort pages
   */
  const filteredAndSortedPages = (currentSession?.analyzedPages || []).filter((page: AnalyzedPage) => {
    const matchesProject = !selectedProjectId || page.project.id === selectedProjectId;
    const matchesSearch = searchTerm === '' || 
      page.page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || 
      (page.resultCount > 0 && statusFilter.includes(page.overallStatus));
    
    const matchesAnalysis = analysisFilter.length === 0 || 
      analysisFilter.includes(getAnalysisStatus(page));
    
    const matchesScore = page.resultCount === 0 || 
      (page.overallScore >= scoreRange.min && page.overallScore <= scoreRange.max);
    
    return matchesProject && matchesSearch && matchesStatus && matchesAnalysis && matchesScore;
  }).sort((a: AnalyzedPage, b: AnalyzedPage) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = (a.page.title || 'Untitled').localeCompare(b.page.title || 'Untitled');
        break;
      case 'status':
        const statusOrder = { 'pass': 1, 'warning': 2, 'fail': 3, 'pending': 4 };
        const aStatus = a.resultCount > 0 ? a.overallStatus : 'pending';
        const bStatus = b.resultCount > 0 ? b.overallStatus : 'pending';
        comparison = (statusOrder[aStatus as keyof typeof statusOrder] || 5) - (statusOrder[bStatus as keyof typeof statusOrder] || 5);
        break;
      case 'score':
        comparison = a.overallScore - b.overallScore;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
   
  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href="/projects" id={`audit-session-${selectedProjectId || 'default'}`}>
            ← Back to Projects
          </BackButton>
        </div>
        
        {/* Header */}
        <ProjectHeader 
          projects={projects}
          currentSession={currentSession}
          crawling={crawling}
          loading={loading}
          deleting={deleting}
          analyzing={analyzing}
          onStartCrawl={startCrawlingProcess}
          onStopCrawl={stopProcess}
          onRefresh={manualRefresh}
          isAnalysisDisabled={isAnalysisDisabled}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Process Status */}
        {(currentSession?.currentAction || currentSession?.isCrawling || currentSession?.backgroundCrawling || projects[0]?.status === 'crawling') && (
          <div className="mb-6 mt-4">
            <ProcessStatusCard currentSession={currentSession} />
          </div>
        )}

        {/* Global Background Crawling Status */}
        {auditState.globalIsCrawling && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">
                    Background Crawling Active
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    {Object.values(auditState.sessions).filter(s => s.backgroundCrawling).length} project(s) crawling in background
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Background
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Project Metrics */}
        {projects.length > 0 && projects[0] && (
          <div className="mb-6 mt-6">
            <ProjectMetrics 
              project={projects[0]}
              currentSession={currentSession}
              onToggleImageAnalysis={(show) => dispatch(toggleImageAnalysis({ projectId: projects[0].id, show }))}
              onToggleLinksAnalysis={(show) => dispatch(toggleLinksAnalysis({ projectId: projects[0].id, show }))}
            />
          </div>
        )}

        {/* Custom URLs */}
        {projects[0] && projects[0].custom_urls_analysis && Array.isArray(projects[0].custom_urls_analysis) && projects[0].custom_urls_analysis.length > 0 && (
          <div className="mb-6">
            <CustomUrlsCard customUrls={projects[0].custom_urls_analysis} />
          </div>
        )}

        {/* Image Analysis */}
        {currentSession?.showImageAnalysis && projects[0] && projects[0].all_image_analysis && Array.isArray(projects[0].all_image_analysis) && projects[0].all_image_analysis.length > 0 && (
          <div id="image-analysis-table" className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <ImageAnalysisTable images={projects[0].all_image_analysis} />
          </div>
        )}

        {/* Links Analysis */}
        {currentSession?.showLinksAnalysis && projects[0] && projects[0].all_links_analysis && Array.isArray(projects[0].all_links_analysis) && projects[0].all_links_analysis.length > 0 && (
          <div id="links-analysis-table" className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <LinksAnalysisTable links={projects[0].all_links_analysis} />
          </div>
        )}

        {/* Pages Table */}
        <PagesTable 
          projects={projects}
          currentSession={currentSession}
          analyzingPages={analyzingPages}
          deletingPages={deletingPages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          analysisFilter={analysisFilter}
          setAnalysisFilter={setAnalysisFilter}
          scoreRange={scoreRange}
          setScoreRange={setScoreRange}
          sortField={sortField}
          setSortField={setSortField}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          filteredAndSortedPages={filteredAndSortedPages}
          isPageAnalyzing={(page: AnalyzedPage) => isPageAnalyzing(page, analyzingPages)}
          isAnalysisDisabled={isAnalysisDisabled}
          onAnalyzeSinglePage={analyzeSinglePage}
          onStopAnalysis={stopAnalysis}
          onDeletePage={() => {}} // Implement if needed
          getStatusBadge={getStatusBadge}
          getAnalysisStatus={getAnalysisStatus}
        />
      </div>
    </div>
  );
}