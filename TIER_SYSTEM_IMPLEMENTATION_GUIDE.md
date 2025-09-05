# Tier System Implementation Guide

## 🎯 Overview

This guide shows you how to implement a comprehensive tier system in your web audit application. The system includes user tiers (BASIC, PRO, ENTERPRISE), project limits, feature access control, and upgrade prompts.

## 📁 Files Created

### Core Types & Configuration
- `lib/types/tier.ts` - Tier types, limits, and utility functions
- `lib/contexts/UserContext.tsx` - Enhanced user context with tier information

### UI Components
- `components/ui/tier-badge.tsx` - Visual tier indicator
- `components/ui/usage-bar.tsx` - Usage visualization
- `components/ui/limit-warning.tsx` - Limit warnings
- `components/ui/tier-status-card.tsx` - Tier overview card
- `components/ui/upgrade-prompt.tsx` - Upgrade prompts

### Route Protection
- `components/auth/route-protection.tsx` - Tier-based route protection
- `components/audit/project-form-with-tier.tsx` - Example integration

### API Integration
- Updated `lib/api-client.ts` with tier-related methods

## 🚀 Quick Start

### 1. Add UserProvider to Your App

```tsx
// app/layout.tsx or app/providers.tsx
import { UserProvider } from '@/lib/contexts/UserContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
```

### 2. Use Tier Information in Components

```tsx
import { useUser } from '@/lib/contexts/UserContext'
import { TierBadge } from '@/components/ui/tier-badge'
import { TierStatusCard } from '@/components/ui/tier-status-card'

function Dashboard() {
  const { user, tier, canCreateProject, getRemainingProjects } = useUser()

  return (
    <div>
      <TierStatusCard />
      
      <div className="flex items-center space-x-4">
        <span>Welcome, {user?.name}</span>
        <TierBadge tier={tier} showIcon />
        <span className="text-sm text-gray-600">
          {getRemainingProjects()} projects remaining
        </span>
      </div>
    </div>
  )
}
```

### 3. Protect Routes with Tier Requirements

```tsx
import { RouteProtection } from '@/components/auth/route-protection'

function AdvancedAnalytics() {
  return (
    <RouteProtection requiredTier="PRO">
      <div>
        <h1>Advanced Analytics</h1>
        <p>This feature is only available for PRO and ENTERPRISE users.</p>
      </div>
    </RouteProtection>
  )
}
```

### 4. Add Limit Warnings

```tsx
import { LimitWarning } from '@/components/ui/limit-warning'

function ProjectCreationPage() {
  return (
    <div>
      <LimitWarning resource="projects" />
      <ProjectForm />
    </div>
  )
}
```

## 🎨 Component Examples

### Tier Badge
```tsx
<TierBadge tier="PRO" size="md" showIcon />
```

### Usage Bar
```tsx
<UsageBar
  current={5}
  max={50}
  tier="PRO"
  label="Project Usage"
  showPercentage
  showNumbers
/>
```

### Upgrade Prompt
```tsx
<UpgradePrompt feature="advanced analytics" />
```

## 🔒 Route Protection Examples

### Basic Protection
```tsx
<RouteProtection requiredTier="PRO">
  <AdvancedFeature />
</RouteProtection>
```

### Custom Fallback
```tsx
<RouteProtection 
  requiredTier="ENTERPRISE"
  fallback={<CustomUpgradeMessage />}
>
  <EnterpriseFeature />
</RouteProtection>
```

### Higher-Order Component
```tsx
const ProtectedComponent = withTierCheck('PRO')(MyComponent)
```

### Hook Usage
```tsx
function MyComponent() {
  const { hasAccess, isLoading, user, tier } = useTierCheck('PRO')
  
  if (isLoading) return <Loading />
  if (!hasAccess) return <UpgradeRequired />
  
  return <ProtectedContent />
}
```

## 📊 Dashboard Integration

### Complete Dashboard Example
```tsx
import { useUser } from '@/lib/contexts/UserContext'
import { TierStatusCard } from '@/components/ui/tier-status-card'
import { LimitWarning } from '@/components/ui/limit-warning'
import { TierBadge } from '@/components/ui/tier-badge'

function Dashboard() {
  const { user, tier, projects, getProjectUsagePercentage } = useUser()

  return (
    <div className="space-y-6">
      {/* Tier Status */}
      <TierStatusCard />
      
      {/* Limit Warning */}
      <LimitWarning resource="projects" />
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Welcome back, {user?.name}</h2>
            <div className="flex items-center mt-2 space-x-3">
              <TierBadge tier={tier} showIcon />
              <span className="text-sm text-gray-600">
                {projects.length} projects created
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects List */}
      <ProjectsList />
    </div>
  )
}
```

