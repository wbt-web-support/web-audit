import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectManagerSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Search Section Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Projects Grid Skeleton */}
        <div className="space-y-6">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Progress Bar Skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>

                  {/* Metrics Grid Skeleton */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-8 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Metrics Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <div className="space-y-2">
                        {[1, 2].map((k) => (
                          <div key={k} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-20" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-2 w-16" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map((k) => (
                          <div key={k} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-20" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-2 w-16" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Company Information Skeleton */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {[1, 2, 3, 4, 5].map((k) => (
                        <div key={k} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
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