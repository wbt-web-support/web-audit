export interface TrialStatus {
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialEndDate: Date;
  isTrialExpired: boolean;
}

export interface DatabaseTrialData {
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  is_trial_active?: boolean | null;
  active_plan_name?: string | null;
  active_plan_start_date?: string | null;
  active_plan_end_date?: string | null;
  is_subscription_active?: boolean | null;
}

/**
 * Calculate trial status based on user creation date and trial days (legacy method)
 */
export function calculateTrialStatus(
  userCreatedAt: string | Date,
  trialDays: number = 14
): TrialStatus {
  const createdDate = new Date(userCreatedAt);
  const trialEndDate = new Date(createdDate);
  trialEndDate.setDate(createdDate.getDate() + trialDays);
  
  const now = new Date();
  const isTrialActive = now <= trialEndDate;
  const isTrialExpired = now > trialEndDate;
  
  // Calculate remaining days
  let trialDaysRemaining = 0;
  if (isTrialActive) {
    const timeDiff = trialEndDate.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  return {
    isTrialActive,
    trialDaysRemaining,
    trialEndDate,
    isTrialExpired
  };
}

/**
 * Calculate trial status based on database trial data (preferred method)
 */
export function calculateTrialStatusFromDatabase(
  trialData: DatabaseTrialData
): TrialStatus {
  const now = new Date();
  
  // If no trial data exists, return expired status
  if (!trialData.trial_end_date) {
    return {
      isTrialActive: false,
      trialDaysRemaining: 0,
      trialEndDate: now,
      isTrialExpired: true
    };
  }
  
  const trialEndDate = new Date(trialData.trial_end_date);
  const isTrialActive = trialData.is_trial_active === true && now <= trialEndDate;
  const isTrialExpired = now > trialEndDate;
  
  // Calculate remaining days
  let trialDaysRemaining = 0;
  if (isTrialActive) {
    const timeDiff = trialEndDate.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  return {
    isTrialActive,
    trialDaysRemaining,
    trialEndDate,
    isTrialExpired
  };
}

/**
 * Format trial days remaining in a user-friendly way
 */
export function formatTrialDaysRemaining(days: number): string {
  if (days === 0) {
    return 'Last day';
  } else if (days === 1) {
    return '1 day left';
  } else if (days < 7) {
    return `${days} days left`;
  } else {
    const weeks = Math.ceil(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} left`;
  }
}

/**
 * Get trial status message
 */
export function getTrialStatusMessage(status: TrialStatus): string {
  if (status.isTrialExpired) {
    return 'Your free trial has expired. Please upgrade to continue using our services.';
  } else if (status.trialDaysRemaining <= 3) {
    return `Your free trial ends in ${status.trialDaysRemaining} day${status.trialDaysRemaining > 1 ? 's' : ''}. Upgrade now to continue!`;
  } else {
    return `You have ${formatTrialDaysRemaining(status.trialDaysRemaining)} in your free trial.`;
  }
}
