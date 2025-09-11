import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get plan statistics using the view
    const { data: planStats, error } = await supabase
      .from('plan_statistics')
      .select('*')
      .order('amount', { ascending: true });

    if (error) {
      console.error('Error fetching plan statistics:', error);
      return NextResponse.json({ error: 'Failed to fetch plan statistics' }, { status: 500 });
    }

    // Get additional subscription analytics
    const { data: subscriptionAnalytics, error: analyticsError } = await supabase
      .from('subscription_analytics')
      .select('*');

    if (analyticsError) {
      console.error('Error fetching subscription analytics:', analyticsError);
    }

    // Calculate additional metrics
    const enhancedPlanStats = planStats?.map(plan => {
      const analytics = subscriptionAnalytics?.find(a => a.plan_name === plan.name);
      return {
        ...plan,
        plan_name: plan.name, // Map name to plan_name for consistency
        total_revenue: analytics?.total_revenue || 0,
        average_revenue: analytics?.average_revenue || 0,
        new_subscriptions_30d: analytics?.new_subscriptions_30d || 0,
        new_subscriptions_7d: analytics?.new_subscriptions_7d || 0
      };
    }) || [];

    console.log('Plan statistics data:', enhancedPlanStats);
    return NextResponse.json({ planStats: enhancedPlanStats });
  } catch (error) {
    console.error('Error in GET /api/admin/plan-statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
