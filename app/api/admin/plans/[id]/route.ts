import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get plan with queue priorities
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get queue priorities for this plan
    const { data: queuePriorities, error: queueError } = await supabase
      .from('queue_priorities')
      .select('*')
      .eq('plan_id', id)
      .order('priority_level', { ascending: true });

    if (queueError) {
      console.error('Error fetching queue priorities:', queueError);
    }

    return NextResponse.json({ 
      plan, 
      queuePriorities: queuePriorities || [] 
    });
  } catch (error) {
    console.error('Error in GET /api/admin/plans/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, razorpay_plan_id, amount, interval, description, features, is_active } = body;

    // Update plan
    const { data: plan, error } = await supabase
      .from('plans')
      .update({
        name,
        razorpay_plan_id,
        amount,
        interval,
        description,
        features: features || {},
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in PUT /api/admin/plans/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if plan has active users
    const { data: activeUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('plan_id', id)
      .eq('plan_status', 'active')
      .limit(1);

    if (usersError) {
      console.error('Error checking active users:', usersError);
      return NextResponse.json({ error: 'Failed to check plan usage' }, { status: 500 });
    }

    if (activeUsers && activeUsers.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active users. Please migrate users to another plan first.' 
      }, { status: 400 });
    }

    // Delete plan (this will cascade to queue_priorities)
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plan:', error);
      return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/plans/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
