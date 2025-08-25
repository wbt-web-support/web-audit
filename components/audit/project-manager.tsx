'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AuditProject } from '@/lib/types/database';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Globe, 
  Calendar,
  Play,
  BarChart3,
  Edit,
  ExternalLink,
  Link,
  Image,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Activity,
  Layers,
  Target,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Filter,
  Wifi
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectManagerSkeleton } from '@/components/skeletons';
import { BackButton } from '@/components/ui/back-button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProjectMetrics {
  totalPages: number;
  pagesCrawled: number;
  pagesAnalyzed: number;
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  totalImages: number;
  smallImages: number;
  largeImages: number;
  topFormats: [string, number][];
}

interface CrawlingProgress {
  pages_crawled: number;
  total_pages: number;
  total_images: number;
  total_links: number;
  internal_links: number;
  external_links: number;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    badgeClass: 'bg-slate-100 text-slate-700',
    colorClass: 'text-slate-500'
  },
  crawling: {
    icon: Activity,
    badgeClass: 'bg-blue-100 text-blue-700',
    colorClass: 'text-blue-500'
  },
  completed: {
    icon: CheckCircle,
    badgeClass: 'bg-emerald-100 text-emerald-700',
    colorClass: 'text-emerald-500'
  },
  analyzing: {
    icon: Zap,
    badgeClass: 'bg-amber-100 text-amber-700',
    colorClass: 'text-amber-500'
  },
  analyzed: {
    icon: Sparkles,
    badgeClass: 'bg-purple-100 text-purple-700',
    colorClass: 'text-purple-500'
  },
  error: {
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-700',
    colorClass: 'text-red-500'
  }
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status configuration for a given status
 */
const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
};

/**
 * Check if project is currently running (crawling or analyzing)
 */
const isProjectRunning = (status: string): boolean => {
  return status === 'crawling' || status === 'analyzing';
};

/**
 * Calculate project metrics from analysis data
 */
