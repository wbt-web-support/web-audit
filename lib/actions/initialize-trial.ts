'use server';

import { createClient } from '@/lib/supabase/server';

export async function initializeTrialAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return { success: false, error: `Authentication error: ${authError.message}` };
    }
    
    if (!user) {
      return { success: false, error: 'No authenticated user found' };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
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

    // Initialize trial data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        trial_start_date: trialStartDate,
        trial_end_date: trialEndDate,
        is_trial_active: true,
        active_plan_name: 'Free Trial',
        active_plan_start_date: trialStartDate,
        active_plan_end_date: trialEndDate,
        is_subscription_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: `Update error: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
