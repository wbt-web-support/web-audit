'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [analyzedPages, setAnalyzedPages] = useState<AnalyzedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [analyzingPages, setAnalyzingPages] = useState<Set<string>>(new Set());
  const [deletingPages, setDeletingPages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [analysisFilter, setAnalysisFilter] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 100 });
  const [sortField, setSortField] = useState<'title' | 'status' | 'score'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  const crawlingStartedRef = useRef(false);
  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);



  // Manual refresh function for user control
  const manualRefresh = async () => {
    setError('');
    setCurrentAction('Refreshing data...');
    await fetchData();
    setCurrentAction('');
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

  const fetchData = async () => {
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
        // Fetch analyzed pages from the selected project
        try {
          const resultsResponse = await fetch(`/api/audit-projects/${selectedProjectId}/results`);
            const resultsData = await resultsResponse.json();
            console.log("resultsData **********",resultsData)
            console.log("crawlingStartedRef **********",crawlingStartedRef)

            if(resultsData.project.status=="pending" && !crawlingStartedRef.current){
              crawlingStartedRef.current = true;
              console.log("projectResponse **********",projectResponse)
              startCrawling(projectData.project.id)
            }
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
            setAnalyzedPages(pages);
            
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
              
              // If no pages are analyzing anymore, clear the action
              if (newAnalyzing.size === 0 && prev.size > 0) {
                setCurrentAction('');
              }
              
              
              
              return newAnalyzing;
            });
          }
        } catch {
          // Project exists but no pages yet
          setAnalyzedPages([]);
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

  const startCrawling = async (projectId: string) => {
    setCrawling(true);
    setCurrentAction(`Starting crawl for project ${projectId}`);
    setError('');
toast("crawling is started");
    try {
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await response.json();
      fetchData();
      toast("crawling is end");
      if (!response.ok) {
        setError(data.error || 'Failed to start crawling');
      }
    } catch (error) {
      setError('Failed to start crawling');
    } finally {
      setCrawling(false);
      setCurrentAction('');
    }
  };

  const startAnalysis = async (projectId: string, pageIds: string[]) => {
    setAnalyzing(true);
    const isBatchAnalysis = pageIds.length > 1;
    setCurrentAction(
      isBatchAnalysis 
        ? `Starting batch analysis for ${pageIds.length} pages (maintaining 5 concurrent analyses)`
        : `Starting analysis for 1 page`
    );
    setError('');
    
    // Mark pages as analyzing
    setAnalyzingPages(new Set(pageIds));
    console.log("project id ",projectId)
    console.log("pageIds ",pageIds)
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
        setCurrentAction(
          isBatchAnalysis
            ? `Batch analyzing ${pageIds.length} pages with AI (processing in parallel for faster results)...`
            : `Analyzing page with AI...`
        );
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
    try {
      const response = await fetch(`/api/audit-projects/${projectId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to stop process');
      }
    } catch (error) {
      setError('Failed to stop process');
    }
  };

  const stopAllAnalysis = async () => {
    if (analyzingPages.size === 0) return;

    const analyzingPageIds = Array.from(analyzingPages);
    setCurrentAction(`Stopping analysis for ${analyzingPageIds.length} pages...`);
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
        setCurrentAction('All analysis processes stopped successfully');
      } else if (successCount > 0) {
        setCurrentAction(`Stopped ${successCount} of ${analyzingPageIds.length} analysis processes`);
        setError(`${analyzingPageIds.length - successCount} processes could not be stopped`);
      } else {
        setError('Failed to stop analysis processes');
      }
    } catch (error) {
      setError('Failed to stop analysis processes');
      console.error('Stop all analysis error:', error);
    }

    setTimeout(() => setCurrentAction(''), 3000);
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
        
        // Immediately remove page from local state
        setAnalyzedPages(prev => {
          const updated = prev.filter(p => p.page.id !== pageId);
          console.log('Updated pages after delete:', updated.length);
          return updated;
        });
        
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
        setCurrentAction('Page deleted successfully');
        setTimeout(() => setCurrentAction(''), 2000);
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
    setCurrentAction(`Deleting ${selectedPageIds.length} pages...`);
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

      // Update local state - remove successfully deleted pages
      const successfullyDeleted = selectedPageIds.filter(id => !failedPages.includes(id));
      
      setAnalyzedPages(prev => {
        const updated = prev.filter(p => !successfullyDeleted.includes(p.page.id));
        console.log(`Updated pages after bulk delete: ${updated.length} remaining`);
        return updated;
      });
      
      // Clear selected pages
      setSelectedPages(new Set());
      
      // Clear analyzing and deleting pages
      setAnalyzingPages(prev => {
        const newAnalyzing = new Set(prev);
        successfullyDeleted.forEach(id => newAnalyzing.delete(id));
        return newAnalyzing;
      });

      // Show result message
      if (deletedCount === selectedPageIds.length) {
        setCurrentAction(`Successfully deleted ${deletedCount} pages`);
        setTimeout(() => setCurrentAction(''), 3000);
      } else if (deletedCount > 0) {
        setCurrentAction(`Deleted ${deletedCount} of ${selectedPageIds.length} pages`);
        setError(`${failedPages.length} pages failed to delete`);
        setTimeout(() => setCurrentAction(''), 3000);
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
        return <XCircle className="h-4  text-red-500 dark:text-red-400 w-full" />;
      case 'pending':
        return <Clock className="h-4 text-muted-foreground w-full" />;
      default:
          return <AlertTriangle className="h-4  text-muted-foreground w-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'bg-emerald-500 dark:bg-emerald-600 text-white w-full text-center justify-center',
      warning: 'bg-amber-500 dark:bg-amber-600 text-white w-full text-center justify-center',
      fail: 'bg-red-500 dark:bg-red-600 text-white w-full text-center justify-center',
      pending: 'bg-muted text-muted-foreground w-full text-center justify-center '
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
        {status.toUpperCase()}
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

  const filteredAndSortedPages = analyzedPages.filter(page => {
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
  }).sort((a, b) => {
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

  const activeProjects = projects.filter(s => s.status === 'crawling' || s.status === 'analyzing');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze website pages and view detailed audit results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={loading || deleting || analyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/projects/edit/${projects[0].id}`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit Projects
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

      {currentAction && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">Process Running</p>
                <p className="text-sm text-muted-foreground">{currentAction}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Projects currently crawling or analyzing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{project.base_url}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {project.status} • Pages: {project.pages_crawled || 0} crawled, {project.pages_analyzed || 0} analyzed
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopProcess(project.id)}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
              ))}
            </div>
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
              <div className="flex items-center gap-2">
                {projects[0].status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => startCrawling(projects[0].id)}
                    disabled={crawling}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Crawl
                  </Button>
                )}
                {projects[0].status === 'completed' && (
                      <Button
                        size="sm"
                    onClick={() => startCrawling(projects[0].id)}
                        disabled={crawling}
                      >
                    <RefreshCw className={`h-4 w-4 transition-all ${crawling ? "animate-spin" : ""}`} />
                     {crawling?"Recrawling":"Recrawl"} 
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
                  </div>
                </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{projects[0].status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Crawled</p>
                <p className="font-medium">{projects[0].pages_crawled || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                <p className="font-medium">{analyzedPages.filter(p => getAnalysisStatus(p) === 'analyzed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pages</CardTitle>
              <CardDescription>Select pages to analyze</CardDescription>
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
                    disabled={analyzing || deleting}
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
                      disabled={analyzing || deleting}
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
                        { id: 'analyzed', label: 'Analyzed', count: analyzedPages.filter(p => getAnalysisStatus(p) === 'analyzed').length },
                        { id: 'not-analyzed', label: 'Not Analyzed', count: analyzedPages.filter(p => getAnalysisStatus(p) === 'not-analyzed').length },
                        { id: 'analyzing', label: 'Analyzing', count: analyzedPages.filter(p => getAnalysisStatus(p) === 'analyzing').length }
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
                                { id: 'pass', label: 'Pass', color: 'text-emerald-600 dark:text-emerald-400', count: analyzedPages.filter(p => p.overallStatus === 'pass').length },
        { id: 'warning', label: 'Warning', color: 'text-amber-600 dark:text-amber-400', count: analyzedPages.filter(p => p.overallStatus === 'warning').length },
        { id: 'fail', label: 'Fail', color: 'text-red-600 dark:text-red-400', count: analyzedPages.filter(p => p.overallStatus === 'fail').length }
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
              Showing {filteredAndSortedPages.length} of {analyzedPages.length} pages
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
            <div className=" overflow-hidden">
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
                      Page {getSortIcon('title')}
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
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full"
                              onClick={() => router.push(`/audit/${analyzedPage.page.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full"
                              onClick={() => analyzeSinglePage(analyzedPage.page.id)}
                              disabled={analyzing || deleting}
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Analyze
                            </Button>
                          )}
                          
                          {/* Delete button */}
                          {deletingPages.has(analyzedPage.page.id) ? (
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
                          )}
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
  );
} 