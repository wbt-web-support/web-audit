import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlanName, BillingCycle } from '@/lib/types/database';

export interface SubscriptionUpdateData {
  planName: PlanName;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
}

/**
 * Update user profile with new subscription data
 */
export async function updateUserSubscription(subscriptionData: SubscriptionUpdateData) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        active_plan_name: subscriptionData.planName,
        active_plan_start_date: subscriptionData.startDate.toISOString(),
        active_plan_end_date: subscriptionData.endDate.toISOString(),
        is_subscription_active: true,
        is_trial_active: false, // End trial when subscription starts
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return { data: null, error };
  }
}

/**
 * Calculate subscription end date based on billing cycle
 */
export function calculateSubscriptionEndDate(
  startDate: Date, 
  billingCycle: BillingCycle
): Date {
  const endDate = new Date(startDate);
  
  switch (billingCycle) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
  }
  
  return endDate;
}

/**
 * Get subscription status for a user
 */
export async function getUserSubscriptionStatus() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        active_plan_name,
        active_plan_start_date,
        active_plan_end_date,
        is_subscription_active,
        trial_start_date,
        trial_end_date,
        is_trial_active
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { data: null, error };
  }
}
