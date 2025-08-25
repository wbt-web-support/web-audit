'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock,
  Globe
} from 'lucide-react';
import { AuditProject } from '@/lib/types/database';

interface RecentProjectsProps {
  projects: AuditProject[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'crawling':
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'crawling':
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>
          Your latest website audit projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.slice(0, 5).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {getStatusIcon(project.status)}
                <div>
                  <h4 className="font-medium">{project.company_name || project.base_url}</h4>
                  <p className="text-sm text-muted-foreground">{project.base_url}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/audit/${project.id}`}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet. Start your first website audit!</p>
              <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
                Create Project
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
