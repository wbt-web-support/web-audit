import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuditMainSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>

        {/* Process Running Card Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Skeleton className="h-3 w-40 mb-2" />
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Project Info Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <div className="flex items-baseline gap-1">
                      <Skeleton className="h-5 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom URLs Card Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative rounded-xl border p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pages List Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>

            {/* Results Counter Skeleton */}
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>

            {/* Pages Table Skeleton */}
            <div className="overflow-x-scroll">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="w-8 p-2">
                      <Skeleton className="h-4 w-4" />
                    </th>
                    <th className="w-8 p-2 text-center">
                      <Skeleton className="h-3 w-4 mx-auto" />
                    </th>
                    <th className="p-2">
                      <Skeleton className="h-3 w-16" />
                    </th>
                    <th className="w-20 p-2 text-center">
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </th>
                    <th className="w-[100px] p-2 text-center">
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </th>
                    <th className="w-40 p-2 text-center">
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      <td className="p-2 text-center">
                        <Skeleton className="h-3 w-4 mx-auto" />
                      </td>
                      <td className="p-2 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-3 w-48 mt-1" />
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center">
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-3 w-12 ml-1" />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Skeleton className="h-7 w-16" />
                          <Skeleton className="h-7 w-7" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 