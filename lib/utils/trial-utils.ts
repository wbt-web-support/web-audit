import { createClient } from '@/lib/supabase/client';

export interface TrialData {
  trial_start_date: string;
  trial_end_date: string;
  is_trial_active: boolean;
  active_plan_name: string;
  active_plan_start_date: string;
  active_plan_end_date: string;
  is_subscription_active: boolean;
  current_plan_id: string;
  current_plan_name: string;
  subscription_status: string;
}

export async function initializeTrialForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { success: false, error: `Session error: ${sessionError.message}` };
    }
    
    if (!session) {
      return { success: false, error: 'No active session' };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return { success: false, error: 'Profile not found' };
      }
      return { success: false, error: `Profile error: ${profileError.message}` };
    }

    // Check if trial has already been initialized
    if (profile.trial_start_date && profile.trial_end_date && profile.active_plan_name) {
      return { success: true };
    }

    // Calculate trial dates (14 days from now)
    const trialStartDate = profile.created_at || new Date().toISOString();
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Initialize trial data (only update columns that exist)
    const updateData: any = {
      trial_start_date: trialStartDate,
      trial_end_date: trialEndDate,
      is_trial_active: true,
      active_plan_name: 'Free Trial',
      active_plan_start_date: trialStartDate,
      active_plan_end_date: trialEndDate,
      is_subscription_active: false,
      updated_at: new Date().toISOString()
    };

    // Only add these fields if they exist in the table
    // These might not exist if migrations haven't been applied yet
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } catch (error) {
      // If the update fails due to missing columns, try a simpler update
      const simpleUpdateData = {
        trial_start_date: trialStartDate,
        trial_end_date: trialEndDate,
        is_trial_active: true,
        active_plan_name: 'Free Trial',
        active_plan_start_date: trialStartDate,
        active_plan_end_date: trialEndDate,
        is_subscription_active: false,
        updated_at: new Date().toISOString()
      };

      const { error: simpleUpdateError } = await supabase
        .from('user_profiles')
        .update(simpleUpdateData)
        .eq('id', userId);

      if (simpleUpdateError) {
        return { success: false, error: simpleUpdateError.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function isTrialExpired(trialEndDate: string): boolean {
  return new Date(trialEndDate) < new Date();
}

export function getTrialDaysRemaining(trialEndDate: string): number {
  const endDate = new Date(trialEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatTrialStatus(trialEndDate: string, isTrialActive: boolean): string {
  if (!isTrialActive) {
    return 'Expired';
  }
  
  const daysRemaining = getTrialDaysRemaining(trialEndDate);
  if (daysRemaining === 0) {
    return 'Expires today';
  } else if (daysRemaining === 1) {
    return 'Expires tomorrow';
  } else {
    return `${daysRemaining} days remaining`;
  }
}
