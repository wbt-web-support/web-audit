import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateUserSubscription, calculateSubscriptionEndDate } from '@/lib/utils/subscriptionUtils';
import { PlanName, BillingCycle } from '@/lib/types/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');


  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.user_id && session.metadata?.plan_name && session.metadata?.billing_cycle) {
          const userId = session.metadata.user_id;
          const planName = session.metadata.plan_name as PlanName;
          const billingCycle = session.metadata.billing_cycle as BillingCycle;
          
          // Calculate subscription dates
          const startDate = new Date();
          const endDate = calculateSubscriptionEndDate(startDate, billingCycle);
          
          // Update user profile with subscription data
          const { data, error } = await updateUserSubscription({
            planName,
            billingCycle,
            startDate,
            endDate
          });
          
          if (error) {
            console.error('Error updating user subscription:', error);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
          }
          
          console.log('Subscription updated successfully for user:', userId);
        }
        break;
        
      case 'invoice.payment_succeeded':
        // Handle successful recurring payments
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          // Update subscription end date for recurring payments
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          
          // Get user by customer ID and update subscription
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('id, active_plan_name')
            .eq('stripe_customer_id', customerId)
            .single();
            
          if (userData) {
            const endDate = new Date((subscription as any).current_period_end * 1000);
            
            await supabase
              .from('user_profiles')
              .update({
                active_plan_end_date: endDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', userData.id);
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const customerId = deletedSubscription.customer as string;
        
        // Mark subscription as inactive
        await supabase
          .from('user_profiles')
          .update({
            is_subscription_active: false,
            active_plan_name: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
