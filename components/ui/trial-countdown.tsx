'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Zap, Crown } from 'lucide-react';
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';
import { formatTrialDaysRemaining, getTrialStatusMessage } from '@/lib/utils/trialUtils';

interface TrialCountdownProps {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  variant?: 'compact' | 'full';
}

export function TrialCountdown({ 
  className = '', 
  showUpgradeButton = true,
  onUpgradeClick,
  variant = 'full'
}: TrialCountdownProps) {
  try {
    const { 
      isTrialActive, 
      trialDaysRemaining, 
      isTrialExpired, 
      hasActiveSubscription 
    } = useTrialStatus();
  
  // Don't show countdown if user has active subscription
  if (hasActiveSubscription) {
    return null;
  }
  
  // Don't show countdown if no trial status available
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

  // Compact variant for smaller display
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
        isTrialExpired 
          ? 'border-red-200 bg-red-50' 
          : trialDaysRemaining <= 3
          ? 'border-orange-200 bg-orange-50'
          : 'border-blue-200 bg-blue-50'
      } ${className}`}>
        <div className="flex items-center gap-3">
          {isTrialExpired ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-blue-600" />
          )}
          <div>
            <p className={`font-medium ${
              isTrialExpired 
                ? 'text-red-800' 
                : trialDaysRemaining <= 3
                ? 'text-orange-800'
                : 'text-blue-800'
            }`}>
              {isTrialExpired ? 'Trial Expired' : 'Free Trial'}
            </p>
            <p className={`text-sm ${
              isTrialExpired 
                ? 'text-red-700' 
                : trialDaysRemaining <= 3
                ? 'text-orange-700'
                : 'text-blue-700'
            }`}>
              {isTrialExpired 
                ? 'Upgrade to continue' 
                : formatTrialDaysRemaining(trialDaysRemaining)
              }
            </p>
          </div>
        </div>
        
        {showUpgradeButton && (
          <Button 
            size="sm"
            className={
              isTrialExpired 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }
            onClick={handleUpgradeClick}
          >
            <Crown className="h-4 w-4 mr-2" />
            {isTrialExpired ? 'Upgrade' : 'View Plans'}
          </Button>
        )}
      </div>
    );
  }

  // Full variant with more details
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
          {isTrialExpired ? 'Free Trial Expired' : 'Free Trial Countdown'}
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
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                isTrialExpired 
                  ? 'text-red-600' 
                  : trialDaysRemaining <= 3
                  ? 'text-orange-600'
                  : 'text-blue-600'
              }`}>
                {isTrialExpired ? '0' : trialDaysRemaining}
              </div>
              <div className={`text-sm ${
                isTrialExpired 
                  ? 'text-red-700' 
                  : trialDaysRemaining <= 3
                  ? 'text-orange-700'
                  : 'text-blue-700'
              }`}>
                {isTrialExpired ? 'Days' : 'Days Left'}
              </div>
            </div>
            
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
  } catch (error) {
    console.error('Error in TrialCountdown:', error);
    return null; // Don't render anything if there's an error
  }
}