const calculateProjectMetrics = (project: AuditProject): ProjectMetrics => {
  // Use actual page counts from the project data
  const totalPages = project.total_pages || 0;
  const pagesCrawled = project.pages_crawled || 0;
  const pagesAnalyzed = project.pages_analyzed || 0;
  
  // Calculate link metrics from analysis data
  const totalLinks = project.all_links_analysis?.length || 0;
  const internalLinks = project.all_links_analysis?.filter(link => link.type === 'internal').length || 0;
  const externalLinks = project.all_links_analysis?.filter(link => link.type === 'external').length || 0;
  const totalImages = project.all_image_analysis?.length || 0;
  
  // Categorize images by size (small < 500kb)
  const smallImages = project.all_image_analysis?.filter(img => {
    const sizeInBytes = img.size || 0;
    return sizeInBytes < 500 * 1024; // Less than 500KB
  }).length || 0;
  const largeImages = totalImages - smallImages;

  // Calculate image format breakdowns
  const imageFormats = project.all_image_analysis?.reduce((acc, img) => {
    let format = img.format?.toLowerCase() || 'unknown';
    
    // Handle data URLs and various image formats
    if (format.startsWith('data:')) {
      if (format.includes('image/svg+xml')) format = 'svg';
      else if (format.includes('image/jpeg') || format.includes('image/jpg')) format = 'jpg';
      else if (format.includes('image/png')) format = 'png';
      else if (format.includes('image/webp')) format = 'webp';
      else if (format.includes('image/gif')) format = 'gif';
      else if (format.includes('image/bmp')) format = 'bmp';
      else if (format.includes('image/tiff') || format.includes('image/tif')) format = 'tiff';
      else format = 'data-url';
    }
    
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get top formats (limit to 3 most common)
  const topFormats = Object.entries(imageFormats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return {
    totalPages,
    pagesCrawled,
    pagesAnalyzed,
    totalLinks,
    internalLinks,
    externalLinks,
    totalImages,
    smallImages,
    largeImages,
    topFormats
  };
};

/**
 * Filter projects based on search query
 */
const filterProjects = (projects: AuditProject[], searchQuery: string): AuditProject[] => {
  if (searchQuery.trim() === '') return projects;
  
  const query = searchQuery.toLowerCase();
  return projects.filter(project => 
    project.base_url.toLowerCase().includes(query) ||
    project.status.toLowerCase().includes(query) ||
    (project.company_name && project.company_name.toLowerCase().includes(query))
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Status badge component with icon and styling
 */
const StatusBadge = React.memo(({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Badge className={`flex items-center gap-1 ${config.badgeClass}`}>
      <IconComponent className="h-3 w-3" />
      {status.toUpperCase()}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

/**
 * Real-time crawling progress indicator
 */
const CrawlingProgressIndicator = React.memo(({ 
  project, 
  liveProgress 
}: { 
  project: AuditProject; 
  liveProgress?: CrawlingProgress;
}) => {
  const isCrawling = project.status === 'crawling';
  
  // Calculate current progress from project data or use live progress
  const currentProgress = liveProgress || {
    pages_crawled: project.pages_crawled || 0,
    total_pages: project.total_pages || 0,
    total_images: project.all_image_analysis?.length || 0,
    total_links: project.all_links_analysis?.length || 0,
    internal_links: project.all_links_analysis?.filter(link => link.type === 'internal').length || 0,
    external_links: project.all_links_analysis?.filter(link => link.type === 'external').length || 0
  };

  if (!isCrawling) return null;

  const progressPercentage = currentProgress.total_pages > 0 
    ? Math.round((currentProgress.pages_crawled / currentProgress.total_pages) * 100)
    : 0;

  return (
  <></>
  );
});

CrawlingProgressIndicator.displayName = 'CrawlingProgressIndicator';

/**
 * Search input component with clear functionality
 */
const SearchInput = React.memo(({ 
  searchQuery, 
  onSearchChange, 
  onClear 
}: { 
  searchQuery: string; 
  onSearchChange: (value: string) => void; 
  onClear: () => void; 
}) => {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        placeholder="Search projects by URL, status, or company..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 bg-white border-slate-200 focus:ring-blue-500"
      />
      {searchQuery && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

/**
 * Error message component
 */
const ErrorMessage = React.memo(({ error }: { error: string }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-3 text-red-700">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

/**
 * Empty state component when no projects exist or match search
 */
const EmptyState = React.memo(({ 
  hasProjects, 
  searchQuery, 
  onCreateProject 
}: { 
  hasProjects: boolean; 
  searchQuery: string; 
  onCreateProject: () => void; 
}) => {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="pt-12 pb-12">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <Globe className="h-12 w-12 text-slate-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">
              {hasProjects ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-slate-600">
              {hasProjects 
                ? `No projects match "${searchQuery}". Try adjusting your search terms.`
                : 'Create your first project to start analyzing websites'
              }
            </p>
          </div>
          <Button 
            onClick={onCreateProject}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Individual project card component - Optimized with memoization
 */
const ProjectCard = React.memo(({ 
  project, 
  onDelete, 
  onViewDetails, 
  onEdit,
  calculateMetrics,
  liveProgress
}: { 
  project: AuditProject; 
  onDelete: () => void; 
  onViewDetails: () => void; 
  onEdit: () => void;
  calculateMetrics: (project: AuditProject) => ProjectMetrics;
  liveProgress?: CrawlingProgress;
}) => {
  const metrics = calculateMetrics(project);
  const isRunning = isProjectRunning(project.status);

  return (
    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left side: Icon, URL, Status, Dates */}
          <div className="flex items-start gap-4 flex-1">
            {/* Project Icon */}
            <div className="p-3 bg-slate-100 rounded-lg flex-shrink-0">
              <Globe className="h-6 w-6 text-slate-700" />
            </div>
            
            {/* Project Details */}
            <div className="flex-1 min-w-0">
              {/* URL and Status */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-slate-900 break-all">
                  {project.base_url}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              
              {/* Dates and Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {isRunning ? (
                      <span className="text-slate-500">
                        <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-pulse mr-2"></span>
                        Processing...
                      </span>
                    ) : (
                      `${metrics.pagesCrawled} pages crawled • ${metrics.pagesAnalyzed} analyzed`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isRunning}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(project.base_url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Real-time Crawling Progress */}
        <CrawlingProgressIndicator project={project} liveProgress={liveProgress} />
      </CardContent>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Project Manager - Main component for managing audit projects
 * 
 * Features:
 * - Display all projects with search functionality
 * - Project status tracking and management
 * - Clean, simple project cards matching the reference design
 * - Project actions (view, edit, delete)
 * - Consistent theme with the dashboard
 * - Optimized for performance with virtual scrolling and memoization
 */
export function ProjectManager() {
  // Constants
  const CACHE_DURATION = 30 * 1000; // Cache duration: 30 seconds to avoid unnecessary refetches
  const POLLING_INTERVAL = 5 * 1000; // Polling interval: 5 seconds for real-time updates
  
  // State management
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AuditProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Real-time crawling progress state
  const [liveProgress, setLiveProgress] = useState<Record<string, CrawlingProgress>>({});
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<Date | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(5000);
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // MEMOIZED UTILITY FUNCTIONS (inside component where hooks can be called)
  // ============================================================================

  /**
   * Memoized version of calculateProjectMetrics for performance
   */
  const memoizedCalculateProjectMetrics = useCallback((project: AuditProject): ProjectMetrics => {
    return calculateProjectMetrics(project);
  }, []);

  /**
   * Memoized version of filterProjects for performance
   */
  const memoizedFilterProjects = useCallback((projects: AuditProject[], searchQuery: string): AuditProject[] => {
    return filterProjects(projects, searchQuery);
  }, []);

  // ============================================================================
  // EFFECTS & EVENT HANDLERS
  // ============================================================================

  // Check for URL error parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'project-not-found') {
      setError('Project not found or you do not have permission to access it.');
      router.replace('/projects', undefined);
    }
  }, [router]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects when search query or projects change - Memoized for performance
  useEffect(() => {
    const filtered = memoizedFilterProjects(projects, searchQuery);
    setFilteredProjects(filtered);
  }, [projects, searchQuery, memoizedFilterProjects]);

  // Start/stop real-time polling for crawling projects
  useEffect(() => {
    const hasCrawlingProjects = projects.some(project => project.status === 'crawling');
    
    if (hasCrawlingProjects) {
      // Start polling
      const interval = setInterval(fetchLiveProgress, POLLING_INTERVAL);
      setPollingInterval(interval);
      
      // Initial fetch
      fetchLiveProgress();
      
      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    } else {
      // Stop polling if no crawling projects
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      // Clear live progress data
      setLiveProgress({});
    }
  }, [projects]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Countdown effect for next update
  useEffect(() => {
    if (!pollingInterval) return;
    
    const countdownInterval = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1000) {
          return POLLING_INTERVAL;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [pollingInterval]);

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  /**
   * Fetch live progress for crawling projects
   */
  const fetchLiveProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/audit-projects/background-status');
      if (response.ok) {
        const data = await response.json();
        const progressMap: Record<string, CrawlingProgress> = {};
        
        data.crawlingProjects?.forEach((project: any) => {
          progressMap[project.id] = project.crawl_progress;
        });
        
        setLiveProgress(progressMap);
        setLastProgressUpdate(new Date());
      } else {
        console.warn('Failed to fetch live progress:', response.status);
      }
    } catch (error) {
      // Silently fail for live progress updates - don't show errors to user
      console.warn('Failed to fetch live progress:', error);
      
      // If we get multiple errors, stop polling to avoid spam
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        setLiveProgress({});
        setLastProgressUpdate(null);
      }
    }
  }, [pollingInterval]);

  /**
   * Fetch all projects from the API with caching
   */
  const fetchProjects = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check if we have cached data and it's still valid
    if (!forceRefresh && projects.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/audit-projects', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=30',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setLastFetchTime(now);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      // Don't set error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [projects.length, lastFetchTime]);

  /**
   * Delete a project with confirmation
   */
  const deleteProject = useCallback(async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will remove all crawled data and analysis results.')) {
      return;
    }

    try {
      const response = await fetch(`/api/audit-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects(true); // Force refresh after delete
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete project');
      }
    } catch (error) {
      setError('Failed to delete project');
    }
  }, [fetchProjects]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSearchChange = useCallback((value: string) => setSearchQuery(value), []);
  const handleSearchClear = useCallback(() => setSearchQuery(''), []);
  const handleCreateProject = useCallback(() => router.push('/dashboard'), [router]);
  
  const handleViewDetails = useCallback((projectId: string) => {
    router.push(`/audit?project=${projectId}`);
  }, [router]);

  const handleEditProject = useCallback((projectId: string) => {
    router.push(`/projects/edit/${projectId}`);
  }, [router]);

  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
  }, [deleteProject]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show skeleton while loading OR if we haven't fetched data yet
  if (loading || projects.length === 0 && lastFetchTime === 0) {
    return <ProjectManagerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href="/dashboard" id="project-manager-back">
            ← Back to Dashboard
          </BackButton>
        </div>
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <Globe className="h-8 w-8 text-slate-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Project Dashboard
                </h1>
                <p className="mt-1 text-slate-600 text-lg">
                  Monitor and manage your website audit projects with comprehensive analytics and insights
                </p>
                {/* Real-time status indicator */}
                {Object.keys(liveProgress).length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full">
                      <Wifi className="h-3 w-3 text-blue-600 animate-pulse" />
                      <span className="text-sm text-blue-700 font-medium">
                        Live Updates Active • {Object.keys(liveProgress).length} project{Object.keys(liveProgress).length > 1 ? 's' : ''} crawling
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Last updated: {lastProgressUpdate ? lastProgressUpdate.toLocaleTimeString() : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Next update in: {Math.ceil(nextUpdateIn / 1000)}s
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleCreateProject}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <SearchInput 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onClear={handleSearchClear}
            />
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fetchProjects(true)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <div className="text-sm text-slate-500 w-full sm:w-auto text-center sm:text-left">
              {filteredProjects.length} of {projects.length} projects
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorMessage error={error} />}

        {/* Projects List */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <EmptyState 
              hasProjects={false}
              searchQuery=""
              onCreateProject={handleCreateProject}
            />
          ) : filteredProjects.length === 0 && searchQuery ? (
            <EmptyState 
              hasProjects={true}
              searchQuery={searchQuery}
              onCreateProject={handleCreateProject}
            />
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={() => handleDeleteProject(project.id)}
                  onViewDetails={() => handleViewDetails(project.id)}
                  onEdit={() => handleEditProject(project.id)}
                  calculateMetrics={memoizedCalculateProjectMetrics}
                  liveProgress={liveProgress[project.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 