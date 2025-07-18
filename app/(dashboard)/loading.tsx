import { Loader2, Globe2, BarChart3, Settings } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col bg-card border-r border-border">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 px-2 py-2">
                <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
                <div className="w-16 h-8 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </nav>
          
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <div className="w-64 h-8 bg-muted animate-pulse rounded mb-2"></div>
              <div className="w-80 h-5 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="w-32 h-9 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-8">
          <div className="w-40 h-6 bg-muted animate-pulse rounded mb-2"></div>
          <div className="w-56 h-4 bg-muted animate-pulse rounded mb-6"></div>

          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="w-32 h-4 bg-muted animate-pulse rounded mb-1"></div>
                <div className="w-24 h-3 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </main>
      </div>

      {/* Recent projects skeleton */}
      <div className="lg:pl-64 p-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="w-48 h-6 bg-muted animate-pulse rounded mb-2"></div>
          <div className="w-64 h-4 bg-muted animate-pulse rounded mb-6"></div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="w-20 h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="w-full h-10 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
            <div className="text-center pt-4">
              <div className="w-24 h-4 bg-muted animate-pulse rounded mb-2"></div>
              <div className="w-full h-10 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 