'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Clock, CheckCircle, AlertTriangle, XCircle, Edit, BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useMemo, useCallback } from 'react';

// Types
interface AuditProject {
  id: string;
  base_url: string;
  status: string;
  pages_crawled?: number;
  pages_analyzed?: number;
  created_at: string;
}

interface RecentProjectsProps {
  projects: AuditProject[];
  loading?: boolean;
}

// Status configuration - moved outside component to prevent recreation
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    className: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    animate: false
  },
  crawling: {
    icon: Clock,
    className: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    animate: true
  },
  analyzing: {
    icon: Clock,
    className: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    animate: true
  },
  failed: {
    icon: XCircle,
    className: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    animate: false
  },
  pending: {
    icon: AlertTriangle,
    className: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-800",
    animate: false
  }
} as const;

// Utility functions - moved outside component
const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
};

const formatProjectStats = (pagesCrawled?: number, pagesAnalyzed?: number) => {
  const crawled = pagesCrawled || 0;
  const analyzed = pagesAnalyzed || 0;
  return `${crawled} pages crawled • ${analyzed} analyzed`;
};

const isProjectRunning = (status: string) => {
  return status === 'crawling' || status === 'analyzing';
};

// Sub-components
const StatusIcon = React.memo(({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  return (
    <div className={cn("p-2 rounded-lg", config.bgColor)}>
      <IconComponent 
        className={cn(
          "h-4 w-4",
          config.className,
          config.animate && "animate-pulse"
        )} 
      />
    </div>
  );
});

StatusIcon.displayName = 'StatusIcon';

const ProjectCard = React.memo(({ project }: { project: AuditProject }) => {
  const router = useRouter();
  const isRunning = isProjectRunning(project.status);

  const handleEditClick = useCallback(() => {
    router.push(`/projects/edit/${project.id}`);
  }, [router, project.id]);

  const projectStats = useMemo(() => 
    formatProjectStats(project.pages_crawled, project.pages_analyzed), 
    [project.pages_crawled, project.pages_analyzed]
  );

  return (
    <div className={cn(
      "group p-4 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-200",
      "hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm",
      "bg-white dark:bg-slate-800"
    )}>
      <div className="flex items-start gap-3 mb-3">
        <StatusIcon status={project.status} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
            {project.base_url}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {projectStats}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Link href={`/audit?project=${project.id}`} className="flex-1">
          <Button size="sm" variant="outline" className="btn-secondary w-full text-xs h-8">
            <BarChart3 className="h-3 w-3 mr-1" />
            View Results
          </Button>
        </Link>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEditClick}
          disabled={isRunning}
          title={isRunning 
            ? 'Cannot edit project while it is running' 
            : 'Edit project details'
          }
          className="h-8 w-8 p-0 rounded-lg"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

// Export ProjectCard for use in other components
export { ProjectCard };

const EmptyState = React.memo(() => {
  return (
    <div className="text-center py-8">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Globe className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">No projects yet</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Create your first audit project to get started</p>
      <Link href="/projects">
        <Button size="sm" className="btn-primary w-full">
          <Plus className="h-3 w-3 mr-1" />
          Create Project
        </Button>
      </Link>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

const ProjectList = React.memo(({ projects }: { projects: AuditProject[] }) => {
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
});

ProjectList.displayName = 'ProjectList';

const LoadingSkeleton = React.memo(() => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="p-4 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-slate-200 rounded flex-1"></div>
              <div className="w-8 h-8 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Main component
export const RecentProjects = React.memo(({ projects, loading = false }: RecentProjectsProps) => {
  const content = useMemo(() => {
    if (loading) {
      return <LoadingSkeleton />;
    }
    
    if (projects.length === 0) {
      return <EmptyState />;
    }
    
    return <ProjectList projects={projects} />;
  }, [loading, projects]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <CardDescription className="text-sm">Your latest audit projects</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <div className="h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {content}
        </div>
      </CardContent>
    </Card>
  );
});

RecentProjects.displayName = 'RecentProjects'; 