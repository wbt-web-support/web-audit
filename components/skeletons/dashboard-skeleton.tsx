import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-6 w-96" />
        </div>
        
        {/* Project Form Skeleton */}
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
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
        
        {/* Recent Projects Skeleton */}
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Skeleton className="h-10 w-32 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 