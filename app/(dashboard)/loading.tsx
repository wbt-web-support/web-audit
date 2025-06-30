import { Loader2, Globe2, BarChart3, Settings } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Skeleton */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe2 className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Web Audit</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Audit</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Sessions</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-80 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-9 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Action Cards Skeleton */}
          <div className="grid gap-6">
            {[1, 2].map((cardIndex) => (
              <div key={cardIndex} className="border rounded-lg p-6">
                <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-56 h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
                
                {/* Card Content Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div>
                          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* List/Table Skeleton */}
          <div className="border rounded-lg p-6">
            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
            
            {/* Filters Skeleton */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="md:w-48">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* List Items Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Cards Skeleton (for detailed pages) */}
          <div className="grid gap-4">
            {[1, 2].map((cardIndex) => (
              <div key={cardIndex} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div>
                      <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((metricIndex) => (
                    <div key={metricIndex} className="text-center">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1 mx-auto"></div>
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Central Loading Indicator */}
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">Loading...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 