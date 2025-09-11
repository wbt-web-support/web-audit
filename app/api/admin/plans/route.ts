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

    // Get all plans with statistics
    const { data: plans, error } = await supabase
      .from('plan_statistics')
      .select('*')
      .order('amount', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json({ plans });
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
    const { name, razorpay_plan_id, amount, interval, description, features, is_active } = body;

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
