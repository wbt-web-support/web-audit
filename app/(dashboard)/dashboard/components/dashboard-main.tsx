'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, BarChart3, Plus, TrendingUp, Globe, Clock, CheckCircle } from "lucide-react";
import { RecentProjects } from './recent-projects';
import { ProjectForm } from '@/components/audit/project-form';
import { DashboardSkeleton } from '@/components/skeletons';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { useAutoProjectCreation } from '../hooks/use-auto-project-creation';
import { PerformanceMonitor } from './performance-monitor';
import type { AuditProject } from '@/lib/types/database';
import React from 'react';

/**
 * Dashboard statistics interface
 * Contains all the data needed to display dashboard metrics and recent projects
 */
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
  recentProjects: AuditProject[];
}

// Cache for dashboard data to prevent unnecessary re-fetches
const dashboardCache = {
  data: null as DashboardStats | null,
  timestamp: 0,
  isValid: () => {
    const now = Date.now();
    const cacheAge = now - dashboardCache.timestamp;
    // Cache is valid for 5 minutes
    return dashboardCache.data && cacheAge < 5 * 60 * 1000;
  }
};

/**
 * Main dashboard component that displays:
 * - Dashboard header with title and description
 * - Statistics cards
 * - Project creation form
 * - Recent projects list
 * - Loading and error states
 */
export function DashboardMain() {
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS
  const { stats, loading, error, refetch, isStale } = useDashboardStats();
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [debouncedLoading, setDebouncedLoading] = useState(true);
  const hasInitialized = useRef(false);
  
  // Auto-project creation hook
  const { websiteUrl, isCreating, hasAttempted } = useAutoProjectCreation({
    onProjectCreated: useCallback((projectId: string) => {
      console.log('Auto-created project:', projectId);
      // Invalidate cache when new project is created
      dashboardCache.data = null;
      dashboardCache.timestamp = 0;
      refetch(true);
    }, [refetch])
  });

  // Cache the stats data when it's loaded
  useEffect(() => {
    if (stats && !loading) {
      dashboardCache.data = stats;
      dashboardCache.timestamp = Date.now();
      hasInitialized.current = true;
    }
  }, [stats, loading]);

  // Use cached data if available and valid, otherwise use fresh data
  const displayStats = useMemo(() => {
    if (dashboardCache.isValid() && !loading) {
      return dashboardCache.data;
    }
    return stats;
  }, [stats, loading]);

  // Ensure minimum loading time to prevent flash
  useEffect(() => {
    if (!loading && displayStats) {
      const timer = setTimeout(() => {
        setMinLoadingTime(false);
      }, 150); // Reduced from 200ms
      return () => clearTimeout(timer);
    }
  }, [loading, displayStats]);

  // Debounce loading state to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(loading);
    }, 30); // Reduced from 50ms

    return () => clearTimeout(timer);
  }, [loading]);

  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => {
    // Don't show loading if we have cached data and it's the first load
    if (hasInitialized.current && dashboardCache.isValid() && !loading) {
      return false;
    }
    return debouncedLoading || minLoadingTime;
  }, [debouncedLoading, minLoadingTime, loading]);

  // Performance monitor callback - must be defined before any returns
  const handleLoadComplete = useCallback(() => {
    console.log('Dashboard load completed');
  }, []);

  // NOW WE CAN HAVE CONDITIONAL RENDERING
  // Loading state - show skeleton while fetching data
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show auto-project creation loading state
  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Creating Your Project</h2>
          <p className="mb-6 text-slate-600">
            Setting up audit project for {websiteUrl}...
          </p>
          <div className="text-sm text-slate-500">
            This will only take a moment
          </div>
        </div>
      </div>
    );
  }

  // Error state - show error message with retry button
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center py-8 max-w-md mx-auto">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Something went wrong</h2>
          <p className="mb-6 text-slate-600">{error}</p>
          <Button onClick={() => refetch(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Safety check - return skeleton if no stats data (shouldn't happen now)
  if (!displayStats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-opacity duration-300 ease-in-out">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header Section */}
        <DashboardHeader />
        
        {/* Auto-Project Creation Banner */}
        {websiteUrl && hasAttempted && !isCreating && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Project Created Successfully!
                </h3>
                <p className="text-sm text-blue-700">
                  Your audit project for <strong>{websiteUrl}</strong> has been automatically created and you've been redirected to the audit page.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Statistics Cards - Show immediately if cached, with loading overlay if refreshing */}
        <div className="relative">
          {loading && displayStats && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          )}
          {isStale && (
            <div className="absolute top-2 right-2 z-20">
              <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                Data may be stale
              </div>
            </div>
          )}
          <StatsCards stats={displayStats} loading={debouncedLoading} />
        </div>
        
        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Project Creation Form - Takes 50% of the space */}
          <div className="space-y-6">
            <ProjectForm 
              mode="create" 
              projects={displayStats.recentProjects}
            />
          </div>
          
          {/* Recent Projects - Takes 50% of the space */}
          <div className="space-y-6">
            <RecentProjects 
              projects={displayStats.recentProjects} 
              loading={debouncedLoading}
            />
          </div>
          
        </div>
        
        {/* Performance Monitor - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <PerformanceMonitor 
            loading={loading}
            error={error}
            onLoadComplete={handleLoadComplete}
          />
        )}
        
      </div>
    </div>
  );
}

/**
 * Dashboard header component with title, icon, and description
 * Separated for better component organization
 */
const DashboardHeader = React.memo(() => {
  return (
    <div className="mb-8">
      {/* Title and Icon */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-100 rounded-xl">
          <BarChart3 className="h-8 w-8 text-slate-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600 text-lg">
            Monitor your web audit projects and performance
          </p>
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

/**
 * Statistics cards component displaying key metrics
 * Shows 0 values for new users with no projects
 * Memoized to prevent unnecessary re-renders
 */
const StatsCards = React.memo(({ stats, loading }: { stats: DashboardStats, loading: boolean }) => {
  // Memoize stat cards to prevent recreation on every render
  const statCards = useMemo(() => [
    {
      title: "Total Projects",
      value: stats.totalProjects || 0,
      icon: Globe,
      color: "bg-slate-100",
      iconColor: "text-slate-700",
      description: "All time projects"
    },
    {
      title: "Active Projects",
      value: stats.activeProjects || 0,
      icon: Clock,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      description: "Currently running projects"
    },
    {
      title: "Total Pages Analyzed",
      value: stats.totalPagesAnalyzed || 0,
      icon: CheckCircle,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      description: "All pages processed"
    },
    {
      title: "Average Score",
      value: stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : "0.0%",
      icon: TrendingUp,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      description: "Overall performance"
    }
  ], [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {stat.title}
                  </p>
                  <div className="mb-1">
                    {loading ? (
                      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} ml-4`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

StatsCards.displayName = 'StatsCards'; 