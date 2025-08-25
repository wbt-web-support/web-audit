# Subscription System Documentation

## Overview

This document describes the comprehensive subscription management system built with Supabase, TypeScript, and Next.js. The system allows users to purchase multiple subscription plans and switch between them, with only one plan being active at a time.

## Features

- **Three Plan Types**: Enterprise, Professional, Starter
- **Billing Cycles**: Monthly and Yearly
- **Multiple Plan Ownership**: Users can own multiple plans
- **Single Active Plan**: Only one plan can be active at a time
- **Plan Switching**: Users can switch between owned plans
- **Automatic Date Calculation**: Start and end dates are automatically calculated
- **Database Triggers**: Ensures data integrity with automatic deactivation

## Database Schema

### user_subscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('Enterprise', 'Professional', 'Starter')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features

- **UUID Primary Keys**: Secure and unique identifiers
- **Foreign Key Constraints**: Links to auth.users table
- **Check Constraints**: Ensures valid plan names and billing cycles
- **Automatic Timestamps**: Created and updated timestamps
- **Row Level Security**: Users can only access their own subscriptions
- **Database Triggers**: Automatically ensures only one active subscription per user

## API Endpoints

### 1. Get All User Subscriptions
```
GET /api/subscriptions
```
Returns all subscriptions for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan_name": "Professional",
      "billing_cycle": "monthly",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-02-01T00:00:00Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Subscriptions retrieved successfully"
}
```

### 2. Create New Subscription
```
POST /api/subscriptions
```

**Request Body:**
```json
{
  "plan_name": "Professional",
  "billing_cycle": "monthly",
  "activate_immediately": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_name": "Professional",
    "billing_cycle": "monthly",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "is_active": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Subscription created successfully"
}
```

### 3. Get Active Subscription
```
GET /api/subscriptions/active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_name": "Professional",
    "billing_cycle": "monthly",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Active subscription retrieved successfully"
}
```

### 4. Switch Active Plan
```
POST /api/subscriptions/switch
```

**Request Body:**
```json
{
  "subscription_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_name": "Enterprise",
    "billing_cycle": "yearly",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2025-01-01T00:00:00Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Active plan switched successfully"
}
```

### 5. Test Subscription (Development)
```
POST /api/subscriptions/test
GET /api/subscriptions/test
```

Used for testing and development purposes.

## TypeScript Types

### Core Types

```typescript
export type PlanName = 'Enterprise' | 'Professional' | 'Starter';
export type BillingCycle = 'monthly' | 'yearly';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: PlanName;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionRequest {
  plan_name: PlanName;
  billing_cycle: BillingCycle;
  activate_immediately?: boolean;
}

export interface SwitchActivePlanRequest {
  subscription_id: string;
}
```

## React Hook

### useSubscriptions Hook

```typescript
import { useSubscriptions } from '@/lib/hooks/useSubscriptions';

