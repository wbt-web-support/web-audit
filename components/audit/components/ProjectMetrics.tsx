import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Loader2, 
  BarChart3, 
  XCircle, 
  Clock, 
  Globe, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { AuditProject } from '@/lib/types/database';

interface ProjectMetricsProps {
  project: AuditProject;
  currentSession: any;
  onToggleImageAnalysis: (show: boolean) => void;
  onToggleLinksAnalysis: (show: boolean) => void;
}

export function ProjectMetrics({
  project,
  currentSession,
  onToggleImageAnalysis,
  onToggleLinksAnalysis
}: ProjectMetricsProps) {
  const isCrawling = currentSession?.isCrawling || project.status === 'crawling';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Project</CardTitle>
            <CardDescription>{project.base_url}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 hover:shadow-md transition-all group">
            <div className="flex-shrink-0">
              {project.status === 'completed' ? (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              ) : project.status === 'crawling' ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : project.status === 'analyzing' ? (
                <BarChart3 className="h-6 w-6 text-amber-500" />
              ) : project.status === 'failed' ? (
                <XCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-sm capitalize">
                {project.status === 'completed' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                ) : project.status === 'crawling' ? (
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Crawling
                  </span>
                ) : project.status === 'analyzing' ? (
                  <span className="text-amber-600 dark:text-amber-400">Analyzing</span>
                ) : project.status === 'failed' ? (
                  <span className="text-red-600 dark:text-red-400">Stopped</span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </p>
            </div>
          </div>

          {/* Pages Crawled */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 hover:shadow-md transition-all ${isCrawling ? 'animate-pulse' : ''}`}>
            <div className="flex-shrink-0">
              {isCrawling ? (
                <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
              ) : (
                <Globe className="h-6 w-6 text-green-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Pages Crawled</p>
              <div className="flex items-baseline gap-1">
                <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                  {project.pages_crawled || 0}
                </p>
                <span className="text-xs text-muted-foreground">
                  / {project.total_pages || 0}
                </span>
                {isCrawling && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                    Crawling...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pages Analyzed */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 hover:shadow-md transition-all">
            <div className="flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Pages Analyzed</p>
              <div className="flex items-baseline gap-1">
                <p className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                  {(currentSession?.analyzedPages || []).filter((p: any) => p.resultCount > 0).length}
                </p>
                <span className="text-xs text-muted-foreground">
                  / {project.pages_crawled || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Total Images */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 hover:shadow-md transition-all cursor-pointer group ${isCrawling ? 'animate-pulse' : ''}`}
            onClick={() => {
              if (isCrawling) return;
              if (project.all_image_analysis && project.all_image_analysis.length > 0) {
                onToggleImageAnalysis(!currentSession?.showImageAnalysis);
                onToggleLinksAnalysis(false);
              }
            }}
          >
            <div className="flex-shrink-0">
              <Eye className="h-6 w-6 text-pink-500 group-hover:text-pink-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Total Images</p>
              <div className="flex items-baseline gap-1">
                <p className="font-semibold text-lg text-pink-600 dark:text-pink-400">
                  {isCrawling 
                    ? (currentSession?.liveImageCount || project.all_image_analysis?.length || 0)
                    : (project.all_image_analysis ? project.all_image_analysis.length : 0)}
                </p>
                <span className="text-xs text-muted-foreground">found</span>
              </div>
              {project.all_image_analysis && project.all_image_analysis.length > 0 && !isCrawling && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentSession?.showImageAnalysis ? 'Click to hide' : 'Click to view details'}
                </p>
              )}
              {isCrawling && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available after crawling completes
                </p>
              )}
            </div>
          </div>

          {/* Total Links */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 hover:shadow-md transition-all cursor-pointer group ${isCrawling ? 'animate-pulse' : ''}`}
            onClick={() => {
              if (isCrawling) return;
              if (project.all_links_analysis && project.all_links_analysis.length > 0) {
                onToggleLinksAnalysis(!currentSession?.showLinksAnalysis);
                onToggleImageAnalysis(false);
              }
            }}
          >
            <div className="flex-shrink-0">
              <ExternalLink className="h-6 w-6 text-orange-500 group-hover:text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Total Links</p>
              <div className="flex items-baseline gap-1 mb-1">
                <p className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                  {isCrawling 
                    ? (currentSession?.liveLinkCount || project.all_links_analysis?.length || 0)
                    : (project.all_links_analysis ? project.all_links_analysis.length : 0)}
                </p>
                <span className="text-xs text-muted-foreground">found</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Internal:</span>
                  <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                    {isCrawling 
                      ? (currentSession?.liveInternalLinks || project.all_links_analysis?.filter(link => link.type === 'internal').length || 0)
                      : (project.all_links_analysis ? 
                        project.all_links_analysis.filter(link => link.type === 'internal').length : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">External:</span>
                  <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                    {isCrawling 
                      ? (currentSession?.liveExternalLinks || project.all_links_analysis?.filter(link => link.type === 'external').length || 0)
                      : (project.all_links_analysis ? 
                        project.all_links_analysis.filter(link => link.type === 'external').length : 0)}
                  </span>
                </div>
              </div>
              {project.all_links_analysis && project.all_links_analysis.length > 0 && !isCrawling && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentSession?.showLinksAnalysis ? 'Click to hide' : 'Click to view details'}
                </p>
              )}
              {isCrawling && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available after crawling completes
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
