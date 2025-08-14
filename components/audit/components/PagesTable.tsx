import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Clock
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
  selectedPages: Set<string>;
  setSelectedPages: (pages: Set<string>) => void;
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
  onDeleteSelectedPages: () => void;
  getStatusBadge: (status: string) => ReactElement;
  getAnalysisStatus: (page: AnalyzedPage) => string;
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
  selectedPages,
  setSelectedPages,
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
  onDeleteSelectedPages,
  getStatusBadge,
  getAnalysisStatus
}: PagesTableProps) {
  const router = useRouter();

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
              {isCrawling ? "Pages are being crawled - analysis will be available when crawling completes" : "Select pages to analyze"}
            </CardDescription>
            {isCrawling && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Analysis buttons are disabled during crawling</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">

            
            {selectedPages.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPages(new Set())}
                >
                  Clear Selection
                </Button>
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
        <div className="mb-4 flex items-center justify-between">
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
                (isCrawling ? 'Pages are being crawled...' : 'Start crawling to discover pages') : 
                'Pages will appear here after crawling'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-scroll">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="w-8 p-2">
                      <Checkbox
                        checked={
                          selectedPages.size > 0 && 
                          currentPages.filter(p => !isPageAnalyzing(p)).length > 0 && 
                          selectedPages.size === currentPages.filter(p => !isPageAnalyzing(p)).length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const selectablePageIds = currentPages
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
                    <th className="w-20 p-2 text-xs font-medium text-muted-foreground text-center">Status Code</th>
                    <th className="w-40 p-2 text-xs font-medium text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPages.map((analyzedPage, index) => (
                  <tr
                    key={`${analyzedPage.project.id}-${analyzedPage.page.id}`}
                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={(e) => {
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
                          className="text-xs text-muted-foreground truncate mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                      ) : isCrawling ? (
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
                      <div className="flex items-center justify-center gap-1">
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
                              onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                              disabled={isAnalysisDisabled()}
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
                            onClick={() => onAnalyzeSinglePage(analyzedPage.page.id)}
                            disabled={isAnalysisDisabled()}
                            title={isAnalysisDisabled() ? "Analysis disabled while crawling is in progress" : ""}
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Analyze
                          </Button>
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
             <div className="flex items-center justify-between">
               <div className="text-sm text-muted-foreground">
                 Page {currentPage} of {totalPages}
               </div>
               <div className="flex items-center gap-2">
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
