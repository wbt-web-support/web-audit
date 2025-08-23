'use client';

import { useMemo, useState, useEffect } from 'react';
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

/**
 * Main dashboard component that displays:
 * - Dashboard header with title and description
 * - Statistics cards
 * - Project creation form
 * - Recent projects list
 * - Loading and error states
 */
export function DashboardMain() {
  const { stats, loading, error, refetch, isStale } = useDashboardStats();
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [debouncedLoading, setDebouncedLoading] = useState(true);
  
  // Auto-project creation hook
  const { websiteUrl, isCreating, hasAttempted } = useAutoProjectCreation({
    onProjectCreated: (projectId) => {
      console.log('Auto-created project:', projectId);
      // Optionally refresh stats after project creation
      refetch(true);
    }
  });

  // Ensure minimum loading time to prevent flash
  useEffect(() => {
    if (!loading && stats) {
      const timer = setTimeout(() => {
        setMinLoadingTime(false);
      }, 300); // 300ms minimum loading time
      return () => clearTimeout(timer);
    }
  }, [loading, stats]);

  // Debounce loading state to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(loading);
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
  }, [loading]);

  // Loading state - show skeleton while fetching data
  if (debouncedLoading || minLoadingTime) {
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
  if (!stats) {
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
          {loading && stats && (
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
          <StatsCards stats={stats} loading={debouncedLoading} />
        </div>
        
        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Project Creation Form - Takes 50% of the space */}
          <div className="space-y-6">
            <ProjectForm 
              mode="create" 
              projects={stats.recentProjects}
            />
          </div>
          
          {/* Recent Projects - Takes 50% of the space */}
          <div className="space-y-6">
            <RecentProjects 
              projects={stats.recentProjects} 
              loading={debouncedLoading}
            />
          </div>
          
        </div>
        
        {/* Performance Monitor */}
        <PerformanceMonitor 
          loading={loading}
          error={error}
          onLoadComplete={() => {
            // Optional: Log performance metrics
            console.log('Dashboard load completed');
          }}
        />
        
      </div>
    </div>
  );
}

/**
 * Dashboard header component with title, icon, and description
 * Separated for better component organization
 */
function DashboardHeader() {
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
}

/**
 * Statistics cards component displaying key metrics
 * Shows 0 values for new users with no projects
 * Memoized to prevent unnecessary re-renders
 */
const StatsCards = React.memo(({ stats, loading }: { stats: DashboardStats, loading: boolean }) => {
  const statCards = [
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
  ];

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