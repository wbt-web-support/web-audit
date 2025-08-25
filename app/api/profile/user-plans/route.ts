import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's subscriptions using the new schema
    const { data: userSubscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        plan_name,
        billing_cycle,
        is_active,
        end_date,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('Error fetching user subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Failed to fetch user plans' }, { status: 500 });
    }

    // Transform the data to match the expected interface
    const userPlans = userSubscriptions?.map(subscription => {
      return {
        id: subscription.id,
        planId: subscription.plan_name.toLowerCase(),
        planName: subscription.plan_name,
        isActive: subscription.is_active,
        purchasedAt: subscription.created_at,
        expiresAt: subscription.end_date,
        billingCycle: subscription.billing_cycle
      };
    }) || [];

    return NextResponse.json(userPlans);

  } catch (error) {
    console.error('Error in user-plans API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
