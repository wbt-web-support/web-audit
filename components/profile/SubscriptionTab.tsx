'use client';

import { useEffect, useState } from 'react';
import { PricingPlan } from '@/lib/pricing';
import { SubscriptionManager } from '@/components/subscriptions/SubscriptionManager';
import { calculateTrialStatus, calculateTrialStatusFromDatabase } from '@/lib/utils/trialUtils';
import { TrialDaysCard } from '@/components/ui/trial-days-card';
import { useTrialInitialization } from '@/lib/hooks/useTrialInitialization';
import { useSubscriptionData } from '@/lib/hooks/useSubscriptionData';

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
  
  // Use the cached subscription data hook
  const { 
    subscriptions, 
    userProfile, 
    isLoading, 
    error, 
    refetch, 
    isStale 
  } = useSubscriptionData();
  
  // Initialize trial for new users
  const { isInitializing } = useTrialInitialization();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get free trial days from environment variable
  const freeTrialDays = parseInt(process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS || '14');

  // Calculate trial status using database trial data (preferred) or fallback to creation date
  const trialStatus = userProfile 
    ? (userProfile.trial_end_date 
        ? calculateTrialStatusFromDatabase(userProfile)
        : userProfile.created_at 
          ? calculateTrialStatus(userProfile.created_at, freeTrialDays)
          : null)
    : null;
  const hasActiveSubscription = subscriptions.some((sub: any) => sub.is_active);
  const showTrialBanner = trialStatus && !hasActiveSubscription;

  // Show stale data indicator
  if (isStale && mounted) {
    console.log('Subscription data may be stale, refreshing in background...');
  }

  // Show error state
  if (error && mounted) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Failed to load subscription data
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
              <button 
                onClick={() => refetch(true)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state only if no cached data is available
  if (isLoading && mounted && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stale data indicator */}
      {isStale && mounted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-800">
              Data may be stale, refreshing in background...
            </span>
          </div>
        </div>
      )}

      {/* Simple Trial Notification */}
      <TrialDaysCard />

      {/* Subscription Manager */}
      <div id="pricing-plans">
        <SubscriptionManager 
          plans={plans}
          billingPeriod={billingPeriod}
          onBillingPeriodChange={onBillingPeriodChange}
        />
      </div>
    </div>
  );
}
