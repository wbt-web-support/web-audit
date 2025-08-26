import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/stores/hooks';
import { setSubscriptions, setLoading, setError, UserSubscription } from '@/app/stores/subscriptionSlice';
import { setProfile, UserProfile } from '@/app/stores/userProfileSlice';
import { calculateTrialStatus, calculateTrialStatusFromDatabase } from '@/lib/utils/trialUtils';
import { CACHE_KEYS, CACHE_DURATIONS, saveToCache, loadFromCache, clearCache } from '@/lib/utils/cache-utils';

interface UseSubscriptionDataReturn {
  subscriptions: UserSubscription[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<void>;
  isStale: boolean;
}

export function useSubscriptionData(): UseSubscriptionDataReturn {
  const dispatch = useAppDispatch();
  const subscriptionState = useAppSelector(state => state.subscription);
  const userProfileState = useAppSelector(state => state.userProfile);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialized = useRef(false);

  const fetchSubscriptionData = useCallback(async (force = false) => {
    const now = Date.now();
    
    if (!force && lastFetchTime > 0 && (now - lastFetchTime) < CACHE_DURATIONS.MEDIUM) {
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      
      const [subscriptionsResponse, profileResponse] = await Promise.all([
        fetch('/api/subscriptions', {
          signal: abortControllerRef.current.signal,
          headers: { 'Cache-Control': 'max-age=300' },
        }),
        fetch('/api/profile', {
          signal: abortControllerRef.current.signal,
          headers: { 'Cache-Control': 'max-age=300' },
        })
      ]);

      if (!subscriptionsResponse.ok) {
        throw new Error(`Failed to fetch subscriptions: ${subscriptionsResponse.status}`);
      }
      const subscriptionsData = await subscriptionsResponse.json();
      const subscriptions = subscriptionsData.data || [];
      
      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }
      const profileData = await profileResponse.json();
      const profile = profileData.data || profileData;

      const freeTrialDays = parseInt(process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS || '14');
      let processedProfile = profile;

      if (profile.trial_end_date) {
        const trialStatus = calculateTrialStatusFromDatabase(profile);
        processedProfile = {
          ...profile,
          trial_days_remaining: trialStatus.trialDaysRemaining
        };
      } else if (profile.created_at) {
        const trialStatus = calculateTrialStatus(profile.created_at, freeTrialDays);
        processedProfile = {
          ...profile,
          trial_start_date: profile.created_at,
          trial_end_date: trialStatus.trialEndDate.toISOString(),
          is_trial_active: trialStatus.isTrialActive,
          trial_days_remaining: trialStatus.trialDaysRemaining
        };
      }

      dispatch(setSubscriptions(subscriptions));
      dispatch(setProfile(processedProfile));
      setLastFetchTime(now);

      saveToCache(CACHE_KEYS.SUBSCRIPTION_DATA, subscriptions);
      saveToCache(CACHE_KEYS.USER_PROFILE, processedProfile);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, lastFetchTime]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const cachedSubscriptions = loadFromCache<UserSubscription[]>(CACHE_KEYS.SUBSCRIPTION_DATA);
    const cachedProfile = loadFromCache<UserProfile>(CACHE_KEYS.USER_PROFILE);
    
    if (cachedSubscriptions && cachedProfile) {
      dispatch(setSubscriptions(cachedSubscriptions));
      dispatch(setProfile(cachedProfile));
      setLastFetchTime(Date.now());
      setIsLoading(false);
      
      fetchSubscriptionData(true).catch(console.error);
    } else {
      fetchSubscriptionData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSubscriptionData, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if ((now - lastFetchTime) > CACHE_DURATIONS.LONG) {
        fetchSubscriptionData(true).catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastFetchTime, fetchSubscriptionData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && lastFetchTime > 0) {
        const now = Date.now();
        if ((now - lastFetchTime) > CACHE_DURATIONS.MEDIUM) {
          fetchSubscriptionData(true).catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastFetchTime, fetchSubscriptionData]);

  const refetch = useCallback(async (force = false) => {
    if (force) {
      clearCache(CACHE_KEYS.SUBSCRIPTION_DATA);
      clearCache(CACHE_KEYS.USER_PROFILE);
    }
    await fetchSubscriptionData(force);
  }, [fetchSubscriptionData]);

  const isStale = Date.now() - lastFetchTime > CACHE_DURATIONS.LONG;

  return {
    subscriptions: subscriptionState?.subscriptions || [],
    userProfile: userProfileState?.profile || null,
    isLoading,
    error,
    refetch,
    isStale,
  };
}
