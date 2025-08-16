'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Activity,
  Layers,
  Target,
  ArrowRight,
  Sparkles,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectManagerSkeleton } from '@/components/skeletons';
import { BackButton } from '@/components/ui/back-button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProjectMetrics {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  totalImages: number;
  smallImages: number;
  largeImages: number;
  topFormats: [string, number][];
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    colorClass: 'text-slate-500'
  },
  crawling: {
    icon: Activity,
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    colorClass: 'text-blue-500'
  },
  completed: {
    icon: CheckCircle,
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    colorClass: 'text-emerald-500'
  },
  analyzing: {
    icon: Zap,
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    colorClass: 'text-amber-500'
  },
  analyzed: {
    icon: Sparkles,
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    colorClass: 'text-purple-500'
  },
  error: {
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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
function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Badge className={`flex items-center gap-1 ${config.badgeClass}`}>
      <IconComponent className="h-3 w-3" />
      {status.toUpperCase()}
    </Badge>
  );
}

/**
 * Search input component with clear functionality
 */
function SearchInput({ 
  searchQuery, 
  onSearchChange, 
  onClear 
}: { 
  searchQuery: string; 
  onSearchChange: (value: string) => void; 
  onClear: () => void; 
}) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        placeholder="Search projects by URL, status, or company..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
      />
      {searchQuery && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Error message component
 */
function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
      <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    </div>
  );
}

/**
 * Empty state component when no projects exist or match search
 */
