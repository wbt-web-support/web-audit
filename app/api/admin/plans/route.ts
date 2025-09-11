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

    // Get all plans with basic statistics
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('amount', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Get user statistics for each plan
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id);

        const { count: activeUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id)
          .eq('plan_status', 'active');

        const { count: freeUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id)
          .eq('plan_status', 'free');

        const { count: expiredUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id)
          .eq('plan_status', 'expired');

        const { count: cancelledUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id)
          .eq('plan_status', 'cancelled');

        return {
          ...plan,
          user_count: userCount || 0,
          active_users: activeUsers || 0,
          free_users: freeUsers || 0,
          expired_users: expiredUsers || 0,
          cancelled_users: cancelledUsers || 0,
        };
      })
    );

    return NextResponse.json({ plans: plansWithStats });
  } catch (error) {
    console.error('Error in GET /api/admin/plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, razorpay_plan_id, amount, interval, description, features, limitations, is_active } = body;

    // Validate required fields
    if (!name || !razorpay_plan_id || amount === undefined || !interval) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, razorpay_plan_id, amount, interval' 
      }, { status: 400 });
    }

    // Create new plan
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        name,
        razorpay_plan_id,
        amount,
        interval,
        description,
        features: features || {},
        limitations: limitations || {},
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
