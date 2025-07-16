'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { DashboardStatsCards } from './dashboard-stats-cards';
import { RecentSessions } from './recent-sessions';
import { CreateNewSession } from './CreateNewSession';
import type { AuditSession } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types/database';
import { SessionForm } from '@/components/audit/session-form';

export interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalPagesAnalyzed: number;
  averageScore: number;
  recentSessions: AuditSession[];
}

export function DashboardMain() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remove userName state and fetchUserName logic

  useEffect(() => {
    fetchDashboardStats();
    // Remove userName fetch
  }, []);

  const fetchDashboardStats = async () => {
    try {
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

  // Remove userName fetch

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

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

  if (!stats) {
    return null;
  }

  return (
    <div className="my-14 mx-4 md:mx-8 flex flex-col gap-4">
      <div className='max-w-4xl '>
        <h1 className="text-3xl font-bold">
          Welcome to your Web Audit Dashboard!
        </h1>
        <p className="text-muted-foreground mt-2">
          We audit your web pages for SEO, accessibility, performance, and content quality. Get actionable insights and detailed reports to help you improve your website. Start a new audit session or review your recent results below.
        </p>
      </div>
      <CreateNewSession sessions={stats.recentSessions}/>
      <RecentSessions sessions={stats.recentSessions} />
      
      {/* Statistics Cards */}
      {/* <DashboardStatsCards
        totalSessions={stats.totalSessions}
        activeSessions={stats.activeSessions}
        totalPagesAnalyzed={stats.totalPagesAnalyzed}
        averageScore={stats.averageScore}
      /> */}
      {/* <SessionForm mode='create' sessions={stats.recentSessions}/> */}
      {/* Recent Sessions */}
    </div>
  );
} 