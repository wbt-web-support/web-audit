'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Clock, CheckCircle, AlertTriangle, XCircle, Edit, BarChart3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
}

// Status configuration
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    className: "text-emerald-500 dark:text-emerald-400",
    animate: false
  },
  crawling: {
    icon: Clock,
    className: "text-blue-500 dark:text-blue-400",
    animate: true
  },
  analyzing: {
    icon: Clock,
    className: "text-amber-500 dark:text-amber-400",
    animate: true
  },
  failed: {
    icon: XCircle,
    className: "text-red-500 dark:text-red-400",
    animate: false
  },
  pending: {
    icon: AlertTriangle,
    className: "text-muted-foreground",
    animate: false
  }
} as const;

// Utility functions
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
function StatusIcon({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  return (
    <IconComponent 
      className={cn(
        "h-5 w-5",
        config.className,
        config.animate && "animate-pulse"
      )} 
    />
  );
}

function ProjectCard({ project }: { project: AuditProject }) {
  const router = useRouter();
  const isRunning = isProjectRunning(project.status);

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg transition-colors",
      "hover:bg-muted/50"
    )}>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <StatusIcon status={project.status} />
        <div>
          <p className="font-medium break-all max-w-xs sm:max-w-none">
            {project.base_url}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatProjectStats(project.pages_crawled, project.pages_analyzed)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Link href={`/audit?project=${project.id}`} className="w-full sm:w-auto">
          <Button size="sm" variant="outline" className="w-full sm:w-auto">
            <BarChart3 className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/projects/edit/${project.id}`)}
          disabled={isRunning}
          title={isRunning 
            ? 'Cannot edit project while it is running' 
            : 'Edit project details'
          }
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">No projects yet</p>
      <Link href="/projects">
        <Button className="mt-4 w-full sm:w-auto">
          Add Your First Projects
        </Button>
      </Link>
    </div>
  );
}

function ProjectList({ projects }: { projects: AuditProject[] }) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
      <div className="text-center pt-4">
        <Link href="/projects">
          <Button variant="outline" className="w-full sm:w-auto">
            View All Projects
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Main component
export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <Card className="w-full mt-16">
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Your latest audit projects</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectList projects={projects} />
        )}
      </CardContent>
    </Card>
  );
} 