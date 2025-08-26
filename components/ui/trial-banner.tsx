'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Zap, Crown } from 'lucide-react';
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';
import { formatTrialDaysRemaining, getTrialStatusMessage } from '@/lib/utils/trialUtils';

interface TrialBannerProps {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

export function TrialBanner({ 
  className = '', 
  showUpgradeButton = true,
  onUpgradeClick 
}: TrialBannerProps) {
  const { 
    isTrialActive, 
    trialDaysRemaining, 
    isTrialExpired, 
    hasActiveSubscription 
  } = useTrialStatus();
  
  // Don't show banner if user has active subscription
  if (hasActiveSubscription) {
    return null;
  }
  
  // Don't show banner if no trial status available
  if (!isTrialActive && !isTrialExpired) {
    return null;
  }
  
  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default behavior: scroll to pricing plans or redirect to pricing page
      const pricingPlans = document.getElementById('pricing-plans');
      if (pricingPlans) {
        pricingPlans.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/pricing';
      }
    }
  };
  
  return (
    <Card className={`border-2 ${className} ${
      isTrialExpired 
        ? 'border-red-200 bg-red-50' 
        : trialDaysRemaining <= 3
        ? 'border-orange-200 bg-orange-50'
        : 'border-blue-200 bg-blue-50'
    }`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-3 ${
          isTrialExpired 
            ? 'text-red-800' 
            : trialDaysRemaining <= 3
            ? 'text-orange-800'
            : 'text-blue-800'
        }`}>
          {isTrialExpired ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <Clock className="h-6 w-6" />
          )}
          {isTrialExpired ? 'Free Trial Expired' : 'Free Trial Active'}
        </CardTitle>
        <CardDescription className={
          isTrialExpired 
            ? 'text-red-700' 
            : trialDaysRemaining <= 3
            ? 'text-orange-700'
            : 'text-blue-700'
        }>
          {getTrialStatusMessage({ 
            isTrialActive, 
            trialDaysRemaining, 
            trialEndDate: new Date(), 
            isTrialExpired 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">
                {isTrialExpired 
                  ? 'Trial ended' 
                  : formatTrialDaysRemaining(trialDaysRemaining)
                }
              </span>
            </div>
          </div>
          
          {showUpgradeButton && (
            <div className="flex gap-3">
              {isTrialExpired ? (
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleUpgradeClick}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleUpgradeClick}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
