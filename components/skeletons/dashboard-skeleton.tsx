import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        
        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Project Creation Form Skeleton - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <Card className="h-fit border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Fields Skeleton */}
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Projects Skeleton - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <Card className="h-fit border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
} 