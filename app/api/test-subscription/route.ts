import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { userId, planId, billingPeriod = 'month' } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'userId and planId are required' }, { status: 400 });
    }

    console.log('Testing subscription creation:', { userId, planId, billingPeriod });

    // Get plan details
    const { getPlanById } = await import('@/lib/pricing');
    const plan = getPlanById(planId);

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Calculate period end date
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === 'year' || billingPeriod === 'yearly' || billingPeriod === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // First, deactivate all existing plans for this user
    const { error: deactivateError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'inactive' })
      .eq('user_id', userId);

    if (deactivateError) {
      console.error('Error deactivating existing plans:', deactivateError);
      return NextResponse.json({ error: 'Failed to deactivate existing plans', details: deactivateError }, { status: 500 });
    }

    // Insert new subscription
    const { data: subscriptionData, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: `test_sub_${Date.now()}`, // Generate a test subscription ID
        plan_id: planId,
        billing_period: billingPeriod,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting subscription:', insertError);
      return NextResponse.json({ error: 'Failed to insert subscription', details: insertError }, { status: 500 });
    }

    // Update user profile with subscription info
    const { error: profileError } = await supabase
      .rpc('update_user_subscription_info', {
        p_user_id: userId,
        p_plan_id: planId,
        p_plan_name: plan.name,
        p_billing_period: billingPeriod,
        p_status: 'active',
        p_stripe_subscription_id: `test_sub_${Date.now()}`,
        p_start_date: now.toISOString(),
        p_end_date: periodEnd.toISOString()
      });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    // Create billing history entry
    const { error: billingHistoryError } = await supabase
      .rpc('create_billing_history_entry', {
        p_user_id: userId,
        p_subscription_id: subscriptionData.id,
        p_stripe_invoice_id: `test_invoice_${Date.now()}`,
        p_amount: plan.price,
        p_status: 'completed',
        p_description: `${plan.name} Plan - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        p_plan_name: plan.name,
        p_billing_period: billingPeriod,
        p_invoice_url: undefined
      });

    if (billingHistoryError) {
      console.error('Error creating billing history entry:', billingHistoryError);
    }

    console.log('Test subscription created successfully:', subscriptionData);

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
      message: 'Test subscription created successfully'
    });

  } catch (error) {
    console.error('Test subscription error:', error);
    return NextResponse.json(
      { error: 'Test subscription failed', details: error },
      { status: 500 }
    );
  }
}
