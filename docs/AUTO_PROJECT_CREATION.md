# Auto-Project Creation Feature

This document explains how the automatic project creation feature works after user login/signup.

## Overview

When a user enters a website URL on the home page and then signs up or logs in, the system automatically creates an audit project for that website with predefined settings.

## How It Works

### 1. Home Page URL Storage
- User enters a website URL on the home page
- URL is stored in Redux store (`home.websiteUrl`)
- All sign-up and login links are updated to include the website parameter

### 2. URL Capture During Auth
- When user visits `/auth/sign-up?website=example.com` or `/auth/login?website=example.com`
- The website parameter is captured and stored in Redux
- This happens in both `SignUpForm` and `LoginForm` components

### 3. Automatic Project Creation
- After successful authentication, user is redirected to dashboard
- Dashboard checks if there's a stored website URL in Redux
- If URL exists, automatically creates a project with:
  - **Crawl Type**: Full website crawl (as requested)
  - **Services**: Default services including custom URLs, contact consistency, and custom instructions
  - **Company Details**: Empty (user can fill later)
  - **Instructions**: Empty (user can add later)

### 4. Post-Creation Actions
- Project is created via API call to `/api/audit-projects`
- Stored URL is cleared from Redux store
- User is redirected to the audit page for the new project
- Success toast notification is shown

## Technical Implementation

### Redux Store Structure
```typescript
interface HomeState {
  websiteUrl: string;
}
```

### Auto-Project Creation Hook
```typescript
// app/(dashboard)/dashboard/hooks/use-auto-project-creation.ts
export function useAutoProjectCreation({ onProjectCreated }: UseAutoProjectCreationProps = {})
```

### Audit Page Integration
```typescript
// app/(dashboard)/audit/auto-project-creation-wrapper.tsx
export function AutoProjectCreationWrapper({ children }: AutoProjectCreationWrapperProps) {
  // Handles auto-project creation when users land on audit page
  // with a stored website URL
}
```

### Dashboard Integration (Legacy)
```typescript
// app/(dashboard)/dashboard/components/dashboard-main.tsx
// This is now optional since users go directly to audit
const { websiteUrl, isCreating, hasAttempted } = useAutoProjectCreation({
  onProjectCreated: (projectId) => {
    console.log('Auto-created project:', projectId);
    refetch(true);
  }
});
```

## User Flow

1. **Home Page**: User enters website URL → URL stored in Redux
2. **Auth Pages**: URL passed via query parameter → Captured and stored in Redux
3. **Direct Audit**: User redirected directly to audit page (skips dashboard)
4. **Auto-Creation**: Project automatically created with full crawl
5. **Project Page**: User redirected to specific project → URL cleared from Redux

## Benefits

- **Seamless Experience**: Users don't need to re-enter the website URL
- **Direct Access**: Skip dashboard, go straight to audit page
- **Automatic Setup**: Projects are created with sensible defaults
- **Full Crawl**: Always uses full website crawl as requested
- **Clean State**: Redux store is cleared after project creation

## Error Handling

- If project creation fails, user sees error toast
- URL is still cleared from Redux to prevent infinite retries
- User can manually create project if needed

## Configuration

The auto-created projects use these default settings:
- **Crawl Type**: `"full"` (full website crawl)
- **Services**: `['check_custom_urls', 'contact_details_consistency', 'custom_instructions']`
- **Company Details**: All fields empty
- **Instructions**: Empty array
- **Custom URLs**: `null`
- **Stripe Key URLs**: `null`

Users can modify these settings after the project is created.
