# User Profile and Plans Relationship

## Database Schema Overview

### 1. Core Tables

#### `user_profiles` Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  email VARCHAR,
  full_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR DEFAULT 'user',            -- 'user' or 'admin'
  
  -- Plan-related fields (added via ALTER TABLE)
  plan_id UUID REFERENCES plans(id),      -- Foreign key to plans table
  plan_status VARCHAR DEFAULT 'free',     -- 'free', 'active', 'expired', 'cancelled'
  plan_start_date TIMESTAMP,
  plan_end_date TIMESTAMP,
  queue_priority INTEGER DEFAULT 3,       -- 1=highest, 3=lowest
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `plans` Table
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,             -- 'Free Plan', 'Pro Plan', 'Enterprise'
  razorpay_plan_id VARCHAR(100) UNIQUE,   -- Razorpay subscription plan ID
  amount INTEGER NOT NULL,                -- Price in paise (₹1 = 100 paise)
  interval VARCHAR(20) NOT NULL,          -- 'monthly' or 'yearly'
  description TEXT,
  features JSONB DEFAULT '{}',            -- Plan features
  limitations JSONB DEFAULT '{}',         -- Plan limitations
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `subscriptions` Table (Razorpay Integration)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES plans(id),
  razorpay_subscription_id VARCHAR(100) UNIQUE,
  status VARCHAR(20),                     -- 'active', 'paused', 'cancelled', 'expired'
  current_start TIMESTAMP,
  current_end TIMESTAMP,
  amount INTEGER,                         -- in paise
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 2. How Users Are Connected to Plans

### Direct Connection (Primary Method)
```
user_profiles.plan_id → plans.id
```

**Key Fields:**
- `user_profiles.plan_id`: Direct foreign key to the current plan
- `user_profiles.plan_status`: Current status of the user's plan
- `user_profiles.queue_priority`: Queue priority based on plan tier

### Plan Status Values
- `'free'`: User is on free plan (default)
- `'active'`: User has active paid subscription
- `'expired'`: User's paid plan has expired
- `'cancelled'`: User cancelled their subscription

### Queue Priority Levels
- `1`: Enterprise plan (highest priority)
- `2`: Pro plan (medium priority)  
- `3`: Free plan (lowest priority)

## 3. How to Determine a User's Plan

### Method 1: Direct Query
```sql
SELECT 
  up.id,
  up.email,
  up.plan_status,
  up.queue_priority,
  p.name as plan_name,
  p.amount,
  p.features,
  p.limitations
FROM user_profiles up
LEFT JOIN plans p ON up.plan_id = p.id
WHERE up.id = 'user-uuid-here';
```

### Method 2: Using Database Function
```sql
SELECT * FROM get_user_plan('user-uuid-here');
```

### Method 3: API Endpoint
```javascript
// GET /api/profile/data
// Returns user profile with plan information
```

## 4. Plan Assignment Flow

### New User Registration
1. User signs up → `auth.users` record created
2. `user_profiles` record created with:
   - `plan_id`: NULL (initially)
   - `plan_status`: 'free'
   - `queue_priority`: 3 (lowest)

### Plan Upgrade/Downgrade
1. User subscribes to paid plan
2. `subscriptions` record created
3. `user_profiles` updated:
   - `plan_id`: Set to new plan ID
   - `plan_status`: 'active'
   - `queue_priority`: Updated based on plan tier
   - `plan_start_date`: Current timestamp
   - `plan_end_date`: Based on billing cycle

### Plan Expiration
1. Subscription expires
2. `subscriptions.status` → 'expired'
3. `user_profiles` updated:
   - `plan_status`: 'expired'
   - `queue_priority`: Reset to 3 (free tier)

## 5. Usage in Application

### Frontend Usage
```javascript
// Get current user's plan info
const { data } = await supabase
  .from('user_profiles')
  .select(`
    plan_status,
    queue_priority,
    plans (
      name,
      features,
      limitations,
      amount
    )
  `)
  .eq('id', userId)
  .single();

const userPlan = data.plans;
const planStatus = data.plan_status;
const queuePriority = data.queue_priority;
```

### Backend Usage
```javascript
// Check if user has specific feature
const hasFeature = userPlan.features?.screenshots === true;

// Check plan limitations
const maxProjects = userPlan.limitations?.max_projects || 1;
const currentProjects = await getCurrentProjectCount(userId);

if (currentProjects >= maxProjects) {
  throw new Error('Plan limit exceeded');
}
```

## 6. Admin Panel Usage

### View All Users with Plans
```sql
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.plan_status,
  up.queue_priority,
  p.name as plan_name,
  p.amount,
  up.plan_start_date,
  up.plan_end_date
FROM user_profiles up
LEFT JOIN plans p ON up.plan_id = p.id
ORDER BY up.created_at DESC;
```

### Plan Statistics
```sql
SELECT 
  p.name as plan_name,
  COUNT(up.id) as user_count,
  COUNT(CASE WHEN up.plan_status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN up.plan_status = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN up.plan_status = 'expired' THEN 1 END) as expired_users
FROM plans p
LEFT JOIN user_profiles up ON p.id = up.plan_id
GROUP BY p.id, p.name
ORDER BY p.amount ASC;
```

## 7. Key Benefits of This Structure

1. **Simple Queries**: Direct foreign key relationship makes queries fast
2. **Flexible**: Easy to add new plan fields without schema changes
3. **Audit Trail**: `subscriptions` table tracks payment history
4. **Queue Management**: `queue_priority` enables priority-based processing
5. **Plan Features**: JSONB fields allow flexible feature/limitation management
6. **Status Tracking**: Multiple status fields for different purposes

## 8. Common Use Cases

### Check User's Current Plan
```javascript
const userPlan = await getUserPlan(userId);
console.log(`User is on ${userPlan.name} plan`);
```

### Enforce Plan Limits
```javascript
const limits = userPlan.limitations;
if (projectCount >= limits.max_projects) {
  return { error: 'Plan limit exceeded' };
}
```

### Queue Priority Processing
```javascript
const priority = userProfile.queue_priority;
// Higher priority users get processed first
```

### Plan Upgrade/Downgrade
```javascript
await updateUserPlan(userId, newPlanId, 'active');
```

This structure provides a clean, efficient way to manage user plans and their associated features and limitations.
