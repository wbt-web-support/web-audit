import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Zap } from 'lucide-react';

interface ProcessStatusCardProps {
  currentSession: any;
}

export function ProcessStatusCard({ currentSession }: ProcessStatusCardProps) {
  const isBackgroundCrawling = currentSession?.backgroundCrawling;
  
  return (
    <Card className={isBackgroundCrawling ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20" : ""}>
      <CardContent className="pt-6">
        <div className={`flex items-center gap-3 ${isBackgroundCrawling ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600'}`}>
          {isBackgroundCrawling ? (
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse flex-shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base">
              {isBackgroundCrawling ? 'Background Process Running' : 'Process Running'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentSession?.currentAction || (isBackgroundCrawling ? 'Crawling in background...' : 'Crawling in progress...')}
            </p>
          </div>
        </div>
        
        {/* Recent Crawling Activity */}
        {(currentSession?.isCrawling || currentSession?.backgroundCrawling) && currentSession?.recentCrawledPages && currentSession.recentCrawledPages.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              Pages Crawled ({currentSession.recentCrawledPages.length} total):
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {currentSession.recentCrawledPages.slice(0, 10).map((page: any, index: number) => (
                <div key={page.id || index} className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="truncate min-w-0">
                    {page.title || page.url}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({page.status_code || 'N/A'})
                  </span>
                </div>
              ))}
              {currentSession.recentCrawledPages.length > 10 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... and {currentSession.recentCrawledPages.length - 10} more pages
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
