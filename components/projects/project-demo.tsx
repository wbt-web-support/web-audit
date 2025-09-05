"use client";

import { useState } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Trash2, Play, RefreshCw } from 'lucide-react';

export function ProjectDemo() {
  const [newProject, setNewProject] = useState({
    base_url: '',
    crawl_type: 'full',
    companyDetails: {
      companyName: '',
      email: ''
    }
  });

  const { user, isAuthenticated } = useAuthWithBackend();
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    deleteProject, 
    startAudit, 
    refreshProjects 
  } = useProjects();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProject.base_url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    const success = await createProject(newProject);
    
    if (success) {
      toast.success('Project created successfully!');
      setNewProject({
        base_url: '',
        crawl_type: 'full',
        companyDetails: {
          companyName: '',
          email: ''
        }
      });
    } else {
      toast.error(error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const success = await deleteProject(projectId);
    
    if (success) {
      toast.success('Project deleted successfully!');
    } else {
      toast.error(error || 'Failed to delete project');
    }
  };

  const handleStartAudit = async (projectId: string) => {
    const success = await startAudit(projectId);
    
    if (success) {
      toast.success('Audit started successfully!');
    } else {
      toast.error(error || 'Failed to start audit');
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to manage projects.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Create New Project Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Create a new audit project for your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={newProject.base_url}
                onChange={(e) => setNewProject(prev => ({
                  ...prev,
                  base_url: e.target.value
                }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="crawl_type">Audit Type</Label>
              <select
                id="crawl_type"
                value={newProject.crawl_type}
                onChange={(e) => setNewProject(prev => ({
                  ...prev,
                  crawl_type: e.target.value
                }))}
                className="w-full p-2 border border-input rounded-md"
              >
                <option value="full">Full Audit</option>
                <option value="single">Single Page Audit</option>
              </select>
            </div>

            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                type="text"
                placeholder="Your Company"
                value={newProject.companyDetails.companyName}
                onChange={(e) => setNewProject(prev => ({
                  ...prev,
                  companyDetails: {
                    ...prev.companyDetails,
                    companyName: e.target.value
                  }
                }))}
              />
            </div>

            <div>
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                placeholder="contact@company.com"
                value={newProject.companyDetails.email}
                onChange={(e) => setNewProject(prev => ({
                  ...prev,
                  companyDetails: {
                    ...prev.companyDetails,
                    email: e.target.value
                  }
                }))}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Projects ({projects.length})</CardTitle>
            <CardDescription>
              Manage your audit projects
            </CardDescription>
          </div>
          <Button
            onClick={refreshProjects}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && projects.length === 0 ? (
            <p className="text-center text-muted-foreground">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No projects yet. Create your first project above!
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{project.base_url}</h3>
                          <Badge variant={
                            project.status === 'completed' ? 'default' :
                            project.status === 'running' ? 'secondary' :
                            'outline'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Type: {project.crawl_type}</p>
                          <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                          {project.company_name && (
                            <p>Company: {project.company_name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {project.status !== 'running' && (
                          <Button
                            onClick={() => handleStartAudit(project.id)}
                            size="sm"
                            variant="outline"
                            disabled={loading}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteProject(project.id)}
                          size="sm"
                          variant="destructive"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