## 🎯 Project Form Integration

### Enhanced Project Form
```tsx
import { ProjectFormWithTier } from '@/components/audit/project-form-with-tier'

function CreateProjectPage() {
  const handleSubmit = async (data) => {
    // Your project creation logic
  }

  return (
    <div>
      <h1>Create New Project</h1>
      <ProjectFormWithTier onSubmit={handleSubmit} />
    </div>
  )
}
```

## 🔧 Backend Integration

### Required Backend Endpoints

Your backend needs these endpoints:

```javascript
// GET /api/auth/tier
{
  "tier": "PRO",
  "subscription_status": "active"
}

// GET /api/auth/me
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "tier": "PRO",
  "subscription_status": "active"
}

// GET /api/projects/limits
{
  "tier": "PRO",
  "maxProjects": 50,
  "currentProjects": 12,
  "remainingProjects": 38,
  "usagePercentage": 24
}

// GET /api/auth/rate-limit
{
  "rateLimitInfo": {
    "remaining": 95,
    "resetTime": 1640995200000,
    "burstRemaining": 10,
    "burstResetTime": 1640995200000
  }
}
```

## 🎨 Styling & Customization

### Custom Tier Colors
```tsx
// In lib/types/tier.ts
export const getTierColor = (tier: UserTier): string => {
  const colors = {
    BASIC: 'bg-gray-100 text-gray-800 border-gray-200',
    PRO: 'bg-blue-100 text-blue-800 border-blue-200',
    ENTERPRISE: 'bg-purple-100 text-purple-800 border-purple-200'
  }
  return colors[tier]
}
```

### Custom Usage Bar Colors
```tsx
// In components/ui/usage-bar.tsx
const getBarColor = (percentage: number, tier: UserTier) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-yellow-500'
  if (percentage >= 50) return 'bg-blue-500'
  return 'bg-green-500'
}
```

## 🧪 Testing

### Test Tier Checks
```tsx
import { render, screen } from '@testing-library/react'
import { UserProvider } from '@/lib/contexts/UserContext'
import { RouteProtection } from '@/components/auth/route-protection'

test('shows upgrade prompt for insufficient tier', () => {
  render(
    <UserProvider>
      <RouteProtection requiredTier="PRO">
        <div>Protected Content</div>
      </RouteProtection>
    </UserProvider>
  )
  
  expect(screen.getByText('PRO Tier Required')).toBeInTheDocument()
})
```

## 🚀 Advanced Features

### Dynamic Feature Lists
```tsx
function FeatureList() {
  const { tier, tierLimits } = useUser()
  
  return (
    <ul>
      {tierLimits.features.map((feature, index) => (
        <li key={index} className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          {feature}
        </li>
      ))}
    </ul>
  )
}
```

### Tier-based Pricing
```tsx
function PricingCard({ tier }: { tier: UserTier }) {
  const config = TIER_CONFIG[tier]
  
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-semibold">{tier}</h3>
      <div className="text-3xl font-bold">
        ${config.price}
        {config.price > 0 && <span className="text-sm font-normal">/mo</span>}
      </div>
      <p className="text-sm text-gray-600">{config.description}</p>
    </div>
  )
}
```

## 📱 Mobile Responsiveness

All components are built with Tailwind CSS and are mobile-responsive:

```tsx
// Responsive tier status card
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {Object.entries(TIER_CONFIG).map(([tier, config]) => (
    <PricingCard key={tier} tier={tier as UserTier} />
  ))}
</div>
```

## 🔄 State Management

The tier system integrates with your existing state management:

```tsx
// Redux/ Zustand integration
const useTierStore = create((set) => ({
  tier: 'BASIC',
  setTier: (tier) => set({ tier }),
  // ... other tier-related state
}))
```

## 🎯 Best Practices

1. **Always check limits before actions**
2. **Show clear upgrade paths**
3. **Use consistent tier indicators**
4. **Provide helpful error messages**
5. **Test all tier combinations**
6. **Keep tier logic centralized**

## 🚀 Next Steps

1. **Integrate with your existing components**
2. **Add tier-based pricing pages**
3. **Implement upgrade flows**
4. **Add analytics for tier usage**
5. **Create tier-specific onboarding**

This tier system provides a solid foundation for managing user subscriptions and feature access in your web audit application! 🎉
