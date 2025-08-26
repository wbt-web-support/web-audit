'use client';

import { useAppSelector } from '@/app/stores/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, Zap } from 'lucide-react';

export function SubscriptionStatus() {
  const userProfile = useAppSelector(state => state.userProfile.profile);
  
  if (!userProfile) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (userProfile.is_subscription_active) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (userProfile.is_trial_active) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = () => {
    if (userProfile.is_subscription_active) {
      return <Crown className="h-4 w-4" />;
    } else if (userProfile.is_trial_active) {
      return <Clock className="h-4 w-4" />;
    } else {
      return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (userProfile.is_subscription_active) {
      return 'Active Subscription';
    } else if (userProfile.is_trial_active) {
      return 'Free Trial Active';
    } else {
      return 'No Active Plan';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Subscription Status
        </CardTitle>
        <CardDescription>
          Your current plan and access status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Plan:</span>
          <span className="text-sm">
            {userProfile.active_plan_name || 'No plan'}
          </span>
        </div>
        
        {userProfile.active_plan_start_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Started:</span>
            <span className="text-sm">
              {formatDate(userProfile.active_plan_start_date)}
            </span>
          </div>
        )}
        
        {userProfile.active_plan_end_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires:</span>
            <span className="text-sm">
              {formatDate(userProfile.active_plan_end_date)}
            </span>
          </div>
        )}
        
        {userProfile.is_trial_active && userProfile.trial_end_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trial Ends:</span>
            <span className="text-sm">
              {formatDate(userProfile.trial_end_date)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
