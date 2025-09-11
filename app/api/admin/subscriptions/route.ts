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

    // Get all subscriptions with user and plan details
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans!inner(
          name,
          amount,
          interval
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Get user profiles separately and merge the data
    const userIds = subscriptions?.map(sub => sub.user_id) || [];
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (userError) {
      console.error('Error fetching user profiles:', userError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Merge subscription data with user profiles
    const subscriptionsWithUsers = subscriptions?.map(subscription => ({
      ...subscription,
      user_profiles: userProfiles?.find(user => user.id === subscription.user_id) || {
        email: 'Unknown',
        full_name: null
      }
    })) || [];

    return NextResponse.json({ subscriptions: subscriptionsWithUsers });
  } catch (error) {
    console.error('Error in GET /api/admin/subscriptions:', error);
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
    const { user_id, plan_id, razorpay_subscription_id, status, current_start, current_end, amount, currency } = body;

    // Validate required fields
    if (!user_id || !plan_id || !razorpay_subscription_id || !status || !current_start || !current_end || amount === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, plan_id, razorpay_subscription_id, status, current_start, current_end, amount' 
      }, { status: 400 });
    }

    // Create new subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_id,
        razorpay_subscription_id,
        status,
        current_start,
        current_end,
        amount,
        currency: currency || 'INR'
      })
      .select(`
        *,
        plans!inner(
          name,
          amount,
          interval
        )
      `)
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Get user profile for the created subscription
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
    }

    // Merge subscription data with user profile
    const subscriptionWithUser = {
      ...subscription,
      user_profiles: userProfile || {
        email: 'Unknown',
        full_name: null
      }
    };

    return NextResponse.json({ subscription: subscriptionWithUser }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
