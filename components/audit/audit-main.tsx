'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { AuditSession, ScrapedPage } from '@/lib/types/database';
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
  X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AnalyzedPage {
  page: ScrapedPage;
  session: {
    id: string;
    base_url: string;
    status: string;
  };
  resultCount: number;
  overallScore: number;
  overallStatus: string;
}

export function AuditMain() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSessionId = searchParams.get('session');

  useEffect(() => {
    fetchData();
  }, [selectedSessionId]);

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

  const hasActiveFilters = () => {
    return searchTerm !== '' || 
           statusFilter.length > 0 || 
           analysisFilter.length > 0 || 
           scoreRange.min !== 0 || 
           scoreRange.max !== 100;
  };

  const fetchData = async () => {
    try {
      // If no session selected, redirect to sessions page
      if (!selectedSessionId) {
        router.push('/sessions');
        return;
      }

      // Fetch the selected session
      const sessionResponse = await fetch(`/api/audit-sessions/${selectedSessionId}`);
      const sessionData = await sessionResponse.json();
      
      if (sessionResponse.ok) {
        setSessions([sessionData.session]);
        
        // Fetch analyzed pages from the selected session
        try {
          const resultsResponse = await fetch(`/api/audit-sessions/${selectedSessionId}/results`);
          const resultsData = await resultsResponse.json();
          
          if (resultsResponse.ok && resultsData.pageResults) {
            const pages = resultsData.pageResults.map((pageResult: any) => {
              const results = pageResult.results;
              
              // Count how many analysis types have been completed
              const analysisTypes = ['grammar_analysis', 'content_analysis', 'seo_analysis', 'performance_analysis', 'accessibility_analysis', 'ui_quality_analysis', 'image_relevance_analysis', 'context_analysis'];
              const completedAnalyses = results ? analysisTypes.filter(type => results[type]).length : 0;
              
              return {
                page: pageResult.page,
                session: {
                  id: sessionData.session.id,
                  base_url: sessionData.session.base_url,
                  status: sessionData.session.status
                },
                resultCount: completedAnalyses,
                overallScore: results?.overall_score || 0,
                overallStatus: results?.overall_status || 'pending'
              };
            });
            setAnalyzedPages(pages);
            
            // Clear analyzing state for pages that are now analyzed
            setAnalyzingPages(prev => {
              const newAnalyzing = new Set(prev);
              pages.forEach((page: AnalyzedPage) => {
                if (page.resultCount > 0) {
                  newAnalyzing.delete(page.page.id);
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
          // Session exists but no pages yet
          setAnalyzedPages([]);
        }
      } else {
        setError(sessionData.error || 'Failed to fetch session');
      }
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const startCrawling = async (sessionId: string) => {
    setCrawling(true);
    setCurrentAction(`Starting crawl for session ${sessionId}`);
    setError('');

    try {
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();

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

  const startAnalysis = async (sessionId: string, pageIds: string[]) => {
    setAnalyzing(true);
    setCurrentAction(`Starting analysis for ${pageIds.length} pages`);
    setError('');
    
    // Mark pages as analyzing
    setAnalyzingPages(new Set(pageIds));

    try {
      const response = await fetch(`/api/audit-sessions/${sessionId}/analyze`, {
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
        setCurrentAction(`Analyzing ${pageIds.length} pages with AI...`);
        // Keep analyzing state until next data fetch shows completion
      }
    } catch (error) {
      setError('Failed to start analysis');
      setAnalyzingPages(new Set()); // Clear analyzing state on error
    } finally {
      setAnalyzing(false);
    }
  };

  const stopProcess = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/audit-sessions/${sessionId}/stop`, {
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
    if (!sessions[0]) return;

    setAnalyzingPages(prev => new Set(prev).add(pageId));
    setCurrentAction(`Analyzing single page...`);
    setError('');

    try {
      const response = await fetch(`/api/audit-sessions/${sessions[0].id}/analyze`, {
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
      } else {
        setCurrentAction(`Analyzing page with AI...`);
        // Keep analyzing state until next data fetch shows completion
      }
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
        return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'bg-emerald-500 dark:bg-emerald-600 text-white',
      warning: 'bg-amber-500 dark:bg-amber-600 text-white',
      fail: 'bg-red-500 dark:bg-red-600 text-white',
      pending: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const filteredPages = analyzedPages.filter(page => {
    const matchesSession = !selectedSessionId || page.session.id === selectedSessionId;
    const matchesSearch = searchTerm === '' || 
      page.page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter (Pass, Warning, Fail)
    const matchesStatus = statusFilter.length === 0 || 
      (page.resultCount > 0 && statusFilter.includes(page.overallStatus));
    
    // Analysis filter (Analyzed, Not Analyzed, Analyzing)
    const getAnalysisStatus = () => {
      if (analyzingPages.has(page.page.id)) return 'analyzing';
      return page.resultCount > 0 ? 'analyzed' : 'not-analyzed';
    };
    const matchesAnalysis = analysisFilter.length === 0 || 
      analysisFilter.includes(getAnalysisStatus());
    
    // Score range filter
    const matchesScore = page.resultCount === 0 || 
      (page.overallScore >= scoreRange.min && page.overallScore <= scoreRange.max);
    
    return matchesSession && matchesSearch && matchesStatus && matchesAnalysis && matchesScore;
  });

  const activeSessions = sessions.filter(s => s.status === 'crawling' || s.status === 'analyzing');

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
          <Link href="/sessions">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Sessions
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

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Sessions currently crawling or analyzing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.base_url}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {session.status} • Pages: {session.pages_crawled || 0} crawled, {session.pages_analyzed || 0} analyzed
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopProcess(session.id)}
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

      {/* Current Session Info */}
      {sessions.length > 0 && sessions[0] && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Session</CardTitle>
                <CardDescription>{sessions[0].base_url}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {sessions[0].status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => startCrawling(sessions[0].id)}
                    disabled={crawling}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Crawl
                  </Button>
                )}
                {sessions[0].status === 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => startCrawling(sessions[0].id)}
                    disabled={crawling}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recrawl
                  </Button>
                )}
                {sessions[0].status === 'crawling' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopProcess(sessions[0].id)}
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
                <p className="font-medium">{sessions[0].status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Crawled</p>
                <p className="font-medium">{sessions[0].pages_crawled || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                <p className="font-medium">{sessions[0].pages_analyzed || 0}</p>
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
                      if (sessions[0]) {
                        startAnalysis(sessions[0].id, Array.from(selectedPages));
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
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyze {selectedPages.size} Pages
                      </>
                    )}
                  </Button>
                </>
              )}
              {selectedPages.size === 0 && filteredPages.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const allPageIds = filteredPages.map(p => p.page.id);
                    setSelectedPages(new Set(allPageIds));
                  }}
                >
                  Select All
                </Button>
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
                        { id: 'analyzed', label: 'Analyzed', count: analyzedPages.filter(p => p.resultCount > 0 && !analyzingPages.has(p.page.id)).length },
                        { id: 'not-analyzed', label: 'Not Analyzed', count: analyzedPages.filter(p => p.resultCount === 0 && !analyzingPages.has(p.page.id)).length },
                        { id: 'analyzing', label: 'Analyzing', count: analyzedPages.filter(p => analyzingPages.has(p.page.id)).length }
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
              Showing {filteredPages.length} of {analyzedPages.length} pages
              {hasActiveFilters() && <span> (filtered)</span>}
            </p>
            {filteredPages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {filteredPages.filter(p => p.resultCount > 0).length} analyzed • {' '}
                {filteredPages.filter(p => analyzingPages.has(p.page.id)).length} analyzing • {' '}
                {filteredPages.filter(p => p.resultCount === 0 && !analyzingPages.has(p.page.id)).length} pending
              </p>
            )}
          </div>

          {/* Pages List */}
          {filteredPages.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pages found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {sessions[0]?.pages_crawled === 0 ? 
                  'Start crawling to discover pages' : 
                  'Pages will appear here after crawling'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPages.map((analyzedPage) => (
                <div
                  key={`${analyzedPage.session.id}-${analyzedPage.page.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
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
                      disabled={analyzingPages.has(analyzedPage.page.id) || deletingPages.has(analyzedPage.page.id)}
                    />
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {analyzedPage.page.title || 'Untitled'}
                        </p>
                        {analyzingPages.has(analyzedPage.page.id) ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <Badge variant="outline" className="text-xs">
                              Analyzing...
                            </Badge>
                          </div>
                        ) : (
                          analyzedPage.resultCount > 0 && getStatusBadge(analyzedPage.overallStatus)
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analyzedPage.page.url}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analyzingPages.has(analyzedPage.page.id) ? (
                          'Running AI analysis...'
                        ) : analyzedPage.resultCount > 0 ? (
                          <>
                            {analyzedPage.resultCount} checks • 
                            Score: {analyzedPage.overallScore}/100
                          </>
                        ) : (
                          'Not analyzed yet'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {analyzedPage.resultCount > 0 && !analyzingPages.has(analyzedPage.page.id) && (
                      <>
                        <div className="text-right mr-2">
                          <p className="text-lg font-bold">{analyzedPage.overallScore}</p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                        {getStatusIcon(analyzedPage.overallStatus)}
                      </>
                    )}
                    
                    {/* Show appropriate action button based on analysis status */}
                    {deletingPages.has(analyzedPage.page.id) ? (
                      <Button size="sm" disabled>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Deleting...
                      </Button>
                    ) : analyzingPages.has(analyzedPage.page.id) ? (
                      <Button size="sm" disabled>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </Button>
                    ) : analyzedPage.resultCount > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/audit/${analyzedPage.page.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => analyzeSinglePage(analyzedPage.page.id)}
                        disabled={analyzing || deleting}
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      disabled={deletingPages.has(analyzedPage.page.id)}
                    >
                      <a 
                        href={analyzedPage.page.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                    
                    {deletingPages.has(analyzedPage.page.id) ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePage(analyzedPage.page.id)}
                        disabled={analyzingPages.has(analyzedPage.page.id) || deleting}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 