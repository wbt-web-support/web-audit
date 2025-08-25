import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';

interface ProcessStatusCardProps {
  currentSession: any;
}

export function ProcessStatusCard({ currentSession }: ProcessStatusCardProps) {
  return (
   
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-blue-600">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base">
              Process Running
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentSession?.currentAction || 'Crawling in progress...'}
            </p>
          </div>
        </div>
        
        {/* Recent Crawling Activity */}
        {currentSession?.isCrawling && currentSession?.recentCrawledPages && currentSession.recentCrawledPages.length > 0 && (
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
