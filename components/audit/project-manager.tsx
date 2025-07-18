'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditProject } from '@/lib/types/database';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Globe, 
  Calendar,
  Play,
  BarChart3,
  Edit
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectManager() {
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      pending: 'bg-muted text-muted-foreground',
      crawling: 'bg-blue-500 dark:bg-blue-600 text-white',
      completed: 'bg-emerald-500 dark:bg-emerald-600 text-white',
      analyzing: 'bg-amber-500 dark:bg-amber-600 text-white',
      analyzed: 'bg-purple-500 dark:bg-purple-600 text-white',
      error: 'bg-destructive text-destructive-foreground'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const goToAudit = () => {
    router.push('/audit');
  };

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
          <h1 className="text-3xl font-bold">Projects Management</h1>
          <p className="text-muted-foreground">Create and manage your website audit Projects</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button onClick={() => router.push('/projects/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button> */}
        
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-destructive">
            <span>{error}</span>
          </div>
        </div>
      )}



      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No projects found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first project to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{project.base_url}</CardTitle>
                        <CardDescription>
                          Created: {new Date(project.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(project.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/audit?project=${project.id}`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/projects/edit/${project.id}`)}
                        disabled={project.status === 'crawling' || project.status === 'analyzing'}
                        title={project.status === 'crawling' || project.status === 'analyzing' 
                          ? 'Cannot edit project while it is running' 
                          : 'Edit project details'}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{project.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pages Crawled</p>
                        <p className="font-medium">{project.pages_crawled || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                        <p className="font-medium">{project.pages_analyzed || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expected Company Information */}
                    {(project.company_name || project.phone_number || project.email || project.address || project.custom_info) && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Expected Company Information:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          {project.company_name && (
                            <div>
                              <span className="text-muted-foreground">Company:</span>
                              <span className="ml-2 font-medium">{project.company_name}</span>
                            </div>
                          )}
                          {project.phone_number && (
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="ml-2 font-medium">{project.phone_number}</span>
                            </div>
                          )}
                          {project.email && (
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <span className="ml-2 font-medium">{project.email}</span>
                            </div>
                          )}
                          {project.address && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Address:</span>
                              <span className="ml-2 font-medium">{project.address}</span>
                            </div>
                          )}
                          {project.custom_info && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <span className="text-muted-foreground">Additional Info:</span>
                              <span className="ml-2 font-medium">{project.custom_info}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 