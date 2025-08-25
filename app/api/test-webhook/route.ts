import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { planId = 'professional', billingPeriod = 'month', userId } = await request.json();

    let testUserId: string;

    if (userId) {
      // Validate UUID format if userId is provided
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        return NextResponse.json({ error: 'userId must be a valid UUID' }, { status: 400 });
      }
      testUserId = userId;
    } else {
      // Get current user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
      }
      
      testUserId = user.id;
    }

    // Get plan details
    const { getPlanById } = await import('@/lib/pricing');
    const plan = getPlanById(planId);

    // Simulate a webhook event by directly inserting subscription data
    const { data: subscriptionData, error: insertError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: testUserId,
        stripe_subscription_id: 'test_webhook_' + Date.now(),
        plan_id: planId,
        billing_period: billingPeriod,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting test subscription:', insertError);
      return NextResponse.json({ 
        error: 'Failed to insert test subscription', 
        details: insertError 
      }, { status: 500 });
    }

    // Update user profile with subscription info
    const { error: profileError } = await supabase
      .rpc('update_user_subscription_info', {
        p_user_id: testUserId,
        p_plan_id: planId,
        p_plan_name: plan?.name || 'Professional',
        p_billing_period: billingPeriod,
        p_status: 'active',
        p_stripe_subscription_id: subscriptionData.stripe_subscription_id,
        p_start_date: new Date().toISOString(),
        p_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    return NextResponse.json({
      message: 'Test webhook subscription created',
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
