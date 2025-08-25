import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active subscription
    const activeSubscription = await subscriptionService.getActiveSubscription(user.id);

    return NextResponse.json({
      success: true,
      data: activeSubscription,
      message: activeSubscription 
        ? 'Active subscription retrieved successfully' 
        : 'No active subscription found'
    });

  } catch (error) {
    console.error('Error fetching active subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch active subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
