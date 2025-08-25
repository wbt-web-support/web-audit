import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { subscriptionService } from '@/lib/services/subscriptionService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.user_id;
          const planName = session.metadata?.plan_name;
          const billingCycle = session.metadata?.billing_cycle;

          if (!userId || !planName || !billingCycle) {
            console.error('Missing metadata in session:', session.metadata);
            return NextResponse.json(
              { error: 'Missing metadata' },
              { status: 400 }
            );
          }

          try {
            // Create subscription in database
            const dbSubscription = await subscriptionService.createSubscription(
              userId,
              {
                plan_name: planName as any,
                billing_cycle: billingCycle as any,
                activate_immediately: true,
              }
            );

            // Update subscription with Stripe subscription ID
            await supabase
              .from('user_subscriptions')
              .update({
                stripe_subscription_id: subscription.id,
              })
              .eq('id', dbSubscription.id);

            console.log('Subscription created successfully:', dbSubscription.id);
          } catch (error) {
            console.error('Error creating subscription:', error);
            return NextResponse.json(
              { error: 'Failed to create subscription' },
              { status: 500 }
            );
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Update subscription status if needed
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );

          if (subscription.status === 'active') {
            // Update subscription in database
            await supabase
              .from('user_subscriptions')
              .update({
                is_active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Deactivate subscription on payment failure
          await supabase
            .from('user_subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Deactivate subscription when cancelled
        await supabase
          .from('user_subscriptions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
