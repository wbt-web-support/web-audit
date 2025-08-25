import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Convert planId to plan_name (capitalize first letter)
    const planName = planId.charAt(0).toUpperCase() + planId.slice(1);

    // First, verify that the user owns this plan
    const { data: userPlan, error: planError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_name', planName)
      .single();

    if (planError || !userPlan) {
      return NextResponse.json({ error: 'Plan not found or not owned by user' }, { status: 404 });
    }

    // Check if plan is expired
    if (userPlan.end_date && new Date(userPlan.end_date) < new Date()) {
      return NextResponse.json({ error: 'Plan has expired' }, { status: 400 });
    }

    // Deactivate all other plans for this user by setting is_active to false
    const { error: deactivateError } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (deactivateError) {
      console.error('Error deactivating other plans:', deactivateError);
      return NextResponse.json({ error: 'Failed to deactivate other plans' }, { status: 500 });
    }

    // Activate the selected plan
    const { error: activateError } = await supabase
      .from('user_subscriptions')
      .update({ is_active: true })
      .eq('user_id', user.id)
      .eq('plan_name', planName);

    if (activateError) {
      console.error('Error activating plan:', activateError);
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan activated successfully',
      activePlanId: planId 
    });

  } catch (error) {
    console.error('Error in activate-plan API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
