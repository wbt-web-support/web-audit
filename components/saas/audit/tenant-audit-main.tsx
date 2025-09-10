'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  CodeSquare,
  Users,
  Building,
  Shield,
  TrendingUp
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
import { ProjectHeader } from '../components/ProjectHeader';
import { ProjectMetrics } from '@/components/audit/components';
import { ProcessStatusCard } from '@/components/audit/components';
import { CustomUrlsCard } from '@/components/audit/components';
import { PagesTable } from '@/components/audit/components';
import { TenantUsageCard } from '../components/TenantUsageCard';
import { TenantLimitsCard } from '../components/TenantLimitsCard';

import { ImageAnalysisTable } from '@/components/audit';
import { LinksAnalysisTable } from '@/components/audit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: {
    name: string;
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    limits: {
      maxProjects: number;
      maxPagesPerProject: number;
      maxConcurrentCrawls: number;
      maxWorkers: number;
      rateLimitPerMinute: number;
      storageGB: number;
    };
  };
  usage: {
    currentProjects: number;
    currentPages: number;
    currentCrawls: number;
    currentWorkers: number;
    currentStorageGB: number;
    monthlyCrawls: number;
  };
  status: 'active' | 'suspended' | 'cancelled';
}

interface AnalyzedPage {
  page: {
    id: string;
    url: string;
    title: string;
    status_code: number;
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

interface Project {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  base_url: string;
  status: 'pending' | 'crawling' | 'analyzing' | 'completed' | 'failed';
  settings: {
    maxPages: number;
    maxDepth: number;
    followExternal: boolean;
    respectRobotsTxt: boolean;
    userAgent: string;
    timeout: number;
    analysisTypes: string[];
    customUrls: string[];
  };
  total_pages: number;
  pages_crawled: number;
  pages_analyzed: number;
  all_image_analysis: any[];
  all_links_analysis: any[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  company_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  custom_info: any | null;
  created_by: string;
  // Additional properties to match AuditProject
  [key: string]: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAnalysisStatus = (page: AnalyzedPage): string => {
  if (page.page.analysis_status === 'analyzing') return 'analyzing';
  return page.resultCount > 0 ? 'analyzed' : 'not-analyzed';
};

const isPageAnalyzing = (page: AnalyzedPage, analyzingPages: Set<string>): boolean => {
  return analyzingPages.has(page.page.id) || page.page.analysis_status === 'analyzing';
};

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

const getPlanBadge = (tier: string) => {
  const variants = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-gold-100 text-gold-700'
  };

  return (
    <Badge className={variants[tier as keyof typeof variants] || 'bg-gray-100 text-gray-700'}>
      {tier.toUpperCase()}
    </Badge>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TenantAuditMain() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  const tenantSlug = searchParams.get('tenant');
  
  // Redux state
  const auditState = useSelector((state: RootState) => state.audit);
  const currentSession = selectedProjectId ? auditState.sessions[selectedProjectId] : null;
  
  // Local state
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
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
    if (!tenantSlug) {
      router.push('/dashboard');
      return;
    }

    fetchTenantData();
    
    if (selectedProjectId) {
      dispatch(initializeSession({ projectId: selectedProjectId }));
      dispatch(setActiveProject({ projectId: selectedProjectId }));
    }
    
    // Check for any background crawling processes that need to be resumed
    checkAndResumeBackgroundProcesses();
    
    return () => {
      crawlingStartedRef.current = false;
    };
  }, [selectedProjectId, tenantSlug, dispatch]);

  // Poll for crawl progress when crawling is active
  useEffect(() => {
    const shouldPoll = currentSession?.isCrawling || currentSession?.backgroundCrawling || (projects[0]?.status === 'crawling');
    
    if (!shouldPoll || !projects[0] || !tenant) return;
    
    const interval = setInterval(async () => {
      await pollCrawlStatus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentSession?.isCrawling, currentSession?.backgroundCrawling, projects, tenant, dispatch, selectedProjectId]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch tenant data and projects
   */
  const fetchTenantData = async (retryCount = 0) => {
    try {
      if (!tenantSlug) {
        router.push('/dashboard');
        return;
      }

      // Fetch tenant information
      const tenantResponse = await fetch(`/api/saas/tenants/${tenantSlug}`);
      const tenantData = await tenantResponse.json();
      
      if (!tenantResponse.ok) {
        setError(tenantData.error || 'Failed to fetch tenant data');
        return;
      }

      setTenant(tenantData.tenant);

      // Fetch projects for tenant
      const projectsResponse = await fetch(`/api/saas/tenants/${tenantSlug}/projects`);
      const projectsData = await projectsResponse.json();
      
      if (projectsResponse.ok) {
        setProjects(projectsData.projects);
        
        // Find the selected project
        const selectedProject = projectsData.projects.find((p: Project) => p.id === selectedProjectId);
        
        if (selectedProject) {
          dispatch(initializeSession({ projectId: selectedProjectId! }));
          dispatch(setActiveProject({ projectId: selectedProjectId! }));
          
          // Start crawling if project is pending
          if (selectedProject.status === "pending" && !crawlingStartedRef.current) {
            crawlingStartedRef.current = true;
            startCrawlingProcess(selectedProject.id, true);
            return;
          }
          
          if (selectedProject.status !== "pending") {
            crawlingStartedRef.current = false;
          }
          
          await fetchAnalyzedPages(selectedProjectId!, retryCount);
        }
      } else {
        setError(projectsData.error || 'Failed to fetch projects');
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
          
      const resultsResponse = await fetch(`/api/saas/tenants/${tenantSlug}/projects/${projectId}/results`, {
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
        setTimeout(() => fetchTenantData(retryCount + 1), 2000);
        return;
      }
      
      dispatch(updateAnalyzedPages({ projectId, pages: [] }));
    }
  };

  /**
   * Check and resume background processes
   */
  const checkAndResumeBackgroundProcesses = async () => {
    try {
      const response = await fetch(`/api/saas/tenants/${tenantSlug}/background-status`);
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

  /**
   * Poll crawl status for real-time updates
   */
  const pollCrawlStatus = async () => {
    if (!projects[0]?.id || !tenant) return;
    
    try {
      const res = await fetch(`/api/saas/tenants/${tenantSlug}/projects/${projects[0].id}/crawl-status`);
      const data = await res.json();
      
      if (!data.is_crawling) {
        dispatch(completeCrawling({ projectId: projects[0].id }));
        fetchTenantData();
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
    if (!tenant) return;

    setCrawling(true);
    setError('');
    
    // Check tenant limits
    if (tenant.usage.currentCrawls >= tenant.plan.limits.maxConcurrentCrawls) {
      setError(`Maximum concurrent crawls reached (${tenant.plan.limits.maxConcurrentCrawls})`);
      setCrawling(false);
      return;
    }

    // Reset project state
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            status: 'crawling',
            pages_crawled: 0,
            total_pages: 0
          }
        : p
    ));
    
    dispatch(updateAnalyzedPages({ projectId, pages: [] }));
    dispatch(updateCrawledPages({ projectId, pages: [] }));
    dispatch(initializeSession({ projectId }));
    dispatch(startCrawling({ projectId, background }));
    
    try {
      const response = await fetch(`/api/saas/tenants/${tenantSlug}/projects/${projectId}/start-crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
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
      const response = await fetch(`/api/saas/tenants/${tenantSlug}/projects/${projectId}/stop`, {
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
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Manual refresh function
   */
  const manualRefresh = async () => {
    console.log('Manual refresh triggered');
    setError('');
    setLoading(true);
    await fetchTenantData();
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
    return <AuditMainSkeleton />;
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-4">The tenant you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href={`/dashboard?tenant=${tenantSlug}`} id={`tenant-audit-session-${selectedProjectId || 'default'}`}>
            ← Back to Dashboard
          </BackButton>
        </div>

        {/* Tenant Header */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tenant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>@{tenant.slug}</span>
                      {getPlanBadge(tenant.plan.tier)}
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {tenant.usage.currentProjects}/{tenant.plan.limits.maxProjects} projects
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tenant Usage & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TenantUsageCard tenant={tenant} />
          <TenantLimitsCard tenant={tenant} />
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

        {/* Process Status - Only show when actively crawling */}
        {(projects[0]?.status === 'crawling' || projects[0]?.status === 'analyzing') && (
          <div className="mb-6 mt-6">
            <ProcessStatusCard currentSession={currentSession} />
          </div>
        )}

        {/* Project Metrics */}
        {projects.length > 0 && projects[0] && (
          <div className="my-6">
            <ProjectMetrics 
              project={{
                ...projects[0],
                base_url: projects[0].base_url,
                pages_crawled: projects[0].pages_crawled,
                total_pages: projects[0].total_pages,
                all_image_analysis: projects[0].all_image_analysis || [],
                all_links_analysis: projects[0].all_links_analysis || []
              }}
              currentSession={currentSession}
              onToggleImageAnalysis={(show) => dispatch(toggleImageAnalysis({ projectId: projects[0].id, show }))}
              onToggleLinksAnalysis={(show) => dispatch(toggleLinksAnalysis({ projectId: projects[0].id, show }))}
            />
          </div>
        )}

        {/* Custom URLs */}
        {projects[0] && projects[0].settings.customUrls && Array.isArray(projects[0].settings.customUrls) && projects[0].settings.customUrls.length > 0 && (
          <div className="mb-6">
            <CustomUrlsCard customUrls={projects[0].settings.customUrls.map(url => ({ pageLink: url, isPresent: false }))} />
          </div>
        )}

        {/* Image Analysis */}
        {currentSession?.showImageAnalysis && projects[0] && (
          <div id="image-analysis-table" className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <ImageAnalysisTable images={[]} />
          </div>
        )}

        {/* Links Analysis */}
        {currentSession?.showLinksAnalysis && projects[0] && (
          <div id="links-analysis-table" className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <LinksAnalysisTable links={[]} />
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
          onAnalyzeSinglePage={() => {}} // TODO: Implement
          onStopAnalysis={() => {}} // TODO: Implement
          onDeletePage={() => {}} // TODO: Implement
          getStatusBadge={getStatusBadge}
          getAnalysisStatus={getAnalysisStatus}
        />
      </div>
    </div>
  );
}
