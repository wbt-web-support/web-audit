import { createClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
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

    // Check if trial has already been initialized
    if (profile.trial_start_date && profile.trial_end_date) {
      return NextResponse.json({ 
        data: profile,
        message: 'Trial already initialized' 
      });
    }

    // Get free trial days from environment variable
    const freeTrialDays = parseInt(process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS || '14');
    
    // Calculate trial dates
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + freeTrialDays);

    // Update profile with trial information
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        is_trial_active: true,
        active_plan_name: 'Free Trial',
        active_plan_start_date: trialStartDate.toISOString(),
        active_plan_end_date: trialEndDate.toISOString(),
        is_subscription_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with trial data:', updateError);
      return NextResponse.json({ error: 'Failed to initialize trial' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedProfile,
      message: 'Trial initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing trial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
