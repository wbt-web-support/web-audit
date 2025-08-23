'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from '@/components/audit/project-form';
import { AuditProject } from '@/lib/types/database';
import { 
  Globe, 
  Calendar,
  Clock,
  BarChart3,
  Eye,
  Link,
  Image,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Sparkles,
  XCircle,
  ArrowLeft,
  Edit,
  Target,
  TrendingUp,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { EditProjectSkeleton } from '@/components/skeletons';

interface EditProjectPageProps {
  project: AuditProject;
}

export function EditProjectPage({ project }: EditProjectPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <EditProjectSkeleton />;
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-slate-100 text-slate-700',
      crawling: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      analyzing: 'bg-amber-100 text-amber-700',
      analyzed: 'bg-purple-100 text-purple-700',
      error: 'bg-red-100 text-red-700'
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

  const calculateMetrics = (project: AuditProject) => {
    const totalLinks = project.all_links_analysis?.length || 0;
    const internalLinks = project.all_links_analysis?.filter(link => link.type === 'internal').length || 0;
    const externalLinks = project.all_links_analysis?.filter(link => link.type === 'external').length || 0;
    const totalImages = project.all_image_analysis?.length || 0;
    const smallImages = project.all_image_analysis?.filter(img => img.is_small).length || 0;
    const largeImages = totalImages - smallImages;

    return {
      totalLinks,
      internalLinks,
      externalLinks,
      totalImages,
      smallImages,
      largeImages
    };
  };

  const deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This will remove all crawled data and analysis results.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/audit-projects/${project.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project deleted successfully');
        router.push('/projects');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete project');
      }
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const metrics = calculateMetrics(project);
  const progress = project.pages_crawled && project.total_pages 
    ? Math.round((project.pages_crawled / project.total_pages) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Edit className="h-8 w-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Edit Project
              </h1>
              <p className="mt-1 text-slate-600 text-lg">
                Update your project settings and company information for verification
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form - Top */}
        <div className="mb-8">
          <ProjectForm mode="edit" project={project} />
        </div>

        {/* Project Details - Bottom */}
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Project Overview */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Globe className="h-5 w-5 text-slate-600" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Created</span>
                    <span className="text-sm font-medium text-slate-900">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Updated</span>
                    <span className="text-sm font-medium text-slate-900">{new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium text-slate-900">{project.pages_crawled || 0} / {project.total_pages || 0} pages</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress > 80 ? 'bg-emerald-500' : 
                        progress > 50 ? 'bg-blue-500' : 
                        progress > 20 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pages Card */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Eye className="h-5 w-5 text-slate-600" />
                  Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-100 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {project.pages_crawled || 0}
                    </p>
                    <p className="text-sm text-slate-600">Crawled</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    {project.pages_analyzed || 0} analyzed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Links Card */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Link className="h-5 w-5 text-slate-600" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-100 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {metrics.totalLinks}
                    </p>
                    <p className="text-sm text-slate-600">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{metrics.internalLinks}</p>
                    <p className="text-xs text-slate-500">Internal</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{metrics.externalLinks}</p>
                    <p className="text-xs text-slate-500">External</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Card */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Image className="h-5 w-5 text-slate-600" />
                  Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-100 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {metrics.totalImages}
                    </p>
                    <p className="text-sm text-slate-600">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{metrics.largeImages}</p>
                    <p className="text-xs text-slate-500">Large</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{metrics.smallImages}</p>
                    <p className="text-xs text-slate-500">Small</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Information Row */}
          {(project.company_name || project.phone_number || project.email || project.address || project.custom_info) && (
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Target className="h-5 w-5 text-slate-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.company_name && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Building className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Company</p>
                        <p className="text-sm font-medium text-slate-900">{project.company_name}</p>
                      </div>
                    </div>
                  )}
                  {project.phone_number && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-slate-900">{project.phone_number}</p>
                      </div>
                    </div>
                  )}
                  {project.email && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm font-medium text-slate-900">{project.email}</p>
                      </div>
                    </div>
                  )}
                  {project.address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2 lg:col-span-3">
                      <MapPin className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="text-sm font-medium text-slate-900">{project.address}</p>
                      </div>
                    </div>
                  )}
                  {project.custom_info && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2 lg:col-span-3">
                      <FileText className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Additional Info</p>
                        <p className="text-sm font-medium text-slate-900">{project.custom_info}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Project Card - Full Width */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 text-left">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-left text-slate-600">
                Permanently delete this project and all its data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={project.status === 'crawling' || project.status === 'analyzing'}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Deletion
                </CardTitle>
                <CardDescription className="text-slate-600">
                  This action cannot be undone. This will permanently delete the project and all its data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    <strong>Project:</strong> {project.base_url}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteProject}
                    disabled={deleting}
                    className="flex-1"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 