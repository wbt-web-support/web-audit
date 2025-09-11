import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Globe, 
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
  BarChart3,
  Eye,
  RefreshCw,
  Square,
  AlertTriangle,
  Clock,
  Settings,
  Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuditProject } from '@/lib/types/database';
import { ReactElement, useState, useEffect } from 'react';

interface AnalyzedPage {
  page: any;
  project: {
    id: string;
    base_url: string;
    status: string;
  };
  resultCount: number;
  overallScore: number;
  overallStatus: string;
}

interface PagesTableProps {
  projects: AuditProject[];
  currentSession: any;
  analyzingPages: Set<string>;
  deletingPages: Set<string>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  statusFilter: string[];
  setStatusFilter: React.Dispatch<React.SetStateAction<string[]>>;
  analysisFilter: string[];
  setAnalysisFilter: React.Dispatch<React.SetStateAction<string[]>>;
  scoreRange: { min: number; max: number };
  setScoreRange: React.Dispatch<React.SetStateAction<{ min: number; max: number }>>;
  sortField: 'title' | 'status' | 'score';
  setSortField: (field: 'title' | 'status' | 'score') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  filteredAndSortedPages: AnalyzedPage[];
  isPageAnalyzing: (page: AnalyzedPage) => boolean;
  isAnalysisDisabled: () => boolean;
  onAnalyzeSinglePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  getStatusBadge: (status: string) => ReactElement;
  getAnalysisStatus: (page: AnalyzedPage) => string;
  onStopAnalysis?: (pageId: string) => void;
  onCustomAnalysis?: (pageId: string, customInstructions: string) => void;
}

// Progress indicator component for analyzing pages
const AnalysisProgress = ({ pageId }: { pageId: string }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Analyzing...</span>
    </div>
  );
};

