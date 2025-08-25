import { useState, useEffect, useCallback } from 'react';
import { UserSubscription, CreateSubscriptionRequest, SwitchActivePlanRequest } from '@/lib/types/database';

interface UseSubscriptionsReturn {
  subscriptions: UserSubscription[];
  activeSubscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;
  createSubscription: (request: CreateSubscriptionRequest) => Promise<UserSubscription>;
  switchActivePlan: (request: SwitchActivePlanRequest) => Promise<UserSubscription>;
  refreshSubscriptions: () => Promise<void>;
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/subscriptions');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.data || []);
      
      // Find active subscription
      const active = data.data?.find((sub: UserSubscription) => sub.is_active) || null;
      setActiveSubscription(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (request: CreateSubscriptionRequest): Promise<UserSubscription> => {
    try {
      setError(null);
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const data = await response.json();
      
      // Refresh subscriptions to get updated list
      await fetchSubscriptions();
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchSubscriptions]);

  const switchActivePlan = useCallback(async (request: SwitchActivePlanRequest): Promise<UserSubscription> => {
    try {
      setError(null);
      const response = await fetch('/api/subscriptions/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch active plan');
      }

      const data = await response.json();
      
      // Refresh subscriptions to get updated list
      await fetchSubscriptions();
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch active plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchSubscriptions]);

  const refreshSubscriptions = useCallback(async () => {
    await fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    activeSubscription,
    isLoading,
    error,
    createSubscription,
    switchActivePlan,
    refreshSubscriptions,
  };
}
