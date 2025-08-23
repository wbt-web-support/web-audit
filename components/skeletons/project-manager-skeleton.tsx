import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectManagerSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-32" />
        </div>
        
        {/* Header Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-80" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Search and Filter Section Skeleton */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Projects List Skeleton */}
        <div className="space-y-4">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left side: Icon, URL, Status, Dates */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Project Icon */}
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      
                      {/* Project Details */}
                      <div className="flex-1 min-w-0">
                        {/* URL and Status */}
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        
                        {/* Dates and Metrics */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 