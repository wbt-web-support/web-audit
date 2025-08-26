import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardStats } from '../components/dashboard-main';
import { CACHE_KEYS, CACHE_DURATIONS, saveToCache, loadFromCache, clearCache } from '@/lib/utils/cache-utils';

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<void>;
  isStale: boolean;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialized = useRef(false);

  const fetchStats = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check if we have cached data and it's still valid
    if (!force && stats && (now - lastFetchTime) < CACHE_DURATIONS.MEDIUM) {
      setLoading(false);
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
      
      const response = await fetch('/api/dashboard/stats', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
      setLastFetchTime(now);
      
      // Save to localStorage for instant loading on tab switch
      saveToCache(CACHE_KEYS.DASHBOARD_STATS, data);
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

  // Initial load - try cache first, then fetch fresh data
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Try to load from cache first for instant display
    const cachedStats = loadFromCache<DashboardStats>(CACHE_KEYS.DASHBOARD_STATS);
    if (cachedStats) {
      setStats(cachedStats);
      setLastFetchTime(Date.now());
      setLoading(false);
      
      // Fetch fresh data in background
      fetchStats(true).catch(console.error);
    } else {
      // No cache, fetch fresh data
      fetchStats();
    }
    
    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  // Auto-refresh stale data in background (less frequent)
  useEffect(() => {
    if (!stats) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if ((now - lastFetchTime) > CACHE_DURATIONS.LONG) {
        // Fetch in background without showing loading state
        fetchStats(true).catch(console.error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [stats, lastFetchTime, fetchStats]);

  const refetch = useCallback(async (force = false) => {
    if (force) {
      clearCache(CACHE_KEYS.DASHBOARD_STATS); // Clear cache on force refresh
    }
    await fetchStats(force);
  }, [fetchStats]);

  const isStale = Date.now() - lastFetchTime > CACHE_DURATIONS.LONG;

  return {
    stats,
    loading,
    error,
    refetch,
    isStale,
  };
}
