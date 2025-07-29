import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PageDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* Page Title and URL Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-96" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Analysis Tabs Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation Skeleton */}
          <div className="border-b">
            <div className="flex space-x-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 pb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>

          {/* Tab Content Skeleton */}
          <div className="min-h-[400px] mt-6">
            {/* Grammar & Content Tab Skeleton */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>

              {/* Grammar Sub-tabs Skeleton */}
              <div className="border-b">
                <div className="flex space-x-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2 pb-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Quality Scores Skeleton - Rectangular cards like the real page */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Grammar Issues Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-4 w-4 mt-1" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Company Information Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-4 w-4" />
                        <div className="flex-1">
                          <Skeleton className="h-3 w-20 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Technical Sub-tabs Skeleton */}
          <div className="border-b">
            <div className="flex space-x-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 pb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Technical Content Skeleton */}
          <div className="min-h-[300px] mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Performance Sub-tabs Skeleton */}
          <div className="border-b">
            <div className="flex space-x-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2 pb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Performance Content Skeleton */}
          <div className="min-h-[300px] mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-20 w-20 rounded-full" />
                    </div>
                    <div className="text-center mt-4">
                      <Skeleton className="h-4 w-20 mx-auto mb-2" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 