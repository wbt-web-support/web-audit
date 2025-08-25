import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { PlanName, BillingCycle } from '@/lib/types/database';

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
    const body = await request.json();
    const { plan_name, billing_cycle, activate_immediately = true } = body;
    
    // Validate required fields
    if (!plan_name || !billing_cycle) {
      return NextResponse.json(
        { error: 'plan_name and billing_cycle are required' },
        { status: 400 }
      );
    }

    // Validate plan name
    if (!['Enterprise', 'Professional', 'Starter'].includes(plan_name)) {
      return NextResponse.json(
        { error: 'Invalid plan_name. Must be Enterprise, Professional, or Starter' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return NextResponse.json(
        { error: 'Invalid billing_cycle. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    // Create test subscription
    const subscription = await subscriptionService.createSubscription(
      user.id,
      {
        plan_name: plan_name as PlanName,
        billing_cycle: billing_cycle as BillingCycle,
        activate_immediately
      }
    );

    return NextResponse.json({
      success: true,
      data: subscription,
      message: `Test ${plan_name} subscription created successfully!`
    });

  } catch (error) {
    console.error('Error creating test subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    // Get subscription statistics
    const subscriptions = await subscriptionService.getUserSubscriptions(user.id);
    const activeSubscription = await subscriptionService.getActiveSubscription(user.id);
    const subscriptionCount = await subscriptionService.getSubscriptionCount(user.id);

    return NextResponse.json({
      success: true,
      data: {
        totalSubscriptions: subscriptionCount,
        activeSubscription,
        allSubscriptions: subscriptions,
        user: {
          id: user.id,
          email: user.email
        }
      },
      message: 'Test subscription data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching test subscription data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch test subscription data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
