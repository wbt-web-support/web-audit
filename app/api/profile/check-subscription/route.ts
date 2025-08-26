import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if trial has expired
    let isTrialActive = profile.is_trial_active;
    if (profile.is_trial_active && profile.trial_end_date) {
      const trialEndDate = new Date(profile.trial_end_date);
      if (trialEndDate < new Date()) {
        isTrialActive = false;
      }
    }

    // Check if subscription has expired
    let isSubscriptionActive = profile.is_subscription_active;
    let activePlanName = profile.active_plan_name;
    if (profile.is_subscription_active && profile.active_plan_end_date) {
      const subscriptionEndDate = new Date(profile.active_plan_end_date);
      if (subscriptionEndDate < new Date()) {
        isSubscriptionActive = false;
        activePlanName = null;
      }
    }

    // Update profile if status changed
    if (isTrialActive !== profile.is_trial_active || 
        isSubscriptionActive !== profile.is_subscription_active ||
        activePlanName !== profile.active_plan_name) {
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          is_trial_active: isTrialActive,
          is_subscription_active: isSubscriptionActive,
          active_plan_name: activePlanName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return NextResponse.json({ data: updatedProfile });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
