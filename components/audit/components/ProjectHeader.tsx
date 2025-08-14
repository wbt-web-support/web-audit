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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
            Analyze website pages and view detailed audit results
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Start/Stop/Recrawl Buttons */}
          {projects.length > 0 && projects[0] && (
            <>
              {/* Start Crawl */}
              {projects[0].status === 'pending' && !currentSession?.isCrawling && !currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  onClick={() => onStartCrawl(projects[0].id)}
                  disabled={crawling}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Crawl
                </Button>
              )}
              
              {/* Background Crawl Toggle */}
              {projects[0].status === 'pending' && !currentSession?.isCrawling && !currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStartCrawl(projects[0].id, true)}
                  disabled={crawling}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Background Crawl
                </Button>
              )}
              
              {/* Stop Background Crawl */}
              {currentSession?.backgroundCrawling && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopCrawl(projects[0].id)}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Background
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
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recrawl
                </Button>
              )}
              

              
              {/* Stop Crawl */}
              {(projects[0].status === 'crawling' || currentSession?.isCrawling) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopCrawl(projects[0].id)}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Crawl
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || deleting || analyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Link href={`/projects/edit/${projects[0]?.id ?? ''}`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
