# Free Trial System

This document explains how the free trial system works in the Website Audit application.

## Overview

The free trial system allows new users to access the platform for a limited number of days (configurable via environment variable) before requiring them to purchase a subscription plan.

## Environment Variables

Set the following environment variable to configure the trial duration:

```bash
NEXT_PUBLIC_FREE_TRIAL_DAYS=14
```

**Default**: 14 days if not specified

## How It Works

### 1. Trial Calculation
- Trial starts when a user creates an account (`created_at` timestamp)
- Trial duration is calculated from `NEXT_PUBLIC_FREE_TRIAL_DAYS`
- Trial end date = `created_at` + trial days

### 2. Trial Status
The system tracks several trial states:
- **Active Trial**: User is within the trial period
- **Trial Expired**: User has exceeded the trial period
- **Subscription Active**: User has purchased a subscription (overrides trial)

### 3. Access Control
- Users with active trials can access all features
- Users with expired trials cannot access features
- Users with active subscriptions have full access regardless of trial status

## Components

### TrialBanner
A reusable banner component that displays trial status and prompts users to upgrade.

```tsx
import { TrialBanner } from '@/components/ui/trial-banner';

// Basic usage
<TrialBanner />

// Custom styling
<TrialBanner className="my-4" />

// Without upgrade button
<TrialBanner showUpgradeButton={false} />

// Custom upgrade handler
<TrialBanner onUpgradeClick={() => handleCustomUpgrade()} />
```

### TrialGate
A wrapper component that restricts access to features based on trial status.

```tsx
import { TrialGate } from '@/components/ui/trial-gate';

// Basic usage - shows content only if trial is active or subscription exists
<TrialGate>
  <YourFeature />
</TrialGate>

// Require subscription (no trial access)
<TrialGate requireSubscription={true}>
  <PremiumFeature />
</TrialGate>

// Custom fallback
<TrialGate fallback={<CustomUpgradePrompt />}>
  <YourFeature />
</TrialGate>

// Hide banner
<TrialGate showBanner={false}>
  <YourFeature />
</TrialGate>
```

### useTrialStatus Hook
A custom hook that provides trial status information.

```tsx
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';

function MyComponent() {
  const { 
    isTrialActive, 
    trialDaysRemaining, 
    isTrialExpired, 
    hasActiveSubscription, 
    canUseService 
  } = useTrialStatus();

  if (!canUseService) {
    return <UpgradePrompt />;
  }

  return <YourContent />;
}
```

## Usage Examples

### 1. Profile Page
The SubscriptionTab automatically shows trial status and prompts users to upgrade when needed.

### 2. Feature Access Control
Wrap premium features with TrialGate:

```tsx
<TrialGate requireSubscription={true}>
  <AdvancedAuditFeature />
</TrialGate>
```

### 3. Dashboard Trial Banner
Show trial status at the top of the dashboard:

```tsx
import { TrialBanner } from '@/components/ui/trial-banner';

function Dashboard() {
  return (
    <div>
      <TrialBanner />
      <DashboardContent />
    </div>
  );
}
```

### 4. Custom Trial Logic
Use the hook for custom trial logic:

```tsx
function CustomTrialComponent() {
  const { trialDaysRemaining, isTrialExpired } = useTrialStatus();
  
  if (isTrialExpired) {
    return <ExpiredTrialMessage />;
  }
  
  if (trialDaysRemaining <= 3) {
    return <TrialEndingSoonMessage days={trialDaysRemaining} />;
  }
  
  return <NormalContent />;
}
```

## Trial Status Messages

The system automatically generates appropriate messages:

- **Active Trial**: "You have X days left in your free trial."
- **Trial Ending Soon** (≤3 days): "Your free trial ends in X days. Upgrade now to continue!"
- **Trial Expired**: "Your free trial has expired. Please upgrade to continue using our services."

## Styling

Trial banners use different colors based on status:
- **Blue**: Active trial with >3 days remaining
- **Orange**: Trial ending soon (≤3 days)
- **Red**: Trial expired

## Database Integration

The system automatically fetches user profile data and calculates trial status. No additional database fields are required - trial status is calculated on-the-fly based on the user's `created_at` timestamp.

## Security Notes

- Trial status is calculated client-side for UI purposes
- Server-side validation should be implemented for critical features
- Always verify subscription status on the server before processing requests

## Future Enhancements

Potential improvements to consider:
- Trial extension capabilities
- Different trial durations for different user types
- Trial usage tracking (audit count limits during trial)
- Trial reset functionality for returning users
