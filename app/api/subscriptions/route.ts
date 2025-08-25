import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { CreateSubscriptionRequest } from '@/lib/types/database';

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

    // Get all subscriptions for the user
    const subscriptions = await subscriptionService.getUserSubscriptions(user.id);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      message: 'Subscriptions retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const body: CreateSubscriptionRequest = await request.json();
    
    // Validate required fields
    if (!body.plan_name || !body.billing_cycle) {
      return NextResponse.json(
        { error: 'plan_name and billing_cycle are required' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await subscriptionService.createSubscription(
      user.id,
      body
    );

    return NextResponse.json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
