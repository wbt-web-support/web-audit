'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, BarChart3, Plus, TrendingUp, Globe, Clock, CheckCircle } from "lucide-react";
import { RecentProjects } from './recent-projects';
import { ProjectForm } from '@/components/audit/project-form';
import { DashboardSkeleton } from '@/components/skeletons';
import type { AuditProject } from '@/lib/types/database';

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
  // State management for dashboard data and UI states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  /**
   * Fetches dashboard statistics from the API
   * Handles loading states and error handling
   */
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Loading state - show skeleton while fetching data
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Error state - show error message with retry button
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center py-8 max-w-md mx-auto">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Something went wrong</h2>
          <p className="mb-6 text-slate-600">{error}</p>
          <Button onClick={fetchDashboardStats} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Safety check - return null if no stats data
  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header Section */}
        <DashboardHeader />
        
        {/* Statistics Cards */}
        <StatsCards stats={stats} />
        
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
            <RecentProjects projects={stats.recentProjects} />
          </div>
          
        </div>
        
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
 */
function StatsCards({ stats }: { stats: DashboardStats }) {
  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: Globe,
      color: "bg-slate-100",
      iconColor: "text-slate-700",
      description: "All time projects"
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: Clock,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      description: "Currently running"
    },
    {
      title: "Pages Analyzed",
      value: stats.totalPagesAnalyzed,
      icon: CheckCircle,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      description: "Total pages processed"
    },
    {
      title: "Average Score",
      value: `${stats.averageScore.toFixed(1)}%`,
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
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </p>
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
} 