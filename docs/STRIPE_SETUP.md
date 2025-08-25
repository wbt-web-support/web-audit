# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for the subscription system.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Your Next.js application with the subscription system installed
3. Environment variables configured

## Step 1: Configure Stripe Dashboard

### 1.1 Get API Keys

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 1.2 Create Products and Prices

You need to create products and prices in Stripe for each plan. Here's how:

1. Go to **Products** in your Stripe Dashboard
2. Create three products:
   - **Starter Plan**
   - **Professional Plan** 
   - **Enterprise Plan**

3. For each product, create two prices:
   - **Monthly price** (recurring, monthly)
   - **Yearly price** (recurring, yearly)

4. Copy the price IDs and add them to your `.env.local`:

```env
STRIPE_STARTER_MONTHLY_PRICE_ID=price_1ABC123...
STRIPE_STARTER_YEARLY_PRICE_ID=price_1DEF456...
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_1GHI789...
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_1JKL012...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_1MNO345...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_1PQR678...
```

### 1.3 Set Up Webhooks

1. Go to **Developers** → **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 2: Update Database Schema

Run the updated subscription migration:

```sql
-- Run the migration file
\i sql/20_updated_user_subscriptions.sql
```

This adds the `stripe_subscription_id` field to track Stripe subscriptions.

## Step 3: Configure Environment Variables

Copy the complete environment configuration:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Stripe Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_id
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_professional_monthly_id
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_professional_yearly_id
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_id

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Step 4: Test the Integration

### 4.1 Test Mode

1. Make sure you're using test API keys (they start with `sk_test_` and `pk_test_`)
2. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`

### 4.2 Test the Flow

1. Start your development server: `npm run dev`
2. Go to your profile page
3. Try to purchase a plan
4. Complete the payment with a test card
5. Verify the subscription is created in your database

## Step 5: Production Setup

### 5.1 Switch to Live Keys

1. In your Stripe Dashboard, switch to **Live mode**
2. Copy your live API keys
3. Update your environment variables with live keys
4. Update your webhook endpoint URL to your production domain

### 5.2 Update Webhook URL

Change your webhook endpoint URL to:
```
https://your-production-domain.com/api/stripe/webhook
```

### 5.3 SSL Certificate

Ensure your production domain has a valid SSL certificate, as Stripe requires HTTPS for webhooks.

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check your webhook endpoint URL is correct
   - Verify the webhook secret is properly configured
   - Check your server logs for errors

2. **Payment fails**
   - Verify your price IDs are correct
   - Check that the plan names match exactly
   - Ensure your Stripe account is properly configured

3. **Subscription not created in database**
   - Check the webhook handler logs
   - Verify the database connection
   - Check that the user exists in your database

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=stripe:*
```

### Testing Webhooks Locally

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will give you a webhook secret to use locally
```

## Security Considerations

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Keep your webhook secret secure**
5. **Monitor webhook events** in your Stripe Dashboard

## Monitoring

1. **Stripe Dashboard**: Monitor payments, subscriptions, and webhook events
2. **Application Logs**: Check your server logs for webhook processing
3. **Database**: Verify subscriptions are being created correctly
4. **Error Tracking**: Set up error tracking for production issues

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

## Next Steps

After setting up Stripe:

1. Test the complete payment flow
2. Set up monitoring and alerts
3. Configure customer support tools
4. Plan for subscription management features
5. Consider implementing usage-based billing
