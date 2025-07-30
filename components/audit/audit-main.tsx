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
import { ImageAnalysisTable } from './image-analysis-table';
import { LinksAnalysisTable } from './links-analysis-table';
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

export function AuditMain() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  
  // Redux state
  const auditState = useSelector((state: RootState) => state.audit);
  const currentSession = selectedProjectId ? auditState.sessions[selectedProjectId] : null;
  
  // Debug logging
  useEffect(() => {
    if (currentSession) {
      console.log('Current session state:', {
        projectId: currentSession.projectId,
        isCrawling: currentSession.isCrawling,
        liveImageCount: currentSession.liveImageCount,
        liveLinkCount: currentSession.liveLinkCount,
        livePagesCount: currentSession.livePagesCount,
        analyzedPagesCount: currentSession.analyzedPages?.length || 0
      });
    }
  }, [currentSession]);
  
  // Local state (keeping UI-specific state local)
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
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
  const crawlingStartedRef = useRef(false);

  // Debug logging for project state
  useEffect(() => {
    if (projects[0]) {
      console.log('Project state:', {
        id: projects[0].id,
        status: projects[0].status,
        pages_crawled: projects[0].pages_crawled,
        total_pages: projects[0].total_pages,
        image_analysis_length: projects[0].all_image_analysis?.length || 0,
        links_analysis_length: projects[0].all_links_analysis?.length || 0
      });
    }
  }, [projects]);

  useEffect(() => {
    fetchData();
    // Initialize Redux session when component mounts or project changes
    if (selectedProjectId) {
      dispatch(initializeSession({ projectId: selectedProjectId }));
      dispatch(setActiveProject({ projectId: selectedProjectId }));
    }
    
    // Cleanup function to reset crawling ref when switching projects
    return () => {
      crawlingStartedRef.current = false;
    };
  }, [selectedProjectId, dispatch]);



  // Manual refresh function for user control
  const manualRefresh = async () => {
    console.log('Manual refresh triggered');
    setError('');
    setLoading(true);
    await fetchData();
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleAnalysisFilter = (analysis: string) => {
    setAnalysisFilter(prev => 
      prev.includes(analysis) 
        ? prev.filter(a => a !== analysis)
        : [...prev, analysis]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setAnalysisFilter([]);
    setScoreRange({ min: 0, max: 100 });
  };

  const handleSort = (field: 'title' | 'status' | 'score') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'title' | 'status' | 'score') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 inline ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 inline ml-1" /> : 
      <ArrowDown className="h-3 w-3 inline ml-1" />;
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || 
           statusFilter.length > 0 || 
           analysisFilter.length > 0 || 
           scoreRange.min !== 0 || 
           scoreRange.max !== 100;
  };

  const fetchData = async (retryCount = 0) => {
    try {
      // If no project selected, redirect to projects page
      if (!selectedProjectId) {
        router.push('/projects');
        return;
      }

      // Fetch the selected project
      const projectResponse = await fetch(`/api/audit-projects/${selectedProjectId}`);
      const projectData = await projectResponse.json();
      
      if (projectResponse.ok) {
        setProjects([projectData.project]);
        
        // Initialize Redux session for this project
        dispatch(initializeSession({ projectId: selectedProjectId }));
        dispatch(setActiveProject({ projectId: selectedProjectId }));
        
        // If project is pending and we haven't started crawling yet, start it
        if (projectData.project.status === "pending" && !crawlingStartedRef.current) {
          crawlingStartedRef.current = true;
          startCrawlingProcess(projectData.project.id);
          return; // Exit early, let the crawling process handle data updates
        }
        
        // Reset crawling ref if project is not pending
        if (projectData.project.status !== "pending") {
          crawlingStartedRef.current = false;
        }
        
        // Fetch analyzed pages from the selected project with timeout handling
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const resultsResponse = await fetch(`/api/audit-projects/${selectedProjectId}/results`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const resultsData = await resultsResponse.json();

          if (resultsResponse.ok && resultsData.pageResults) {
              
            const pages = resultsData.pageResults.map((pageResult: any) => {
              const results = pageResult.results;
             
              // Count how many analysis types have been completed
              const analysisTypes = ['grammar_analysis', 'content_analysis', 'seo_analysis', 'performance_analysis', 'accessibility_analysis', 'ui_quality_analysis', 'image_relevance_analysis', 'context_analysis'];
              const completedAnalyses = results ? analysisTypes.filter(type => results[type]).length : 0;
              
              return {
                page: pageResult.page,
                project: {
                  id: projectData.project.id,
                  base_url: projectData.project.base_url,
                  status: projectData.project.status
                },
                resultCount: completedAnalyses,
                overallScore: results?.overall_score || 0,
                overallStatus: results?.overall_status || 'pending'
              };
            });
            // Update Redux state with analyzed pages
            if (selectedProjectId) {
              dispatch(updateAnalyzedPages({ projectId: selectedProjectId, pages }));
            }
            
            // Update analyzing state based on database analysis_status
            setAnalyzingPages(prev => {
              const newAnalyzing = new Set<string>();
              
              // Add pages that are currently analyzing according to database
              pages.forEach((page: AnalyzedPage) => {
                if (page.page.analysis_status === 'analyzing') {
                  newAnalyzing.add(page.page.id);
                }
              });
              
              // Also keep pages that are in local state but not yet updated in database
              // (for immediate UI feedback when user clicks analyze)
              prev.forEach(pageId => {
                const page = pages.find((p: AnalyzedPage) => p.page.id === pageId);
                if (page && page.page.analysis_status !== 'completed' && page.page.analysis_status !== 'failed') {
                  newAnalyzing.add(pageId);
                }
              });
              
              return newAnalyzing;
            });
          }
        } catch (error: any) {
          console.error('Results fetch error:', error);
          
          // Handle timeout specifically
          if (error?.name === 'AbortError') {
            console.log('Results fetch timed out, showing empty state');
            
            // Retry up to 2 times for timeout errors
            if (retryCount < 2) {
              console.log(`Retrying results fetch (attempt ${retryCount + 1})`);
              setTimeout(() => fetchData(retryCount + 1), 2000);
              return;
            } else {
              toast.error('Results loading timed out. Please refresh the page.');
            }
          }
          
          // Project exists but no pages yet or error occurred
          if (selectedProjectId) {
            dispatch(updateAnalyzedPages({ projectId: selectedProjectId, pages: [] }));
          }
        }
      } else {
        setError(projectData.error || 'Failed to fetch project');
      }
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch crawled pages in real-time during crawling
  const fetchCrawledPages = async () => {
    if (!selectedProjectId || !currentSession?.isCrawling) return;
    
    try {
      const response = await fetch(`/api/audit-projects/${selectedProjectId}/crawl-status`);
      const data = await response.json();
      
      if (data.recent_pages && data.recent_pages.length > 0) {
        // Convert crawled pages to AnalyzedPage format
        const crawledPages = data.recent_pages.map((page: any) => ({
          page: {
            id: page.id,
            url: page.url,
            title: page.title || 'Untitled',
            status_code: page.status_code,
            analysis_status: 'pending' // All crawled pages start as pending
          },
          project: {
            id: projects[0]?.id || selectedProjectId,
            base_url: projects[0]?.base_url || '',
            status: projects[0]?.status || 'crawling'
          },
          resultCount: 0, // No analysis results yet
          overallScore: 0,
          overallStatus: 'pending'
        }));
        
        // Update Redux state with crawled pages
        dispatch(updateCrawledPages({ projectId: selectedProjectId, pages: crawledPages }));
      }
    } catch (error) {
      console.error('Error fetching crawled pages:', error);
    }
  };

  // Poll for crawl progress when crawling is active
  useEffect(() => {
    // Check if we should be polling - either Redux says crawling OR project status is crawling
    const shouldPoll = currentSession?.isCrawling || (projects[0]?.status === 'crawling');
    
    if (!shouldPoll || !projects[0]) return;
    
    console.log('Starting polling for project:', projects[0].id, 'Redux crawling:', currentSession?.isCrawling, 'Project status:', projects[0].status);
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit-projects/${projects[0].id}/crawl-status`);
        const data = await res.json();
        
        console.log('Polling response:', data);
        
        if (!data.is_crawling) {
          console.log('Crawling completed, stopping polling');
          dispatch(completeCrawling({ projectId: projects[0].id }));
          clearInterval(interval);
          
          // Refresh data to get final state
          fetchData();
          return;
        }
        
        // Update live counts from API response
        const newImageCount = data.project.total_images || 0;
        const newLinkCount = data.project.total_links || 0;
        const newInternalLinks = data.project.internal_links || 0;
        const newExternalLinks = data.project.external_links || 0;
        const newPagesCount = data.project.pages_crawled || 0;
        
        console.log('Live counts update:', {
          images: newImageCount,
          links: newLinkCount,
          internal: newInternalLinks,
          external: newExternalLinks,
          pages: newPagesCount,
          projectStatus: data.project.status,
          isCrawling: data.is_crawling
        });
        
        // Update Redux state with live counts
        dispatch(updateLiveCounts({
          projectId: projects[0].id,
          imageCount: newImageCount,
          linkCount: newLinkCount,
          internalLinks: newInternalLinks,
          externalLinks: newExternalLinks,
          pagesCount: newPagesCount
        }));
        
        // Debug: Log the updated Redux state
        console.log('Redux state after update:', {
          projectId: projects[0].id,
          newImageCount,
          newLinkCount,
          newInternalLinks,
          newExternalLinks,
          newPagesCount
        });
        
        // Also fetch the full project data to ensure we have the latest image and link data
        try {
          const projectRes = await fetch(`/api/audit-projects/${projects[0].id}`);
          const projectData = await projectRes.json();
          
          if (projectRes.ok && projectData.project) {
            console.log('Full project data fetched:', {
              images: projectData.project.all_image_analysis?.length || 0,
              links: projectData.project.all_links_analysis?.length || 0
            });
            
            // Update project data with the full project data
            setProjects(prev => prev.map(p => 
              p.id === projects[0].id 
                ? { 
                    ...p, 
                    pages_crawled: data.project.pages_crawled,
                    total_pages: data.project.total_pages,
                    all_image_analysis: projectData.project.all_image_analysis || [],
                    all_links_analysis: projectData.project.all_links_analysis || []
                  }
                : p
            ));
          }
        } catch (error) {
          console.error('Error fetching full project data:', error);
        }
        
        // Update project data with live counts
        setProjects(prev => prev.map(p => 
          p.id === projects[0].id 
            ? { 
                ...p, 
                pages_crawled: data.project.pages_crawled,
                total_pages: data.project.total_pages
                // Don't override all_image_analysis and all_links_analysis with placeholder arrays
                // Let the backend data flow through naturally
              }
            : p
        ));
        
        // Show recent page updates
        if (data.recent_pages && data.recent_pages.length > 0) {
          // Update Redux state with crawled pages
          dispatch(updateCrawledPages({ projectId: projects[0].id, pages: data.recent_pages }));
          
          const latestPage = data.recent_pages[0];
          if (latestPage && latestPage.title) {
            // Update current action in Redux
            dispatch(startCrawling({ projectId: projects[0].id }));
          }
          
          // Update pages table with ALL crawled pages (no limit)
          const crawledPages = data.recent_pages.map((page: any) => ({
            page: {
              id: page.id,
              url: page.url,
              title: page.title || 'Untitled',
              status_code: page.status_code,
              analysis_status: 'pending' // All crawled pages start as pending
            },
            project: {
              id: projects[0]?.id || selectedProjectId,
              base_url: projects[0]?.base_url || '',
              status: projects[0]?.status || 'crawling'
            },
            resultCount: 0, // No analysis results yet
            overallScore: 0,
            overallStatus: 'pending'
          }));
          
          // Update analyzed pages with real-time crawled pages
          dispatch(updateAnalyzedPages({ projectId: projects[0].id, pages: crawledPages }));
          console.log(`Updated pages table with ${crawledPages.length} crawled pages`);
        } else if (data.recent_pages && data.recent_pages.length === 0) {
          // Clear pages if no pages are crawled yet
          dispatch(updateAnalyzedPages({ projectId: projects[0].id, pages: [] }));
          dispatch(updateCrawledPages({ projectId: projects[0].id, pages: [] }));
        }
        
      } catch (error) {
        console.error('Crawl status polling error:', error);
      }
    }, 1000); // Poll every second for better real-time updates
    
    return () => {
      console.log('Clearing polling interval for project:', projects[0]?.id);
      clearInterval(interval);
    };
  }, [currentSession?.isCrawling, projects, dispatch, selectedProjectId]);



  // Start polling on crawl start
  const startCrawlingProcess = async (projectId: string) => {
    setCrawling(true);
    setError('');
    
    // Reset local state immediately for better UX
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
    
    // Clear any existing analyzed pages for this project
    dispatch(updateAnalyzedPages({ projectId, pages: [] }));
    dispatch(updateCrawledPages({ projectId, pages: [] }));
    
    // Initialize Redux session and start crawling
    dispatch(initializeSession({ projectId }));
    dispatch(startCrawling({ projectId }));
    
    try {
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to start crawling';
        setError(errorMessage);
        dispatch(stopCrawling({ projectId }));
        toast.error(errorMessage);
        return;
      }

      // Show success message with estimated time
      if (data.estimated_time_sec) {
        toast.success(`Crawling started! Estimated time: ${Math.round(data.estimated_time_sec)} seconds`);
      } else {
        toast.success('Crawling started!');
      }
      
      // Start polling immediately for real-time updates
      console.log('Crawling started - polling for live updates...');
      
    } catch (error) {
      console.error('Start crawling error:', error);
      setError('Failed to start crawling');
      dispatch(stopCrawling({ projectId }));
    } finally {
      setCrawling(false);
    }
  };

  // Additional effect to ensure polling starts when project status changes to crawling
  useEffect(() => {
    if (projects[0]?.status === 'crawling' && !currentSession?.isCrawling) {
      console.log('Project status is crawling but Redux not updated, starting polling manually');
      dispatch(startCrawling({ projectId: projects[0].id }));
    }
  }, [projects[0]?.status, currentSession?.isCrawling, dispatch]);

  // Immediate polling start when project status changes to crawling
  useEffect(() => {
    if (projects[0]?.status === 'crawling') {
      console.log('Project status changed to crawling, ensuring Redux state is initialized');
      dispatch(initializeSession({ projectId: projects[0].id }));
      if (!currentSession?.isCrawling) {
        dispatch(startCrawling({ projectId: projects[0].id }));
      }
      
      // Force an immediate poll to get current state
      setTimeout(() => {
        if (projects[0]?.id) {
          fetch(`/api/audit-projects/${projects[0].id}/crawl-status`)
            .then(res => res.json())
            .then(data => {
              console.log('Immediate poll response:', data);
              if (data.project) {
                dispatch(updateLiveCounts({
                  projectId: projects[0].id,
                  imageCount: data.project.total_images || 0,
                  linkCount: data.project.total_links || 0,
                  internalLinks: data.project.internal_links || 0,
                  externalLinks: data.project.external_links || 0,
                  pagesCount: data.project.pages_crawled || 0
                }));
              }
            })
            .catch(err => console.error('Immediate poll error:', err));
        }
      }, 100);
    }
  }, [projects[0]?.status, currentSession?.isCrawling, dispatch]);

  const startAnalysis = async (projectId: string, pageIds: string[]) => {
    setAnalyzing(true);
    const isBatchAnalysis = pageIds.length > 1;
    setError('');
    
    // Mark pages as analyzing
    setAnalyzingPages(new Set(pageIds));

    try {
      const response = await fetch(`/api/audit-projects/${projectId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_ids: pageIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start analysis');
        setAnalyzingPages(new Set()); // Clear analyzing state on error
      } else {
        // Keep analyzing state until next data fetch shows completion
      }
    } catch (error) {
      setError('Failed to start analysis');
      setAnalyzingPages(new Set()); // Clear analyzing state on error
    } finally {
      setAnalyzing(false);
    }
  };

  const stopProcess = async (projectId: string) => {
    // Immediately update UI for instant feedback
    dispatch(stopCrawling({ projectId }));
    setError('');
    
    // Show toast notification
    const stopToast = toast.loading('Stopping crawling process...');
    
    try {
      const response = await fetch(`/api/audit-projects/${projectId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Stop process error:', data.error);
        setError(data.error || 'Failed to stop process');
        // Revert UI state if stop failed
        dispatch(startCrawling({ projectId }));
        
        // Update toast with error
        toast.dismiss(stopToast);
        toast.error(data.error || 'Failed to stop process');
        return;
      }

      // Success - update project status immediately
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, status: 'failed' }
          : p
      ));
      
      console.log('Process stopped successfully:', data.message);
      
      // Update toast with success
      toast.dismiss(stopToast);
      toast.success('Crawling process stopped successfully');
      
    } catch (error) {
      console.error('Stop process network error:', error);
      setError('Network error while stopping process');
      // Revert UI state if stop failed
      dispatch(startCrawling({ projectId }));
      
      // Update toast with error
      toast.dismiss(stopToast);
      toast.error('Network error while stopping process');
    }
  };

  const stopAllAnalysis = async () => {
    if (analyzingPages.size === 0) return;

    const analyzingPageIds = Array.from(analyzingPages);
    setError('');

    try {
      // Stop each analyzing page individually
      const stopPromises = analyzingPageIds.map(async (pageId) => {
        try {
          const response = await fetch(`/api/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              analysis_status: 'pending' // Reset to pending instead of failed
            }),
          });

          if (!response.ok) {
            console.error(`Failed to stop analysis for page ${pageId}`);
            return false;
          }
          return true;
        } catch (error) {
          console.error(`Error stopping analysis for page ${pageId}:`, error);
          return false;
        }
      });

      const results = await Promise.all(stopPromises);
      const successCount = results.filter(Boolean).length;

      // Clear local analyzing state immediately for better UX
      setAnalyzingPages(new Set());

      if (successCount === analyzingPageIds.length) {
        toast.success('All analysis processes stopped successfully');
      } else if (successCount > 0) {
        toast.success(`Stopped ${successCount} of ${analyzingPageIds.length} analysis processes`);
        setError(`${analyzingPageIds.length - successCount} processes could not be stopped`);
      } else {
        setError('Failed to stop analysis processes');
      }
    } catch (error) {
      setError('Failed to stop analysis processes');
      console.error('Stop all analysis error:', error);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This will also remove all analysis results.')) {
      return;
    }

    console.log('Starting delete for page:', pageId);
    setDeletingPages(prev => new Set(prev).add(pageId));
    setError('');

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });

      console.log('Delete response:', response.status, response.ok);

      if (response.ok) {
        console.log('Delete successful for page:', pageId);
        
        // Remove from selected pages if it was selected
        setSelectedPages(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(pageId);
          return newSelected;
        });

        // Remove from analyzing pages if it was being analyzed
        setAnalyzingPages(prev => {
          const newAnalyzing = new Set(prev);
          newAnalyzing.delete(pageId);
          return newAnalyzing;
        });

        // Show success message
        toast.success('Page deleted successfully');
      } else {
        const data = await response.json();
        console.error('Delete failed:', data);
        setError(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete page');
    } finally {
      setDeletingPages(prev => {
        const newDeleting = new Set(prev);
        newDeleting.delete(pageId);
        return newDeleting;
      });
    }
  };

  const deleteSelectedPages = async () => {
    const selectedPageIds = Array.from(selectedPages);
    if (selectedPageIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedPageIds.length} selected pages? This will also remove all analysis results.`)) {
      return;
    }

    console.log('Starting bulk delete for pages:', selectedPageIds);
    setDeleting(true);
    setDeletingPages(new Set(selectedPageIds));
    // Show toast for bulk delete
    toast.loading(`Deleting ${selectedPageIds.length} pages...`);
    setError('');

    try {
      // Delete pages one by one
      let deletedCount = 0;
      const failedPages: string[] = [];

      for (const pageId of selectedPageIds) {
        try {
          console.log(`Deleting page ${deletedCount + 1}/${selectedPageIds.length}:`, pageId);
          
          const response = await fetch(`/api/pages/${pageId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            deletedCount++;
            console.log(`Successfully deleted page:`, pageId);
          } else {
            const data = await response.json();
            console.error(`Failed to delete page ${pageId}:`, data.error);
            failedPages.push(pageId);
          }
        } catch (error) {
          console.error(`Error deleting page ${pageId}:`, error);
          failedPages.push(pageId);
        }
      }

      // Clear selected pages
      setSelectedPages(new Set());
      
      // Clear analyzing and deleting pages
      setAnalyzingPages(prev => {
        const newAnalyzing = new Set(prev);
        selectedPageIds.forEach(id => newAnalyzing.delete(id));
        return newAnalyzing;
      });

      // Show result message
      if (deletedCount === selectedPageIds.length) {
        toast.success(`Successfully deleted ${deletedCount} pages`);
      } else if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} of ${selectedPageIds.length} pages`);
        setError(`${failedPages.length} pages failed to delete`);
      } else {
        setError('Failed to delete any pages');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      setError('Failed to delete selected pages');
    } finally {
      setDeleting(false);
      setDeletingPages(new Set());
    }
  };

  const analyzeSinglePage = async (pageId: string) => {
    if (!projects[0]) return;

    setAnalyzingPages(prev => new Set(prev).add(pageId));
    setError('');

    try {
      const response = await fetch(`/api/audit-projects/${projects[0].id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_ids: [pageId] }),
      });

      const data = await response.json();
     console.log("data **********",data)
  
      if (!response.ok) {
        setError(data.error || 'Failed to start analysis');
        setAnalyzingPages(prev => {
          const newAnalyzing = new Set(prev);
          newAnalyzing.delete(pageId);
          return newAnalyzing;
        });
      }
      // Note: No currentAction updates - just rely on row-level state
    } catch (error) {
      setError('Failed to start analysis');
      setAnalyzingPages(prev => {
        const newAnalyzing = new Set(prev);
        newAnalyzing.delete(pageId);
        return newAnalyzing;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'fail':
        return <XCircle className="h-4 text-red-500 dark:text-red-400 w-full" />;
      case 'pending':
        return <Clock className="h-4 text-muted-foreground w-full" />;
      default:
          return <AlertTriangle className="h-4 text-muted-foreground w-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'bg-emerald-500 dark:bg-emerald-600 text-white w-full text-center justify-center',
      warning: 'bg-amber-500 dark:bg-amber-600 text-white w-full text-center justify-center',
      fail: 'bg-red-500 dark:bg-red-600 text-white w-full text-center justify-center',
      pending: 'bg-muted text-muted-foreground w-full text-center justify-center '
    };

    const statusLabels = {
      pass: 'GOOD',
      warning: 'MODERATE',
      fail: 'POOR',
      pending: 'PENDING'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
        {statusLabels[status as keyof typeof statusLabels] || status.toUpperCase()}
      </Badge>
    );
  };

  const getAnalysisStatus = (page: AnalyzedPage) => {
    // Use database analysis_status field instead of local state
    if (page.page.analysis_status === 'analyzing') return 'analyzing';
    return page.resultCount > 0 ? 'analyzed' : 'not-analyzed';
  };

  const isPageAnalyzing = (page: AnalyzedPage) => {
    // Check both local state (immediate) and database field (persistent)
    return analyzingPages.has(page.page.id) || page.page.analysis_status === 'analyzing';
  };

  const isAnalysisDisabled = () => {
    // Disable analysis if project is still crawling
    return projects[0]?.status === 'crawling' || currentSession?.isCrawling;
  };

  // Add polling effect when pages are analyzing
  useEffect(() => {
    if (analyzingPages.size === 0) return;

    // More frequent polling for batch analysis
    const pollIntervalMs = analyzingPages.size > 5 ? 2000 : 3000;

    const pollInterval = setInterval(() => {
      console.log(`Polling for analysis updates (${analyzingPages.size} pages analyzing)...`);
      fetchData();
    }, pollIntervalMs); // Poll more frequently for batch analysis

    return () => clearInterval(pollInterval);
  }, [analyzingPages.size]);

  const filteredAndSortedPages = (currentSession?.analyzedPages || []).filter((page: AnalyzedPage) => {
    const matchesProject = !selectedProjectId || page.project.id === selectedProjectId;
    const matchesSearch = searchTerm === '' || 
      page.page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter (Pass, Warning, Fail)
    const matchesStatus = statusFilter.length === 0 || 
      (page.resultCount > 0 && statusFilter.includes(page.overallStatus));
    
    // Analysis filter (Analyzed, Not Analyzed, Analyzing)
    const matchesAnalysis = analysisFilter.length === 0 || 
      analysisFilter.includes(getAnalysisStatus(page));
    
    // Score range filter
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
   

  if (loading) {
    return <AuditMainSkeleton />;
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button - Top Left */}
        <div className="mb-4">
          <BackButton href="/projects">
            Back to Projects
          </BackButton>
        </div>
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
                Analyze website pages and view detailed audit results
              </p>
            </div>
            <div className="flex items-center gap-2">
          {/* Start/Stop Crawl Buttons moved here */}
          {projects.length > 0 && projects[0] && (
            <>
              {projects[0].status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => startCrawlingProcess(projects[0].id)}
                  disabled={crawling}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Crawl
                </Button>
              )}
              {(projects[0].status === 'completed' || projects[0].status === 'failed') && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to recrawl? This will reset all pages, images, links, and analysis data to start fresh.')) {
                      startCrawlingProcess(projects[0].id);
                    }
                  }}
                  disabled={crawling || currentSession?.isCrawling}
                  className="relative overflow-hidden"
                  style={{ background: currentSession?.isCrawling ? '#fff' : undefined }}
                >
                  <span className="relative z-10 flex items-center">
                    <RefreshCw className={`h-4 w-4 transition-all ${crawling || currentSession?.isCrawling ? "animate-spin" : ""}`} />
                    {currentSession?.isCrawling
                      ? "Crawling..."
                      : crawling
                        ? "Starting Recrawl"
                        : "Recrawl"}
                  </span>
                </Button>
              )}
              {projects[0].status === 'crawling' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stopProcess(projects[0].id)}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Crawl
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={loading || deleting || analyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/projects/edit/${projects[0]?.id ?? ''}`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {(currentSession?.currentAction || currentSession?.isCrawling) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">Process Running</p>
                <p className="text-sm text-muted-foreground">
                  {currentSession?.currentAction || (currentSession?.isCrawling ? 'Crawling in progress...' : '')}
                </p>
              </div>
            </div>
            
            {/* Recent Crawling Activity */}
            {currentSession?.isCrawling && currentSession?.recentCrawledPages && currentSession.recentCrawledPages.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Pages Crawled ({currentSession.recentCrawledPages.length} total):
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {currentSession.recentCrawledPages.slice(0, 10).map((page: any, index: number) => (
                    <div key={page.id || index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="truncate">
                        {page.title || page.url}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({page.status_code || 'N/A'})
                      </span>
                    </div>
                  ))}
                  {currentSession.recentCrawledPages.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center">
                      ... and {currentSession.recentCrawledPages.length - 10} more pages
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {/* Current Project Info */}
      {projects.length > 0 && projects[0] && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Project</CardTitle>
                <CardDescription>{projects[0].base_url}</CardDescription>
              </div>
              {/* Removed Start/Stop/Recrawl buttons from here */}
            </div>
          </CardHeader>
          <CardContent>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 hover:shadow-md transition-all  group">
                <div className="flex-shrink-0">
                  {projects[0].status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  ) : projects[0].status === 'crawling' ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : projects[0].status === 'analyzing' ? (
                    <BarChart3 className="h-6 w-6 text-amber-500" />
                  ) : projects[0].status === 'failed' ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-sm capitalize">
                    {projects[0].status === 'completed' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                    ) : projects[0].status === 'crawling' ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Crawling
                      </span>
                    ) : projects[0].status === 'analyzing' ? (
                      <span className="text-amber-600 dark:text-amber-400">Analyzing</span>
                    ) : projects[0].status === 'failed' ? (
                      <span className="text-red-600 dark:text-red-400">Stopped</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Pages Crawled */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 hover:shadow-md transition-all ${projects[0].status === 'crawling' ? 'animate-pulse' : ''}`}>
                <div className="flex-shrink-0">
                  {projects[0].status === 'crawling' ? (
                    <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                  ) : (
                    <Globe className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Pages Crawled</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                      {projects[0].pages_crawled || 0}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      / {projects[0].total_pages || 0}
                    </span>
                    {projects[0].status === 'crawling' && (
                      <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                        <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                        Crawling...
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Pages Analyzed */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                      {(currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'analyzed').length}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      / {projects[0].pages_crawled || 0}
                    </span>
                  </div>

                </div>
              </div>

              {/* Total Images */}
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 hover:shadow-md transition-all cursor-pointer group ${(currentSession?.isCrawling || projects[0].status === 'crawling') ? 'animate-pulse' : ''}`}
                onClick={() => {
                  if (currentSession?.isCrawling || projects[0].status === 'crawling') return; // Disable during crawling
                  if (projects[0].all_image_analysis && projects[0].all_image_analysis.length > 0) {
                    dispatch(toggleImageAnalysis({ projectId: projects[0].id, show: !currentSession?.showImageAnalysis }));
                    dispatch(toggleLinksAnalysis({ projectId: projects[0].id, show: false })); // Hide links analysis when showing images
                  }
                }}
              >
                <div className="flex-shrink-0">
                  <Eye className="h-6 w-6 text-pink-500 group-hover:text-pink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Images</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                      {(currentSession?.isCrawling || projects[0].status === 'crawling') 
                        ? (currentSession?.liveImageCount || projects[0].all_image_analysis?.length || 0)
                        : (projects[0].all_image_analysis ? projects[0].all_image_analysis.length : 0)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      found
                    </span>
                  </div>
                  {projects[0].all_image_analysis && projects[0].all_image_analysis.length > 0 && !(currentSession?.isCrawling || projects[0].status === 'crawling') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentSession?.showImageAnalysis ? 'Click to hide' : 'Click to view details'}
                    </p>
                  )}
                  {(currentSession?.isCrawling || projects[0].status === 'crawling') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available after crawling completes
                    </p>
                  )}
                </div>
              </div>

              {/* Total Links */}
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 hover:shadow-md transition-all cursor-pointer group ${(currentSession?.isCrawling || projects[0].status === 'crawling') ? 'animate-pulse' : ''}`}
                onClick={() => {
                  if (currentSession?.isCrawling || projects[0].status === 'crawling') return; // Disable during crawling
                  if (projects[0].all_links_analysis && projects[0].all_links_analysis.length > 0) {
                    dispatch(toggleLinksAnalysis({ projectId: projects[0].id, show: !currentSession?.showLinksAnalysis }));
                    dispatch(toggleImageAnalysis({ projectId: projects[0].id, show: false })); // Hide image analysis when showing links
                  }
                }}
              >
                <div className="flex-shrink-0">
                  <ExternalLink className="h-6 w-6 text-orange-500 group-hover:text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Links</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                      {(currentSession?.isCrawling || projects[0].status === 'crawling') 
                        ? (currentSession?.liveLinkCount || projects[0].all_links_analysis?.length || 0)
                        : (projects[0].all_links_analysis ? projects[0].all_links_analysis.length : 0)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      found
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Internal:</span>
                      <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                        {(currentSession?.isCrawling || projects[0].status === 'crawling') 
                          ? (currentSession?.liveInternalLinks || projects[0].all_links_analysis?.filter(link => link.type === 'internal').length || 0)
                          : (projects[0].all_links_analysis ? 
                            projects[0].all_links_analysis.filter(link => link.type === 'internal').length : 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">External:</span>
                      <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                        {(currentSession?.isCrawling || projects[0].status === 'crawling') 
                          ? (currentSession?.liveExternalLinks || projects[0].all_links_analysis?.filter(link => link.type === 'external').length || 0)
                          : (projects[0].all_links_analysis ? 
                            projects[0].all_links_analysis.filter(link => link.type === 'external').length : 0)}
                      </span>
                    </div>
                  </div>
                  {projects[0].all_links_analysis && projects[0].all_links_analysis.length > 0 && !(currentSession?.isCrawling || projects[0].status === 'crawling') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentSession?.showLinksAnalysis ? 'Click to hide' : 'Click to view details'}
                    </p>
                  )}
                  {(currentSession?.isCrawling || projects[0].status === 'crawling') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available after crawling completes
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

   {projects[0].custom_urls_analysis && Array.isArray(projects[0].custom_urls_analysis) && projects[0].custom_urls_analysis.length > 0 &&  (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Custom URLs</CardTitle>
          <CardDescription>Tracked URLs and their presence in the crawl</CardDescription>
          <div className="mt-2 text-sm text-muted-foreground">
            {projects[0].custom_urls_analysis.filter(u => u.isPresent).length} / {projects[0].custom_urls_analysis.length} URLs found
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects[0].custom_urls_analysis.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.isPresent ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                      <CheckCircle className="h-4 w-4 mr-1 text-emerald-500" /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                      <XCircle className="h-4 w-4 mr-1 text-red-500" /> Missing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-blue-700 dark:text-blue-300" title={item.pageLink}>{item.pageLink}</span>
                  <button
                    className="ml-1 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                    title="Copy URL"
                    onClick={() => {
                      navigator.clipboard.writeText(item.pageLink);
                      toast('Copied URL!');
                    }}
                  >
                    <CodeSquare className="h-4 w-4 text-blue-400 group-hover:text-blue-600" />
                  </button>
                  <a href={item.pageLink} target="_blank" rel="noopener noreferrer" className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Open URL">
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
   {/* Image Analysis Section - Only show when clicked */}
   {currentSession?.showImageAnalysis && projects[0].all_image_analysis && Array.isArray(projects[0].all_image_analysis) && projects[0].all_image_analysis.length > 0 && (
     <div id="image-analysis-table" className="animate-in slide-in-from-top-2 duration-300">
       <ImageAnalysisTable images={projects[0].all_image_analysis} />
     </div>
   )}

  {/* Links Analysis Section - Only show when clicked */}
  {currentSession?.showLinksAnalysis && projects[0].all_links_analysis && Array.isArray(projects[0].all_links_analysis) && projects[0].all_links_analysis.length > 0 && (
    <div id="links-analysis-table" className="animate-in slide-in-from-top-2 duration-300">
      <LinksAnalysisTable links={projects[0].all_links_analysis} />
    </div>
  )}
      {/* Pages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pages</CardTitle>
              <CardDescription>
                {currentSession?.isCrawling ? "Pages are being crawled - analysis will be available when crawling completes" : "Select pages to analyze"}
              </CardDescription>
              {currentSession?.isCrawling && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Analysis buttons are disabled during crawling</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Kill Switch for stopping all analysis */}
              {analyzingPages.size > 0 && projects[0] && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => stopAllAnalysis()}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop All Analysis ({analyzingPages.size})
                </Button>
              )}
              
              {selectedPages.size > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPages(new Set())}
                    disabled={deleting || analyzing}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelectedPages}
                    disabled={analyzing || deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete {selectedPages.size} Pages
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (projects[0]) {
                        startAnalysis(projects[0].id, Array.from(selectedPages));
                      }
                    }}
                    disabled={analyzing || deleting || isAnalysisDisabled()}
                    title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        {selectedPages.size > 1 ? (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Batch Analyze {selectedPages.size} Pages
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                            Analyze {selectedPages.size} Page
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </>
              )}
              {selectedPages.size === 0 && filteredAndSortedPages.length > 0 && analyzingPages.size === 0 && (
                <>
                <Button
                  size="sm"
                    variant="outline"
                  onClick={() => {
                    // Only select pages that aren't being analyzed
                    const selectablePageIds = filteredAndSortedPages
                      .filter(p => !isPageAnalyzing(p))
                      .map(p => p.page.id);
                    setSelectedPages(new Set(selectablePageIds));
                  }}
                  disabled={isAnalysisDisabled()}
                  title={isAnalysisDisabled() ? "Selection disabled while crawling is in progress" : ""}
                >
                  Select All ({filteredAndSortedPages.filter(p => !isPageAnalyzing(p)).length})
                  </Button>
                  {filteredAndSortedPages.filter(p => p.resultCount === 0).length > 0 && projects[0] && (
                    <Button
                      size="sm"
                      onClick={() => {
                        // Analyze all unanalyzed pages
                        const unanalyzedPageIds = filteredAndSortedPages
                          .filter(p => p.resultCount === 0 && !isPageAnalyzing(p))
                          .map(p => p.page.id);
                        if (unanalyzedPageIds.length > 0) {
                          startAnalysis(projects[0].id, unanalyzedPageIds);
                        }
                      }}
                      disabled={analyzing || deleting || isAnalysisDisabled()}
                      title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze All Unanalyzed ({filteredAndSortedPages.filter(p => p.resultCount === 0 && !isPageAnalyzing(p)).length})
                </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search pages</Label>
              <Input
                id="search"
                placeholder="Search by title or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-primary/5 border-primary/20' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Analysis Status Filter */}
                  <div>
                    <Label className="text-sm font-medium">Analysis Status</Label>
                    <div className="mt-2 space-y-2">
                      {[
                        { id: 'analyzed', label: 'Analyzed', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'analyzed').length },
                        { id: 'not-analyzed', label: 'Not Analyzed', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'not-analyzed').length },
                        { id: 'analyzing', label: 'Analyzing', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'analyzing').length }
                      ].map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`analysis-${item.id}`}
                            checked={analysisFilter.includes(item.id)}
                            onCheckedChange={() => toggleAnalysisFilter(item.id)}
                          />
                          <Label htmlFor={`analysis-${item.id}`} className="text-sm">
                            {item.label} ({item.count})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="text-sm font-medium">Overall Status</Label>
                    <div className="mt-2 space-y-2">
                      {[
                                { id: 'pass', label: 'Good', color: 'text-emerald-600 dark:text-emerald-400', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => p.overallStatus === 'pass').length },
        { id: 'warning', label: 'Moderate', color: 'text-amber-600 dark:text-amber-400', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => p.overallStatus === 'warning').length },
        { id: 'fail', label: 'Poor', color: 'text-red-600 dark:text-red-400', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => p.overallStatus === 'fail').length }
                      ].map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${item.id}`}
                            checked={statusFilter.includes(item.id)}
                            onCheckedChange={() => toggleStatusFilter(item.id)}
                          />
                          <Label htmlFor={`status-${item.id}`} className={`text-sm ${item.color}`}>
                            {item.label} ({item.count})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score Range Filter */}
                  <div>
                    <Label className="text-sm font-medium">Score Range</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={scoreRange.min}
                          onChange={(e) => setScoreRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={scoreRange.max}
                          onChange={(e) => setScoreRange(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Filter pages by their overall score (0-100)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Counter */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {currentSession?.isCrawling ? (
                `Showing ${filteredAndSortedPages.length} of ${currentSession?.analyzedPages?.length || 0} crawled pages`
              ) : (
                `Showing ${filteredAndSortedPages.length} of ${currentSession?.analyzedPages?.length || 0} pages`
              )}
              {hasActiveFilters() && <span> (filtered)</span>}
            </p>
            {filteredAndSortedPages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'analyzed').length} analyzed • {' '}
                {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'analyzing').length} analyzing • {' '}
                {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'not-analyzed').length} pending
              </p>
            )}
          </div>

          {/* Pages Table */}
          {filteredAndSortedPages.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pages found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {projects[0]?.pages_crawled === 0 ? 
                  'Start crawling to discover pages' : 
                  'Pages will appear here after crawling'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-scroll">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="w-8 p-2">
                      <Checkbox
                        checked={
                          selectedPages.size > 0 && 
                          filteredAndSortedPages.filter(p => !isPageAnalyzing(p)).length > 0 && 
                          selectedPages.size === filteredAndSortedPages.filter(p => !isPageAnalyzing(p)).length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Only select pages that aren't being analyzed
                            const selectablePageIds = filteredAndSortedPages
                              .filter(p => !isPageAnalyzing(p))
                              .map(p => p.page.id);
                            setSelectedPages(new Set(selectablePageIds));
                          } else {
                            setSelectedPages(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="w-8 p-2 text-xs font-medium text-muted-foreground text-center">#</th>
                    <th 
                      className="p-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      Pages {getSortIcon('title')}
                    </th>
                    <th 
                      className="w-20 p-2 text-xs font-medium text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th 
                      className="w-[100px] p-2 text-xs font-medium text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('score')}
                    >
                      Score {getSortIcon('score')}
                    </th>
                    <th className="w-40 p-2 text-xs font-medium text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPages.map((analyzedPage, index) => (
                    <tr
                      key={`${analyzedPage.project.id}-${analyzedPage.page.id}`}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Don't trigger row selection if clicking on buttons or checkbox
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input[type="checkbox"]')) {
                          return;
                        }
                        const newSelected = new Set(selectedPages);
                        if (selectedPages.has(analyzedPage.page.id)) {
                          newSelected.delete(analyzedPage.page.id);
                        } else {
                          newSelected.add(analyzedPage.page.id);
                        }
                        setSelectedPages(newSelected);
                      }}
                    >
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedPages.has(analyzedPage.page.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedPages);
                            if (checked) {
                              newSelected.add(analyzedPage.page.id);
                            } else {
                              newSelected.delete(analyzedPage.page.id);
                            }
                            setSelectedPages(newSelected);
                          }}
                          disabled={isPageAnalyzing(analyzedPage) || deletingPages.has(analyzedPage.page.id)}
                        />
                      </td>
                      <td className="p-2 text-center text-xs text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="p-2 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-sm truncate">
                              {analyzedPage.page.title || 'Untitled'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {analyzedPage.page.url}
                          </p>
                          {isPageAnalyzing(analyzedPage) && (
                            <div className="flex items-center gap-1 mt-1">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {analyzingPages.size > 1 
                                  ? `Re-scraping & batch analyzing with AI (${analyzingPages.size} pages total)...` 
                                  : 'Re-scraping & analyzing with AI...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {isPageAnalyzing(analyzedPage) ? (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Analyzing
                          </Badge>
                        ) : analyzedPage.resultCount > 0 ? (
                          getStatusBadge(analyzedPage.overallStatus)
                        ) : currentSession?.isCrawling ? (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Crawled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {analyzedPage.resultCount > 0 && !isPageAnalyzing(analyzedPage) ? (
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-bold">{analyzedPage.overallScore}</span>
                            <span className="text-xs text-muted-foreground">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* Main action button */}
                          {deletingPages.has(analyzedPage.page.id) ? (
                            <Button size="sm" disabled className="h-7 px-3">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Deleting
                            </Button>
                          ) : isPageAnalyzing(analyzedPage) ? (
                            <Button size="sm" disabled className="h-7 px-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Analyzing
                            </Button>
                          ) : analyzedPage.resultCount > 0 ? (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-3 w-full"
                                onClick={() => router.push(`/audit/${analyzedPage.page.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 px-3 w-full"
                                onClick={() => analyzeSinglePage(analyzedPage.page.id)}
                                disabled={analyzing || deleting || isAnalysisDisabled()}
                                title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Re-Analyze
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full"
                              onClick={() => analyzeSinglePage(analyzedPage.page.id)}
                              disabled={analyzing || deleting || isAnalysisDisabled()}
                              title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Analyze
                            </Button>
                          )}
                          
                          {/* Delete button */}
                          {/* {deletingPages.has(analyzedPage.page.id) ? (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled>
                              <Loader2 className="h-3 w-3 animate-spin" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => deletePage(analyzedPage.page.id)}
                              disabled={isPageAnalyzing(analyzedPage) || deleting}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )} */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
</div>
  );
}