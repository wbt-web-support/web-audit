import { BarChart3 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Web Audit</h2>
          </div>
          <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Desktop Layout Container */}
      <div className="lg:flex lg:h-screen lg:overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-1 flex-col bg-white border-r border-slate-200">
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Web Audit</h2>
              </div>
            </div>
            
            <nav className="flex-1 space-y-1 px-4 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 px-3 py-3">
                  <div className="w-5 h-5 bg-slate-200 animate-pulse rounded"></div>
                  <div className="w-20 h-4 bg-slate-200 animate-pulse rounded"></div>
                </div>
              ))}
            </nav>
            
            <div className="border-t border-slate-200 p-4">
              <div className="w-full h-9 bg-slate-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 lg:overflow-y-auto">
          <main className="min-h-screen pt-16 lg:pt-0 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-slate-700" />
                </div>
                <div>
                  <div className="w-32 h-8 bg-slate-200 animate-pulse rounded mb-2"></div>
                  <div className="w-64 h-5 bg-slate-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border-0 shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="w-20 h-4 bg-slate-200 animate-pulse rounded mb-2"></div>
                      <div className="w-16 h-6 bg-slate-200 animate-pulse rounded mb-1"></div>
                      <div className="w-24 h-3 bg-slate-200 animate-pulse rounded"></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-200 animate-pulse rounded-lg ml-4"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project form */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="w-24 h-5 bg-slate-200 animate-pulse rounded mb-4"></div>
                  <div className="w-full h-12 bg-slate-200 animate-pulse rounded mb-4"></div>
                  <div className="w-20 h-9 bg-slate-200 animate-pulse rounded"></div>
                </div>
              </div>
              
              {/* Recent projects */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="w-32 h-5 bg-slate-200 animate-pulse rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div className="w-24 h-4 bg-slate-200 animate-pulse rounded"></div>
                        <div className="w-16 h-4 bg-slate-200 animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 