'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, Crown, Star, Zap } from 'lucide-react';
import { useAppSelector } from '@/app/stores/hooks';
import { useEffect, useState } from 'react';
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';
import { formatTrialDaysRemaining } from '@/lib/utils/trialUtils';
import { TrialCountdown } from '@/components/ui/trial-countdown';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  provider?: string | null;
}

interface SubscriptionPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  current: boolean;
  popular?: boolean;
}

interface ProfileHeaderProps {
  profile: UserProfile | null;
  subscription: SubscriptionPlan | null;
}

export function ProfileHeader({ profile, subscription }: ProfileHeaderProps) {
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks unconditionally
  const subscriptionState = useAppSelector(state => state.subscription);
  const { isTrialActive, trialDaysRemaining, isTrialExpired, hasActiveSubscription } = useTrialStatus();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use Redux data after component is mounted to prevent hydration issues
  const activeSubscription = mounted ? subscriptionState?.activeSubscription : null;
  const isLoading = mounted ? subscriptionState?.isLoading || false : false;

  // Prioritize database subscription data over Redux state, but allow Redux to override if it's more recent
  const hasDatabaseSubscription = subscription && subscription.name && subscription.name !== 'Free';
  const hasReduxSubscription = activeSubscription && activeSubscription.plan_name;
  
  // Use Redux data if it exists and is different from database (indicating a recent change)
  // Otherwise, use database data as the source of truth
  const shouldUseRedux = hasReduxSubscription && (
    !hasDatabaseSubscription || 
    activeSubscription.plan_name !== subscription?.name ||
    activeSubscription.is_active
  );
  
  const currentPlanName = shouldUseRedux 
    ? activeSubscription.plan_name 
    : (hasDatabaseSubscription ? subscription.name : null);
    
  const currentPlanPeriod = shouldUseRedux
    ? (activeSubscription.billing_cycle === 'yearly' ? 'per year' : 'per month')
    : (hasDatabaseSubscription ? subscription.period : '');
    
  const currentPlanEndDate = hasReduxSubscription ? activeSubscription.end_date : null;

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Enterprise':
        return <Crown className="h-4 w-4" />;
      case 'Professional':
        return <Star className="h-4 w-4" />;
      case 'Starter':
        return <Zap className="h-4 w-4" />;
      default:
        return <Crown className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Enterprise':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white';
      case 'Professional':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white';
      case 'Starter':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
    }
  };

  const getPlanDisplayName = (planName: string) => {
    return planName || 'Free';
  };

  const getPlanPrice = () => {
    if (shouldUseRedux) {
      return activeSubscription.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly';
    }
    if (hasDatabaseSubscription) {
      return currentPlanPeriod;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Trial Countdown - Compact */}
      <TrialCountdown variant="compact" className="mb-4" />
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* User Avatar */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-4 border-slate-100 dark:border-slate-800">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                  : profile?.full_name 
                    ? profile.full_name.split(' ').length >= 2 
                      ? `${profile.full_name.split(' ')[0][0]}${profile.full_name.split(' ')[1][0]}`.toUpperCase()
                      : profile.full_name[0].toUpperCase()
                    : profile?.email 
                      ? profile.email[0].toUpperCase()
                      : 'U'
                }
              </div>
            )}
            {profile?.provider === 'google' && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : profile?.full_name || 'User'}
            </h1>
            <p className="text-muted-foreground mb-2">{profile?.email}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </span>
              {profile?.provider && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {profile.provider} login
                </Badge>
              )}
            </div>
          </div>

          {/* Current Plan Badge */}
          <div className="flex flex-col items-end gap-2">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : currentPlanName ? (
              <>
                <Badge className={`${getPlanColor(currentPlanName)} px-3 py-1`}>
                  {getPlanIcon(currentPlanName)}
                  <span className="ml-1">{getPlanDisplayName(currentPlanName)} Plan</span>
                </Badge>
                <p className="text-sm text-muted-foreground capitalize">
                  {getPlanPrice()} Billing
                </p>
                {currentPlanEndDate && (
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(currentPlanEndDate).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <>
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1">
                  <Crown className="h-4 w-4" />
                  <span className="ml-1">
                    {isTrialActive ? 'Free Trial' : 'Free Plan'}
                  </span>
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {isTrialActive 
                    ? `${formatTrialDaysRemaining(trialDaysRemaining)}`
                    : isTrialExpired 
                      ? 'Trial expired'
                      : 'No active subscription'
                  }
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
