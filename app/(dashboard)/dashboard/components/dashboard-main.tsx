'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { XCircle, BarChart3 } from "lucide-react";
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchDashboardStats} className="mt-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Dashboard Header Section */}
        <DashboardHeader />
        
        {/* Project Creation Form */}
        <ProjectForm 
          mode="create" 
          projects={stats.recentProjects}
        />
        
        {/* Recent Projects List */}
        <RecentProjects projects={stats.recentProjects} />
        
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
    <div className="space-y-4">
      {/* Title and Icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Web Audit Dashboard
          </h1>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
        We audit your web pages for SEO, accessibility, performance, and content quality. 
        Get actionable insights and detailed reports to help you improve your website. 
        Start a new audit project or review your recent results below.
      </p>
    </div>
  );
} 