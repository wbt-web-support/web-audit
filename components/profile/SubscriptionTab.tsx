'use client';

import { useEffect, useState } from 'react';
import { PricingPlan } from '@/lib/pricing';
import { SubscriptionManager } from '@/components/subscriptions/SubscriptionManager';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSubscriptions, setLoading, setError } from '@/lib/store/slices/subscriptionSlice';

interface SubscriptionTabProps {
  plans: PricingPlan[];
  billingPeriod: string;
  onBillingPeriodChange: (period: string) => void;
}

export function SubscriptionTab({ 
  plans, 
  billingPeriod, 
  onBillingPeriodChange
}: SubscriptionTabProps) {
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks unconditionally
  const dispatch = useAppDispatch();
  const subscriptionState = useAppSelector(state => state.subscription);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use Redux data after component is mounted to prevent hydration issues
  const subscriptions = mounted ? subscriptionState?.subscriptions || [] : [];
  const isLoading = mounted ? subscriptionState?.isLoading || false : false;

  // Fetch subscriptions on component mount (only after mounted)
  useEffect(() => {
    if (!mounted) return;

    const fetchSubscriptions = async () => {
      try {
        dispatch(setLoading(true));
        const response = await fetch('/api/subscriptions');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch subscriptions');
        }

        const data = await response.json();
        dispatch(setSubscriptions(data.data || []));
      } catch (error) {
        dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch subscriptions'));
        console.error('Error fetching subscriptions:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchSubscriptions();
  }, [dispatch, mounted]);

  return (
    <SubscriptionManager 
      plans={plans}
      billingPeriod={billingPeriod}
      onBillingPeriodChange={onBillingPeriodChange}
    />
  );
}
