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

    // Get users with their plan information
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        role,
        plan_status,
        plan_start_date,
        plan_end_date,
        queue_priority,
        created_at,
        updated_at,
        plans (
          id,
          name,
          amount,
          interval,
          features
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users with plans:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/admin/users/plans:', error);
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
    const { userId, planId, planStatus = 'active' } = body;

    // Validate required fields
    if (!userId || !planId) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, planId' 
      }, { status: 400 });
    }

    // Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, features')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get queue priority for the plan
    const { data: queuePriority, error: queueError } = await supabase
      .from('queue_priorities')
      .select('priority_level')
      .eq('plan_id', planId)
      .limit(1)
      .single();

    if (queueError) {
      console.error('Error fetching queue priority:', queueError);
    }

    // Update user plan
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        plan_id: planId,
        plan_status: planStatus,
        plan_start_date: planStatus === 'active' ? new Date().toISOString() : null,
        plan_end_date: planStatus === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        queue_priority: queuePriority?.priority_level || 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        plan_status,
        plan_start_date,
        plan_end_date,
        queue_priority,
        plans (
          id,
          name,
          amount,
          interval,
          features
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 });
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: `User plan updated to ${plan.name}` 
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
