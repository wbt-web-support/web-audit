'use client';

import { useEffect, useState } from 'react';
import { PricingPlan } from '@/lib/pricing';
import { SubscriptionManager } from '@/components/subscriptions/SubscriptionManager';
import { useAppDispatch, useAppSelector } from '@/app/stores/hooks';
import { setSubscriptions, setLoading, setError } from '@/app/stores/subscriptionSlice';
import { setProfile } from '@/app/stores/userProfileSlice';
import { calculateTrialStatus, calculateTrialStatusFromDatabase } from '@/lib/utils/trialUtils';
import { TrialCountdown } from '@/components/ui/trial-countdown';
import { TrialDaysCard } from '@/components/ui/trial-days-card';
import { useTrialInitialization } from '@/lib/hooks/useTrialInitialization';

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
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Always call hooks unconditionally
  const dispatch = useAppDispatch();
  const subscriptionState = useAppSelector(state => state.subscription);
  const userProfileState = useAppSelector(state => state.userProfile);
  
  // Initialize trial for new users
  const { isInitializing } = useTrialInitialization();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use Redux data after component is mounted to prevent hydration issues
  const subscriptions = mounted ? subscriptionState?.subscriptions || [] : [];
  const isLoading = mounted ? subscriptionState?.isLoading || false : false;
  const userProfile = mounted ? userProfileState?.profile || null : null;

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

  // Fetch subscriptions on component mount (only after mounted)
  useEffect(() => {
    if (!mounted) return;

    const fetchSubscriptions = async () => {
      try {
        dispatch(setLoading(true));
        const response = await fetch('/api/subscriptions');
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (jsonError) {
            const textResponse = await response.text();
            console.error('Failed to parse error response:', textResponse);
            throw new Error('Failed to fetch subscriptions');
          }
          throw new Error(errorData.error || 'Failed to fetch subscriptions');
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse subscriptions response:', jsonError);
          const textResponse = await response.text();
          console.error('Response text:', textResponse);
          throw new Error('Failed to parse subscriptions response');
        }
        dispatch(setSubscriptions(data.data || []));
      } catch (error) {
        dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch subscriptions'));
        console.error('Error fetching subscriptions:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await fetch('/api/profile');
        
        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            const textResponse = await response.text();
            console.error('Response text:', textResponse);
            return;
          }
          
          const profile = data.data || data; // Handle both {data: profile} and direct profile
          
          // Check if profile exists
          if (profile) {
            // If profile has database trial data, use it directly
            if (profile.trial_end_date) {
              const trialStatus = calculateTrialStatusFromDatabase(profile);
              const profileWithTrial = {
                ...profile,
                trial_days_remaining: trialStatus.trialDaysRemaining
              };
              dispatch(setProfile(profileWithTrial));
            } 
            // Fallback to calculating from creation date if no database trial data
            else if (profile.created_at) {
              const trialStatus = calculateTrialStatus(profile.created_at, freeTrialDays);
              const profileWithTrial = {
                ...profile,
                trial_start_date: profile.created_at,
                trial_end_date: trialStatus.trialEndDate.toISOString(),
                is_trial_active: trialStatus.isTrialActive,
                trial_days_remaining: trialStatus.trialDaysRemaining
              };
              dispatch(setProfile(profileWithTrial));
            } else {
              console.warn('Profile data is missing or incomplete:', profile);
            }
          }
        } else {
          console.error('Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchSubscriptions();
    fetchUserProfile();
  }, [dispatch, mounted, freeTrialDays]);

  if (isLoading || profileLoading || isInitializing) {
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
