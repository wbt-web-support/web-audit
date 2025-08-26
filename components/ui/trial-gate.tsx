'use client';

import { ReactNode } from 'react';
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';
import { TrialBanner } from './trial-banner';

interface TrialGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  requireSubscription?: boolean;
}

export function TrialGate({ 
  children, 
  fallback, 
  showBanner = true,
  requireSubscription = false 
}: TrialGateProps) {
  const { canUseService, hasActiveSubscription, isTrialExpired } = useTrialStatus();
  
  // If requiring subscription, check if user has active subscription
  if (requireSubscription && !hasActiveSubscription) {
    return (
      <div className="space-y-4">
        {showBanner && <TrialBanner />}
        {fallback || (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Subscription Required
            </h3>
            <p className="text-gray-600 mb-4">
              This feature requires an active subscription. Please upgrade to continue.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // If trial is expired and no subscription, show upgrade prompt
  if (isTrialExpired && !hasActiveSubscription) {
    return (
      <div className="space-y-4">
        {showBanner && <TrialBanner />}
        {fallback || (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trial Expired
            </h3>
            <p className="text-gray-600 mb-4">
              Your free trial has expired. Please upgrade to continue using our services.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // If service can be used (trial active or subscription active), show children
  if (canUseService) {
    return <>{children}</>;
  }
  
  // Fallback for any other case
  return (
    <div className="space-y-4">
      {showBanner && <TrialBanner />}
      {fallback || (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600 mb-4">
            Please sign in to access this feature.
          </p>
        </div>
      )}
    </div>
  );
}
