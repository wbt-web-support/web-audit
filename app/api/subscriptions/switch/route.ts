import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { SwitchActivePlanRequest } from '@/lib/types/database';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: SwitchActivePlanRequest = await request.json();
    
    // Validate required fields
    if (!body.subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    // Switch active plan
    const updatedSubscription = await subscriptionService.switchActivePlan(
      user.id,
      body
    );

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: 'Active plan switched successfully'
    });

  } catch (error) {
    console.error('Error switching active plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to switch active plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
