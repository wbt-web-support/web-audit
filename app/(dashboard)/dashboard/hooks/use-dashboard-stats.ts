import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardStats } from '../components/dashboard-main';
import { cacheUtils, CACHE_KEYS } from '@/lib/cache';

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<void>;
  isStale: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (matching Redis TTL)
const STALE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Process backend API response to calculate dashboard statistics
 */
function processBackendData(backendData: any): DashboardStats {
  const projects = backendData.projects || backendData || [];
  
  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => 
    p.status === 'crawling' || p.status === 'analyzing' || p.status === 'pending'
  ).length;
  
  // Calculate total pages analyzed
  const totalPagesAnalyzed = projects.reduce((sum: number, project: any) => {
    return sum + (project.pages_analyzed || project.pages_crawled || 0);
  }, 0);
  
  // Calculate average score
  const projectsWithScores = projects.filter((p: any) => p.overall_score !== undefined && p.overall_score !== null);
  const averageScore = projectsWithScores.length > 0
    ? projectsWithScores.reduce((sum: number, p: any) => sum + (p.overall_score || 0), 0) / projectsWithScores.length
    : 0;
  
  // Get recent projects (last 5)
  const recentProjects = projects.slice(0, 5);
  
  return {
    totalProjects,
    activeProjects,
    totalPagesAnalyzed,
    averageScore: Math.round(averageScore),
    recentProjects,
  };
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);

  const fetchStats = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check global cache first
    if (!force && !hasInitialized.current) {
      const cachedStats = cacheUtils.getDashboardStats();
      if (cachedStats) {
        setStats(cachedStats as DashboardStats);
        setLastFetchTime(now);
        setLoading(false);
        hasInitialized.current = true;
        return;
      }
    }
    
    // Check if we have local cached data and it's still valid
    if (!force && stats && (now - lastFetchTime) < CACHE_DURATION) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile/projects/', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=30',
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the backend API response to calculate dashboard stats
      const processedStats = processBackendData(data);
      
      // Update both local state and global cache
      setStats(processedStats);
      setLastFetchTime(now);
      cacheUtils.setDashboardStats(processedStats);
      hasInitialized.current = true;
      
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [stats, lastFetchTime]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    
    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  // Auto-refresh stale data in background
  useEffect(() => {
    if (!stats) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if ((now - lastFetchTime) > STALE_DURATION) {
        // Fetch in background without showing loading state
        fetchStats(true).catch(console.error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [stats, lastFetchTime, fetchStats]);

  const refetch = useCallback(async (force = false) => {
    await fetchStats(force);
  }, [fetchStats]);

  const isStale = Date.now() - lastFetchTime > STALE_DURATION;

  return {
    stats,
    loading,
    error,
    refetch,
    isStale,
  };
}