function MyComponent() {
  const {
    subscriptions,
    activeSubscription,
    isLoading,
    error,
    createSubscription,
    switchActivePlan,
    refreshSubscriptions
  } = useSubscriptions();

  // Use the hook methods
  const handleCreateSubscription = async () => {
    try {
      await createSubscription({
        plan_name: 'Professional',
        billing_cycle: 'monthly',
        activate_immediately: true
      });
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const handleSwitchPlan = async (subscriptionId: string) => {
    try {
      await switchActivePlan({ subscription_id: subscriptionId });
    } catch (error) {
      console.error('Failed to switch plan:', error);
    }
  };
}
```

## Components

### SubscriptionManager Component

A comprehensive component that provides:
- Display of current active subscription
- List of all user subscriptions
- Plan switching functionality
- Purchase new plans
- Modern, responsive UI

```typescript
import { SubscriptionManager } from '@/components/subscriptions/SubscriptionManager';

function ProfilePage() {
  return (
    <SubscriptionManager 
      plans={pricingPlans}
      billingPeriod="month"
      onBillingPeriodChange={(period) => setBillingPeriod(period)}
    />
  );
}
```

## Service Layer

### SubscriptionService Class

The service layer provides business logic for:
- Creating subscriptions
- Managing active states
- Data validation
- Error handling

```typescript
import { subscriptionService } from '@/lib/services/subscriptionService';

// Create subscription
const subscription = await subscriptionService.createSubscription(userId, {
  plan_name: 'Professional',
  billing_cycle: 'monthly',
  activate_immediately: true
});

// Get user subscriptions
const subscriptions = await subscriptionService.getUserSubscriptions(userId);

// Switch active plan
const updatedSubscription = await subscriptionService.switchActivePlan(userId, {
  subscription_id: 'uuid'
});
```

## Database Functions

### Automatic Functions

1. **ensure_single_active_subscription()**: Ensures only one subscription is active per user
2. **get_user_active_subscription()**: Gets the active subscription for a user
3. **get_user_subscriptions()**: Gets all subscriptions for a user
4. **update_updated_at_column()**: Updates the updated_at timestamp

## Security Features

- **Row Level Security (RLS)**: Users can only access their own subscriptions
- **Input Validation**: All inputs are validated on both client and server
- **Type Safety**: Full TypeScript support with strict typing
- **Error Handling**: Comprehensive error handling and logging
- **Authentication**: All endpoints require user authentication

## Usage Examples

### Creating a Subscription

```typescript
// Using the hook
const { createSubscription } = useSubscriptions();

await createSubscription({
  plan_name: 'Professional',
  billing_cycle: 'monthly',
  activate_immediately: true
});

// Using the service directly
import { subscriptionService } from '@/lib/services/subscriptionService';

await subscriptionService.createSubscription(userId, {
  plan_name: 'Professional',
  billing_cycle: 'monthly',
  activate_immediately: true
});
```

### Switching Active Plans

```typescript
// Using the hook
const { switchActivePlan } = useSubscriptions();

await switchActivePlan({ subscription_id: 'uuid' });

// Using the service directly
await subscriptionService.switchActivePlan(userId, {
  subscription_id: 'uuid'
});
```

### Checking Subscription Status

```typescript
const { activeSubscription, subscriptions } = useSubscriptions();

if (activeSubscription) {
  console.log('Active plan:', activeSubscription.plan_name);
  console.log('Expires:', activeSubscription.end_date);
}

// Check if user has a specific plan
const hasProfessionalPlan = subscriptions.some(
  sub => sub.plan_name === 'Professional'
);
```

## Testing

### Test API Endpoints

Use the test endpoints for development:

```bash
# Create test subscription
curl -X POST /api/subscriptions/test \
  -H "Content-Type: application/json" \
  -d '{"plan_name": "Professional", "billing_cycle": "monthly"}'

# Get test data
curl -X GET /api/subscriptions/test
```

## Migration

To set up the subscription system, run the SQL migration:

```sql
-- Run the migration file
\i sql/20_updated_user_subscriptions.sql
```

## Environment Variables

No additional environment variables are required beyond the standard Supabase configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

## Best Practices

1. **Always validate inputs** on both client and server
2. **Use the hook** for React components
3. **Use the service** for server-side operations
4. **Handle errors gracefully** with proper user feedback
5. **Test thoroughly** using the test endpoints
6. **Monitor database performance** with the provided indexes

## Troubleshooting

### Common Issues

1. **"Subscription not found"**: Check if the subscription belongs to the user
2. **"Invalid plan name"**: Ensure plan name is exactly 'Enterprise', 'Professional', or 'Starter'
3. **"Invalid billing cycle"**: Ensure billing cycle is exactly 'monthly' or 'yearly'
4. **RLS Policy Errors**: Ensure user is authenticated and policies are set up correctly

### Debug Mode

Use the test endpoints to debug subscription issues:

```typescript
// Get all subscription data
const response = await fetch('/api/subscriptions/test');
const data = await response.json();
console.log('Subscription data:', data);
```
