import { useAppSelector } from '@/app/stores/hooks';
import { calculateTrialStatus, calculateTrialStatusFromDatabase } from '@/lib/utils/trialUtils';

export function useTrialStatus() {
  try {
    const userProfile = useAppSelector(state => state.userProfile.profile);
    const subscriptions = useAppSelector(state => state.subscription.subscriptions);
  
  // Get free trial days from environment variable
  const freeTrialDays = parseInt(process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS || '14');
  
  if (!userProfile) {
    return {
      isTrialActive: false,
      trialDaysRemaining: 0,
      trialEndDate: null,
      isTrialExpired: false,
      hasActiveSubscription: false,
      canUseService: false,
      trialStatus: null
    };
  }
  
  // Use database trial data if available, otherwise fallback to creation date calculation
  const trialStatus = userProfile.trial_end_date 
    ? calculateTrialStatusFromDatabase(userProfile)
    : calculateTrialStatus(userProfile.created_at, freeTrialDays);
  const hasActiveSubscription = subscriptions.some((sub: any) => sub.is_active);
  const canUseService = trialStatus.isTrialActive || hasActiveSubscription;
  
  return {
    ...trialStatus,
    hasActiveSubscription,
    canUseService,
    trialStatus
  };
  } catch (error) {
    console.error('Error in useTrialStatus:', error);
    return {
      isTrialActive: false,
      trialDaysRemaining: 0,
      trialEndDate: null,
      isTrialExpired: false,
      hasActiveSubscription: false,
      canUseService: false,
      trialStatus: null
    };
  }
}
