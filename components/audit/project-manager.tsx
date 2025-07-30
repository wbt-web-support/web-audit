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
  ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectManagerSkeleton } from '@/components/skeletons';
import { BackButton } from '@/components/ui/back-button';

export function ProjectManager() {
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AuditProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'project-not-found') {
      setError('Project not found or you do not have permission to access it.');
      // Clean up the URL
      router.replace('/projects', undefined);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.base_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.company_name && project.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [projects, searchQuery]);

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

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      crawling: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      analyzing: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      analyzed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      crawling: <Activity className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      analyzing: <Zap className="h-3 w-3" />,
      analyzed: <Sparkles className="h-3 w-3" />,
      error: <XCircle className="h-3 w-3" />
    };

    return (
      <Badge className={`flex items-center gap-1 ${variants[status as keyof typeof variants] || 'bg-slate-100 text-slate-700'}`}>
        {icons[status as keyof typeof icons]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-slate-500',
      crawling: 'text-blue-500',
      completed: 'text-emerald-500',
      analyzing: 'text-amber-500',
      analyzed: 'text-purple-500',
      error: 'text-red-500'
    };
    return colors[status as keyof typeof colors] || 'text-slate-500';
  };

  const calculateMetrics = (project: AuditProject) => {
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
      
      // Handle data URLs
      if (format.startsWith('data:')) {
        if (format.includes('image/svg+xml')) {
          format = 'svg';
        } else if (format.includes('image/jpeg') || format.includes('image/jpg')) {
          format = 'jpg';
        } else if (format.includes('image/png')) {
          format = 'png';
        } else if (format.includes('image/webp')) {
          format = 'webp';
        } else if (format.includes('image/gif')) {
          format = 'gif';
        } else if (format.includes('image/bmp')) {
          format = 'bmp';
        } else if (format.includes('image/tiff') || format.includes('image/tif')) {
          format = 'tiff';
        } else {
          format = 'data-url';
        }
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

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const toggleExpanded = (projectId: string) => {
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

  if (loading) {
    return <ProjectManagerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button - Top Left */}
        <div className="mb-4">
          <BackButton href="/dashboard">
            Back to Dashboard
          </BackButton>
        </div>
        
        {/* Header Section */}
        <div className="space-y-3">
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
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search projects by URL, status, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
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
                      {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {projects.length === 0 
                        ? 'Create your first project to start analyzing websites'
                        : `No projects match "${searchQuery}". Try adjusting your search terms.`
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={goToDashboard}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => {
                const metrics = calculateMetrics(project);
                const isExpanded = expandedProjects.has(project.id);

                return (
                  <Card key={project.id} className="border-0 shadow-md bg-white/80 dark:bg-slate-800/80  hover:shadow-2xl transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.base_url}
                              </h3>
                              {getStatusBadge(project.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(project.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(project.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/audit?project=${project.id}`)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/projects/edit/${project.id}`)}
                            disabled={project.status === 'crawling' || project.status === 'analyzing'}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/30"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProject(project.id)}
                            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpanded(project.id)}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Compact Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Pages</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              {project.pages_crawled || 0}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">Crawled</p>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Analysis</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              {project.pages_analyzed || 0}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">Completed</p>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Link className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Links</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              {metrics.totalLinks}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {metrics.internalLinks} internal, {metrics.externalLinks} external
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Image className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Images</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              {metrics.totalImages}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {metrics.smallImages} small (&lt;500KB), {metrics.largeImages} large
                            </p>
                          </div>
                        </div>

                        {/* Image Formats Summary */}
                        {metrics.topFormats.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                              <Image className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Top Image Formats
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {metrics.topFormats.map(([format, count]) => (
                                <span key={format} className="px-2 py-1 bg-purple-200 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                                  {format.toUpperCase()}: {count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Company Information */}
                        {(project.company_name || project.phone_number || project.email || project.address || project.custom_info) && (
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-lg p-3">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                              <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              Expected Company Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {project.company_name && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">Company:</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{project.company_name}</span>
                                </div>
                              )}
                              {project.phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{project.phone_number}</span>
                                </div>
                              )}
                              {project.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">Email:</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{project.email}</span>
                                </div>
                              )}
                              {project.address && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <MapPin className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">Address:</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{project.address}</span>
                                </div>
                              )}
                              {project.custom_info && (
                                <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                                  <FileText className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">Additional Info:</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{project.custom_info}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 