export function PagesTable({
  projects,
  currentSession,
  analyzingPages,
  deletingPages,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  statusFilter,
  setStatusFilter,
  analysisFilter,
  setAnalysisFilter,
  scoreRange,
  setScoreRange,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  filteredAndSortedPages,
  isPageAnalyzing,
  isAnalysisDisabled,
  onAnalyzeSinglePage,
  onDeletePage,
  getStatusBadge,
  getAnalysisStatus,
  onStopAnalysis,
  onCustomAnalysis
}: PagesTableProps) {
  const router = useRouter();
  const [stoppingPages, setStoppingPages] = useState<Set<string>>(new Set());
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [customAnalyzingPages, setCustomAnalyzingPages] = useState<Set<string>>(new Set());

  // Utility functions
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

  // Check if a page analysis has timed out
  const isPageTimedOut = (analyzedPage: AnalyzedPage) => {
    return analyzedPage.page.error_message && 
           (analyzedPage.page.error_message.includes('timeout') || 
            analyzedPage.page.error_message.includes('Analysis timeout'));
  };

  // Check if a page analysis failed due to screenshot issues
  const isPageScreenshotFailed = (analyzedPage: AnalyzedPage) => {
    return analyzedPage.page.error_message && 
           (analyzedPage.page.error_message.includes('screenshot') ||
            analyzedPage.page.error_message.includes('Unable to get browser page'));
  };

  // Check if a page analysis was stopped by user
  const isPageStopped = (analyzedPage: AnalyzedPage) => {
    return analyzedPage.page.analysis_status === 'stopped' ||
           (analyzedPage.page.error_message && 
            analyzedPage.page.error_message.includes('stopped by user'));
  };

  // Handle stop analysis
  const handleStopAnalysis = async (pageId: string) => {
    if (!onStopAnalysis) return;
    
    setStoppingPages(prev => new Set(prev).add(pageId));
    
    try {
      await onStopAnalysis(pageId);
    } catch (error) {
      console.error('Error stopping analysis:', error);
    } finally {
      setStoppingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  };

  // Handle custom analysis
  const handleCustomAnalysis = async (pageId: string) => {
    if (!onCustomAnalysis || !customInstructions.trim()) return;
    
    setCustomAnalyzingPages(prev => new Set(prev).add(pageId));
    
    try {
      await onCustomAnalysis(pageId, customInstructions.trim());
    } catch (error) {
      console.error('Error running custom analysis:', error);
    } finally {
      setCustomAnalyzingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || 
           statusFilter.length > 0 || 
           analysisFilter.length > 0 || 
           scoreRange.min !== 0 || 
           scoreRange.max !== 100;
  };

  const isCrawling = currentSession?.isCrawling || projects[0]?.status === 'crawling';
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAndSortedPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPages = filteredAndSortedPages.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, analysisFilter, scoreRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pages</CardTitle>
            <CardDescription>
              {isCrawling ? "Pages are being crawled - analysis will be available when crawling completes" : "Select pages to analyze (max 2 minutes per page)"}
            </CardDescription>
            {isCrawling && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Analysis buttons are disabled during crawling</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInstructions(!showCustomInstructions)}
              className={showCustomInstructions ? 'bg-primary/5 border-primary/20' : ''}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Custom Analysis</span>
              <span className="sm:hidden">Custom</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
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
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
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
                  <span className="hidden sm:inline">Clear</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Custom Instructions Panel */}
          {showCustomInstructions && (
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Custom Analysis Instructions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomInstructions(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-instructions" className="text-sm">
                  Enter custom instructions for Gemini analysis
                </Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="e.g., Analyze the color scheme and accessibility of this page..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions will be sent to Gemini for custom analysis of selected pages.
                </p>
              </div>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Analysis Status Filter */}
                <div>
                  <Label className="text-sm font-medium">Analysis Status</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { id: 'analyzed', label: 'Analyzed', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'analyzed').length },
                      { id: 'not-analyzed', label: 'Not Analyzed', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'not-analyzed').length },
                      { id: 'analyzing', label: 'Analyzing', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => getAnalysisStatus(p) === 'analyzing').length },
                      { id: 'timeout', label: 'Timeout', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => isPageTimedOut(p)).length },
                      { id: 'stopped', label: 'Stopped', count: (currentSession?.analyzedPages || []).filter((p: AnalyzedPage) => isPageStopped(p)).length }
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
                        onChange={(e) => setScoreRange((prev: { min: number; max: number }) => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={scoreRange.max}
                        onChange={(e) => setScoreRange((prev: { min: number; max: number }) => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
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
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {isCrawling ? (
              `Showing ${currentPages.length} of ${filteredAndSortedPages.length} crawled pages (page ${currentPage} of ${totalPages})`
            ) : (
              `Showing ${currentPages.length} of ${filteredAndSortedPages.length} pages (page ${currentPage} of ${totalPages})`
            )}
            {hasActiveFilters() && <span> (filtered)</span>}
          </p>
          {filteredAndSortedPages.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'analyzed').length} analyzed • {' '}
              {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'analyzing').length} analyzing • {' '}
              {filteredAndSortedPages.filter(p => getAnalysisStatus(p) === 'not-analyzed').length} pending • {' '}
              {filteredAndSortedPages.filter(p => isPageTimedOut(p)).length} timeout • {' '}
              {filteredAndSortedPages.filter(p => isPageStopped(p)).length} stopped
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
                (isCrawling ? 'Pages are being crawled...' : 'Start crawling to discover pages') : 
                'Pages will appear here after crawling'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                  
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
                    <th className="w-20 p-2 text-xs font-medium text-muted-foreground text-center">Status Code</th>
                    <th className="w-40 p-2 text-xs font-medium text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPages.map((analyzedPage, index) => (
                  <tr
                    key={`${analyzedPage.project.id}-${analyzedPage.page.id}`}
                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    
                                         <td className="p-2 text-center text-xs text-muted-foreground">
                       {startIndex + index + 1}
                     </td>
                    <td className="p-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium text-sm truncate">
                            {analyzedPage.page.title || 'Untitled'}
                          </p>
                        </div>
                        <a 
                          href={analyzedPage.page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground truncate mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                        >
                          {analyzedPage.page.url.length > 50 
                            ? `${analyzedPage.page.url.substring(0, 50)}...` 
                            : analyzedPage.page.url}
                        </a>
                        {isPageAnalyzing(analyzedPage) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {analyzingPages.size > 1 
                                ? `Analyzing with AI (${analyzingPages.size} pages total)...` 
                                : 'Analyzing with AI (2 min timeout)...'}
                            </span>
                          </div>
                        )}
                        {isPageTimedOut(analyzedPage) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              Analysis timed out after 2 minutes
                            </span>
                          </div>
                        )}
                        {isPageScreenshotFailed(analyzedPage) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              Screenshot generation failed - analysis completed with HTML-only fallback
                            </span>
                          </div>
                        )}
                        {isPageStopped(analyzedPage) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Square className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              Analysis was stopped by user
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {isPageAnalyzing(analyzedPage) ? (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          <span className="hidden sm:inline">Analyzing</span>
                          <span className="sm:hidden">...</span>
                        </Badge>
                      ) : isPageTimedOut(analyzedPage) ? (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Timeout</span>
                          <span className="sm:hidden">TO</span>
                        </Badge>
                      ) : isPageScreenshotFailed(analyzedPage) ? (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">HTML-Only</span>
                          <span className="sm:hidden">HTML</span>
                        </Badge>
                      ) : isPageStopped(analyzedPage) ? (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                          <Square className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Stopped</span>
                          <span className="sm:hidden">Stop</span>
                        </Badge>
                      ) : analyzedPage.resultCount > 0 ? (
                        getStatusBadge(analyzedPage.overallStatus)
                      ) : isCrawling ? (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          <span className="hidden sm:inline">Crawled</span>
                          <span className="sm:hidden">Crawl</span>
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
                    <td className="p-2 text-center">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        analyzedPage.page.status_code >= 200 && analyzedPage.page.status_code < 300 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : analyzedPage.page.status_code >= 400 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {analyzedPage.page.status_code || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                        {deletingPages.has(analyzedPage.page.id) ? (
                          <Button size="sm" disabled className="h-7 px-3 w-full sm:w-auto">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            <span className="hidden sm:inline">Deleting</span>
                            <span className="sm:hidden">Del</span>
                          </Button>
                        ) : isPageAnalyzing(analyzedPage) ? (
                          <>
                            <Button 
                              size="sm" 
                              className="h-7 px-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 w-full sm:w-auto"
                              onClick={() => handleStopAnalysis(analyzedPage.page.id)}
                              disabled={stoppingPages.has(analyzedPage.page.id)}
                            >
                              {stoppingPages.has(analyzedPage.page.id) ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  <span className="hidden sm:inline">Stopping...</span>
                                  <span className="sm:hidden">Stop...</span>
                                </>
                              ) : (
                                <>
                                  <Square className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Stop</span>
                                  <span className="sm:hidden">Stop</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full sm:w-auto"
                              onClick={() => router.push(`/audit/${analyzedPage.page.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">View</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          </>
                        ) : isPageTimedOut(analyzedPage) ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 w-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
                            onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                            disabled={isAnalysisDisabled()}
                            title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Retry analysis after timeout"}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Retry</span>
                            <span className="sm:hidden">Retry</span>
                          </Button>
                        ) : isPageScreenshotFailed(analyzedPage) ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 w-full sm:w-auto"
                            onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                            disabled={isAnalysisDisabled()}
                            title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Retry analysis (screenshot generation failed)"}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Retry</span>
                            <span className="sm:hidden">Retry</span>
                          </Button>
                        ) : isPageStopped(analyzedPage) ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 w-full sm:w-auto"
                            onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                            disabled={isAnalysisDisabled()}
                            title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Analyze this page"}
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Analyze</span>
                            <span className="sm:hidden">Analyze</span>
                          </Button>
                        ) : analyzedPage.resultCount > 0 ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full sm:w-auto"
                              onClick={() => router.push(`/audit/${analyzedPage.page.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">View</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full sm:w-auto"
                              onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                              disabled={isAnalysisDisabled()}
                              title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Recrawl and re-analyze this page"}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Recrawl</span>
                              <span className="sm:hidden">Recrawl</span>
                            </Button>
                            {customInstructions.trim() && onCustomAnalysis && (
                              <Button
                                size="sm"
                                className="h-7 px-3 w-full sm:w-auto bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                                onClick={() => handleCustomAnalysis(analyzedPage.page.id)}
                                disabled={customAnalyzingPages.has(analyzedPage.page.id) || isAnalysisDisabled()}
                                title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Run custom analysis with Gemini"}
                              >
                                {customAnalyzingPages.has(analyzedPage.page.id) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    <span className="hidden sm:inline">Analyzing...</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Custom</span>
                                    <span className="sm:hidden">Custom</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                            <Button
                              size="sm"
                              className="h-7 px-3 w-full sm:w-auto"
                              onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                              disabled={isAnalysisDisabled()}
                              title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Analyze</span>
                              <span className="sm:hidden">Analyze</span>
                            </Button>
                            {customInstructions.trim() && onCustomAnalysis && (
                              <Button
                                size="sm"
                                className="h-7 px-3 w-full sm:w-auto bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                                onClick={() => handleCustomAnalysis(analyzedPage.page.id)}
                                disabled={customAnalyzingPages.has(analyzedPage.page.id) || isAnalysisDisabled()}
                                title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : "Run custom analysis with Gemini"}
                              >
                                {customAnalyzingPages.has(analyzedPage.page.id) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    <span className="hidden sm:inline">Analyzing...</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Custom</span>
                                    <span className="sm:hidden">Custom</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                                     </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           {/* Pagination Controls */}
           {totalPages > 1 && (
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div className="text-sm text-muted-foreground text-center sm:text-left">
                 Page {currentPage} of {totalPages}
               </div>
               <div className="flex items-center justify-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                   disabled={currentPage === 1}
                 >
                   Previous
                 </Button>
                 <div className="flex items-center gap-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     const pageNum = i + 1;
                     if (totalPages <= 5) {
                       return (
                         <Button
                           key={pageNum}
                           variant={currentPage === pageNum ? "default" : "outline"}
                           size="sm"
                           onClick={() => setCurrentPage(pageNum)}
                           className="w-8 h-8 p-0"
                         >
                           {pageNum}
                         </Button>
                       );
                     }
                     
                     // Show first page, last page, current page, and neighbors
                     if (pageNum === 1 || pageNum === totalPages || 
                         (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                       return (
                         <Button
                           key={pageNum}
                           variant={currentPage === pageNum ? "default" : "outline"}
                           size="sm"
                           onClick={() => setCurrentPage(pageNum)}
                           className="w-8 h-8 p-0"
                         >
                           {pageNum}
                         </Button>
                       );
                     }
                     
                     // Show ellipsis
                     if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                       return <span key={pageNum} className="px-2 text-muted-foreground">...</span>;
                     }
                     
                     return null;
                   })}
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                   disabled={currentPage === totalPages}
                 >
                   Next
                 </Button>
               </div>
             </div>
           )}
         </div>
       )}
     </CardContent>
   </Card>
 );
}