function EmptyState({ 
  hasProjects, 
  searchQuery, 
  onCreateProject 
}: { 
  hasProjects: boolean; 
  searchQuery: string; 
  onCreateProject: () => void; 
}) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardContent className="pt-12 pb-12">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mx-auto flex items-center justify-center">
              <Globe className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {hasProjects ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {hasProjects 
                ? `No projects match "${searchQuery}". Try adjusting your search terms.`
                : 'Create your first project to start analyzing websites'
              }
            </p>
          </div>
          <Button 
            onClick={onCreateProject}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Project metrics display component - Mobile optimized with cards
 */
function ProjectMetrics({ metrics }: { metrics: ProjectMetrics }) {
  return (
    <div className="space-y-3">
      {/* Main metrics row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pages</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {metrics.totalLinks}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-500">Crawled</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Images</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {metrics.totalImages}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-500">Analyzed</p>
        </div>
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Links</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {metrics.totalLinks}
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-500 space-y-1">
            <div>Int: {metrics.internalLinks}</div>
            <div>Ext: {metrics.externalLinks}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Size</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {metrics.smallImages}
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-500 space-y-1">
            <div>Small: {metrics.smallImages}</div>
            <div>Large: {metrics.largeImages}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Company information display component - Mobile optimized
 */
function CompanyInfo({ project }: { project: AuditProject }) {
  const hasCompanyInfo = project.company_name || project.phone_number || 
                        project.email || project.address || project.custom_info;

  if (!hasCompanyInfo) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl p-4">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        Company Information
      </h4>
      <div className="space-y-3">
        {project.company_name && (
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Company</div>
              <div className="font-medium text-slate-900 dark:text-white break-all">{project.company_name}</div>
            </div>
          </div>
        )}
        {project.phone_number && (
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Phone</div>
              <div className="font-medium text-slate-900 dark:text-white break-all">{project.phone_number}</div>
            </div>
          </div>
        )}
        {project.email && (
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Email</div>
              <div className="font-medium text-slate-900 dark:text-white break-all">{project.email}</div>
            </div>
          </div>
        )}
        {project.address && (
          <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Address</div>
              <div className="font-medium text-slate-900 dark:text-white break-all">{project.address}</div>
            </div>
          </div>
        )}
        {project.custom_info && (
          <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Additional Info</div>
              <div className="font-medium text-slate-900 dark:text-white break-all">{project.custom_info}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual project card component - Mobile-first design with responsive layout
 */
function ProjectCard({ 
  project, 
  isExpanded, 
  onToggleExpanded, 
  onDelete, 
  onViewDetails, 
  onEdit 
}: { 
  project: AuditProject; 
  isExpanded: boolean; 
  onToggleExpanded: () => void; 
  onDelete: () => void; 
  onViewDetails: () => void; 
  onEdit: () => void; 
}) {
  const metrics = calculateProjectMetrics(project);
  const isRunning = isProjectRunning(project.status);

  return (
    <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 hover:shadow-xl transition-all duration-300 group overflow-hidden">
      {/* Mobile Layout - Card Style */}
      <div className="block lg:hidden">
        <div className="p-4 sm:p-6">
          {/* Project header with icon and status */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex-shrink-0">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-all">
                  {project.base_url}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 flex-1 sm:flex-none"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={isRunning}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/30 flex-1 sm:flex-none"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleExpanded}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Row Style */}
      <div className="hidden lg:block">
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* Left side: URL, Date, Status in column */}
            <div className="flex flex-col gap-3 flex-1">
              {/* URL */}
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-all">
                  {project.base_url}
                </h3>
              </div>

              {/* Dates and Status Row */}
              <div className="flex items-center gap-6">
                {/* Created Date */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>

                {/* Updated Date */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </div>

            {/* Right side: Actions in row */}
            <div className="flex items-center gap-2 ml-6">
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                disabled={isRunning}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleExpanded}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable content - Same for both layouts */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
          <div className="p-4 sm:p-6 space-y-4">
            <ProjectMetrics metrics={metrics} />
            
            {/* Image Formats Summary */}
            {metrics.topFormats.length > 0 && (
              <div className="bg-white/70 dark:bg-slate-700/50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Top Image Formats
                </h4>
                <div className="flex flex-wrap gap-2">
                  {metrics.topFormats.map(([format, count]) => (
                    <span key={format} className="px-3 py-2 bg-purple-200 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 text-sm rounded-lg font-medium">
                      {format.toUpperCase()}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <CompanyInfo project={project} />
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Project Manager - Main component for managing audit projects
 * 
 * Features:
 * - Display all projects with search functionality
 * - Project status tracking and management
 * - Detailed project metrics and analytics
 * - Company information display
 * - Project actions (view, edit, delete)
 * - Mobile-first card-based design
 */
export function ProjectManager() {
  // State management
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AuditProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  const router = useRouter();

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

  // Filter projects when search query or projects change
  useEffect(() => {
    const filtered = filterProjects(projects, searchQuery);
    setFilteredProjects(filtered);
  }, [projects, searchQuery]);

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  /**
   * Fetch all projects from the API
   */
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/audit-projects');
      const data = await response.json();
      
      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a project with confirmation
   */
  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will remove all crawled data and analysis results.')) {
      return;
    }

    try {
      const response = await fetch(`/api/audit-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete project');
      }
    } catch (error) {
      setError('Failed to delete project');
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSearchChange = (value: string) => setSearchQuery(value);
  const handleSearchClear = () => setSearchQuery('');
  const handleCreateProject = () => router.push('/dashboard');
  
  const handleToggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (projectId: string) => {
    router.push(`/audit?project=${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/projects/edit/${projectId}`);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return <ProjectManagerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/dashboard" id="project-manager-back">
            Back to Dashboard
          </BackButton>
        </div>
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                Project Dashboard
              </h1>
            </div>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Monitor and manage your website audit projects with comprehensive analytics and insights
          </p>
        </div>

        {/* Search Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClear={handleSearchClear}
          />
          <div className="text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left">
            {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorMessage error={error} />}

        {/* Projects Grid */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <EmptyState 
              hasProjects={projects.length > 0}
              searchQuery={searchQuery}
              onCreateProject={handleCreateProject}
            />
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggleExpanded={() => handleToggleExpanded(project.id)}
                  onDelete={() => handleDeleteProject(project.id)}
                  onViewDetails={() => handleViewDetails(project.id)}
                  onEdit={() => handleEditProject(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 