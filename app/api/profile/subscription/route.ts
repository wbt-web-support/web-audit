import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanById } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's active subscription from the new user_subscriptions table
    const { data: activeSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // If user has an active subscription, return it
    if (activeSubscription) {
      const plan = getPlanById(activeSubscription.plan_name.toLowerCase());
      
      if (plan) {
        return NextResponse.json({
          name: plan.name,
          price: plan.price,
          period: activeSubscription.billing_cycle === 'yearly' ? 'per year' : 'per month',
          features: plan.features,
          current: true,
          popular: plan.popular || false,
          stripe_subscription_id: activeSubscription.stripe_subscription_id,
          subscription_start_date: activeSubscription.start_date,
          subscription_end_date: activeSubscription.end_date,
          status: 'active'
        });
      }
    }

    // Return default free plan if no active subscription
    return NextResponse.json({
      name: 'Free',
      price: 'Free',
      period: '',
      features: [
        'Up to 3 website audits per month',
        'Basic SEO analysis',
        'Mobile responsiveness check',
        'Page speed insights',
        'Basic reporting'
      ],
      current: true,
      popular: false,
      status: 'inactive'
    });

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
