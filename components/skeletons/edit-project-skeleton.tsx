import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EditProjectSkeleton() {
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

        {/* Edit Form Skeleton - Top */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
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

        {/* Project Details Skeleton - Bottom */}
        <div className="space-y-6">
          {/* Stats Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Project Overview Skeleton */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Pages Card Skeleton */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                </div>
                <div className="text-center">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              </CardContent>
            </Card>

            {/* Links Card Skeleton */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Card Skeleton */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Information Row Skeleton */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete Project Card Skeleton */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 