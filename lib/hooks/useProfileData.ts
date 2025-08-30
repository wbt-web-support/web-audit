import { useState, useEffect, useCallback } from 'react';
import { AuditProject } from '@/lib/types/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  auth_method?: string;
  has_password?: boolean;
}

interface ProfileStats {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
}

interface ProfileData {
  profile: UserProfile | null;
  projects: AuditProject[];
  stats: ProfileStats | null;
}

interface UseProfileDataReturn {
  data: ProfileData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache for profile data
let profileDataCache: ProfileData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProfileData(): UseProfileDataReturn {
  const [data, setData] = useState<ProfileData>({
    profile: null,
    projects: [],
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const now = Date.now();
      if (profileDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
        setData(profileDataCache);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/profile/data');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile data');
      }

      const result = await response.json();
      
      // Update cache
      profileDataCache = result;
      cacheTimestamp = now;
      
      setData(result);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    // Clear cache to force fresh data
    profileDataCache = null;
    cacheTimestamp = 0;
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
