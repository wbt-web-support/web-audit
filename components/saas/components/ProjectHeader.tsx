import { Button } from '@/components/ui/button';
import { Play, RefreshCw, Square, Settings, Zap, Pause } from 'lucide-react';
import Link from 'next/link';
import { AuditProject } from '@/lib/types/database';

interface ProjectHeaderProps {
  projects: AuditProject[];
  currentSession: any;
  crawling: boolean;
  loading: boolean;
  deleting: boolean;
  analyzing: boolean;
  onStartCrawl: (projectId: string, background?: boolean) => void;
  onStopCrawl: (projectId: string) => void;
  onRefresh: () => void;
  isAnalysisDisabled: () => boolean;
}

export function ProjectHeader({
  projects,
  currentSession,
  crawling,
  loading,
  deleting,
  analyzing,
  onStartCrawl,
  onStopCrawl,
  onRefresh,
  isAnalysisDisabled
}: ProjectHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
            Analyze website pages and view detailed audit results
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Start/Stop/Recrawl Buttons */}
          {projects.length > 0 && projects[0] && (
            <>
              {/* Start Crawl */}
              {projects[0].status === 'pending' && !currentSession?.isCrawling && !currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  onClick={() => onStartCrawl(projects[0].id)}
                  disabled={crawling}
                  className="w-full sm:w-auto"
                >
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Start Crawl</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              )}
              
              {/* Background Crawl Toggle */}
              {projects[0].status === 'pending' && !currentSession?.isCrawling && !currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStartCrawl(projects[0].id, true)}
                  disabled={crawling}
                  className="w-full sm:w-auto"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Background Crawl</span>
                  <span className="sm:hidden">Background</span>
                </Button>
              )}
              
              {/* Stop Background Crawl */}
              {currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopCrawl(projects[0].id)}
                  className="w-full sm:w-auto"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Stop Background</span>
                  <span className="sm:hidden">Stop</span>
                </Button>
              )}
              
              {/* Recrawl */}
              {(projects[0].status === 'completed' || projects[0].status === 'failed') && !currentSession?.isCrawling && !currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to recrawl? This will reset all pages, images, links, and analysis data to start fresh.')) {
                      onStartCrawl(projects[0].id);
                    }
                  }}
                  disabled={crawling}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Recrawl</span>
                  <span className="sm:hidden">Recrawl</span>
                </Button>
              )}
              
              {/* Stop Crawl */}
              {(projects[0].status === 'crawling' || currentSession?.isCrawling) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopCrawl(projects[0].id)}
                  className="w-full sm:w-auto"
                >
                  <Square className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Stop Crawl</span>
                  <span className="sm:hidden">Stop</span>
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || deleting || analyzing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          
          <Link href={`/projects/edit/${projects[0]?.id ?? ''}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Project</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
