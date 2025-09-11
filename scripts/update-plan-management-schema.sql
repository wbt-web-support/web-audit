-- =====================================================
-- Update Plan Management Schema (Handles Existing Data)
-- =====================================================

-- Update existing plans with new pricing and features
-- This script safely updates existing plans without causing conflicts

-- =====================================================
-- Update Plans with New Pricing
-- =====================================================

-- Update Free Plan
UPDATE plans 
SET 
  name = 'Free Plan',
  amount = 0,
  description = 'Perfect for trying out our web audit tool',
  features = '{
    "max_projects": 3,
    "max_pages_per_project": 50,
    "screenshots": false,
    "ai_analysis": false,
    "queue_priority": 4,
    "queue_wait_time": "15-30 minutes",
    "crawl_limit": "one-time",
    "api_calls_per_month": 100,
    "storage_gb": 1,
    "support": "Community",
    "features": ["Basic SEO Analysis", "Page Speed Check", "Mobile Responsiveness", "One-time Site Analysis"],
    "cost_per_user": 0.0,
    "target_margin": 0.0
  }',
  updated_at = NOW()
WHERE razorpay_plan_id = 'plan_web_audit_free';

-- Update Pro Plan
UPDATE plans 
SET 
  name = 'Pro Plan',
  amount = 90000,
  description = 'Ideal for freelancers and small businesses',
  features = '{
    "max_projects": 10,
    "max_pages_per_project": 200,
    "screenshots": true,
    "ai_analysis": true,
    "queue_priority": 2,
    "queue_wait_time": "5-10 minutes",
    "crawl_limit": "unlimited",
    "api_calls_per_month": 1000,
    "storage_gb": 10,
    "support": "Email",
    "features": ["Full SEO Analysis", "Screenshot Generation", "AI Content Analysis", "UI/UX Analysis", "Performance Metrics", "Priority Queue", "Unlimited Crawls", "Advanced Reports"],
    "cost_per_user": 0.3,
    "target_margin": 0.7,
    "throttle_heavy_usage": true
  }',
  updated_at = NOW()
WHERE razorpay_plan_id = 'plan_web_audit_pro_monthly';

-- Insert or Update Pro Plan (Yearly)
INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, is_active)
VALUES (
  'Pro Plan (Yearly)',
  'plan_web_audit_pro_yearly',
  900000,
  'yearly',
  'Pro plan with 2 months free - Save $18/year',
  '{
    "max_projects": 10,
    "max_pages_per_project": 200,
    "screenshots": true,
    "ai_analysis": true,
    "queue_priority": 2,
    "queue_wait_time": "5-10 minutes",
    "crawl_limit": "unlimited",
    "api_calls_per_month": 1000,
    "storage_gb": 10,
    "support": "Email",
    "features": ["Full SEO Analysis", "Screenshot Generation", "AI Content Analysis", "UI/UX Analysis", "Performance Metrics", "Priority Queue", "Unlimited Crawls", "Advanced Reports"],
    "cost_per_user": 0.3,
    "target_margin": 0.7,
    "throttle_heavy_usage": true,
    "discount": "2 months free"
  }',
  true
)
ON CONFLICT (razorpay_plan_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Insert or Update Business Plan (Monthly)
INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, is_active)
VALUES (
  'Business Plan',
  'plan_web_audit_business_monthly',
  290000,
  'monthly',
  'Perfect for teams and growing businesses',
  '{
    "max_projects": 50,
    "max_pages_per_project": 500,
    "screenshots": true,
    "ai_analysis": true,
    "queue_priority": 1,
    "queue_wait_time": "1-3 minutes",
    "crawl_limit": "unlimited",
    "api_calls_per_month": 5000,
    "storage_gb": 50,
    "support": "Priority Email",
    "sla": "99.9%",
    "max_users_per_account": 5,
    "features": ["Everything in Pro", "Team Collaboration", "Advanced Analytics", "API Access", "Custom Reports", "SLA Guarantee", "Priority Support", "Integrations"],
    "cost_per_user": 0.2,
    "target_margin": 0.8
  }',
  true
)
ON CONFLICT (razorpay_plan_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Insert or Update Business Plan (Yearly)
INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, is_active)
VALUES (
  'Business Plan (Yearly)',
  'plan_web_audit_business_yearly',
  2900000,
  'yearly',
  'Business plan with 2 months free - Save $58/year',
  '{
    "max_projects": 50,
    "max_pages_per_project": 500,
    "screenshots": true,
    "ai_analysis": true,
    "queue_priority": 1,
    "queue_wait_time": "1-3 minutes",
    "crawl_limit": "unlimited",
    "api_calls_per_month": 5000,
    "storage_gb": 50,
    "support": "Priority Email",
    "sla": "99.9%",
    "max_users_per_account": 5,
    "features": ["Everything in Pro", "Team Collaboration", "Advanced Analytics", "API Access", "Custom Reports", "SLA Guarantee", "Priority Support", "Integrations"],
    "cost_per_user": 0.2,
    "target_margin": 0.8,
    "discount": "2 months free"
  }',
  true
)
ON CONFLICT (razorpay_plan_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Insert or Update Enterprise Plan
INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, is_active)
VALUES (
  'Enterprise Plan',
  'plan_web_audit_enterprise_monthly',
  1990000,
  'monthly',
  'Custom solutions for large organizations',
  '{
    "max_projects": -1,
    "max_pages_per_project": -1,
    "screenshots": true,
    "ai_analysis": true,
    "queue_priority": 1,
    "queue_wait_time": "Immediate",
    "crawl_limit": "unlimited",
    "api_calls_per_month": -1,
    "storage_gb": -1,
    "support": "Dedicated",
    "sla": "99.99%",
    "max_users_per_account": -1,
    "features": ["Everything in Business", "Unlimited Everything", "Dedicated Support", "Custom Integrations", "On-premise Options", "VPC Deployment", "Volume Discounts", "White-label", "Custom SLA"],
    "cost_per_user": 0.1,
    "target_margin": 0.9,
    "custom_pricing": true,
    "starting_price": 199
  }',
  true
)
ON CONFLICT (razorpay_plan_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = NOW();

-- =====================================================
-- Update Queue Priorities
-- =====================================================

-- Clear existing queue priorities for clean update
DELETE FROM queue_priorities;

-- Get plan IDs and insert new queue priorities
DO $$
DECLARE
    free_plan_id UUID;
    pro_plan_id UUID;
    business_plan_id UUID;
    enterprise_plan_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO free_plan_id FROM plans WHERE razorpay_plan_id = 'plan_web_audit_free';
    SELECT id INTO pro_plan_id FROM plans WHERE razorpay_plan_id = 'plan_web_audit_pro_monthly';
    SELECT id INTO business_plan_id FROM plans WHERE razorpay_plan_id = 'plan_web_audit_business_monthly';
    SELECT id INTO enterprise_plan_id FROM plans WHERE razorpay_plan_id = 'plan_web_audit_enterprise_monthly';

    -- Insert queue priorities for Free Plan (Priority 4 - Lowest)
    INSERT INTO queue_priorities (plan_id, queue_name, priority_level, max_workers, concurrency, max_queue_size, delay_between_jobs, memory_limit, cpu_limit) VALUES
    (free_plan_id, 'web-scraping', 4, 3, 1, 20, 10000, '256Mi', '250m'),
    (free_plan_id, 'page-analysis', 4, 3, 1, 20, 15000, '512Mi', '500m'),
    (free_plan_id, 'basic-seo', 4, 2, 1, 15, 20000, '1Gi', '1000m');

    -- Insert queue priorities for Pro Plan (Priority 2 - Medium)
    INSERT INTO queue_priorities (plan_id, queue_name, priority_level, max_workers, concurrency, max_queue_size, delay_between_jobs, memory_limit, cpu_limit) VALUES
    (pro_plan_id, 'web-scraping', 2, 12, 3, 80, 3000, '1Gi', '1000m'),
    (pro_plan_id, 'page-analysis', 2, 15, 3, 80, 4000, '2Gi', '2000m'),
    (pro_plan_id, 'screenshot-generation', 2, 8, 2, 40, 6000, '3Gi', '3000m'),
    (pro_plan_id, 'ai-analysis', 2, 10, 2, 60, 5000, '4Gi', '4000m'),
    (pro_plan_id, 'priority-queue', 2, 5, 1, 30, 2000, '2Gi', '2000m');

    -- Insert queue priorities for Business Plan (Priority 1 - High)
    INSERT INTO queue_priorities (plan_id, queue_name, priority_level, max_workers, concurrency, max_queue_size, delay_between_jobs, memory_limit, cpu_limit) VALUES
    (business_plan_id, 'web-scraping', 1, 20, 5, 150, 1500, '2Gi', '2000m'),
    (business_plan_id, 'page-analysis', 1, 25, 5, 150, 2000, '4Gi', '4000m'),
    (business_plan_id, 'screenshot-generation', 1, 15, 3, 80, 3000, '6Gi', '6000m'),
    (business_plan_id, 'ai-analysis', 1, 20, 3, 120, 2500, '8Gi', '8000m'),
    (business_plan_id, 'priority-queue', 1, 8, 2, 50, 1000, '4Gi', '4000m'),
    (business_plan_id, 'team-collaboration', 1, 5, 2, 30, 1000, '2Gi', '2000m');

    -- Insert queue priorities for Enterprise Plan (Priority 1 - Highest)
    INSERT INTO queue_priorities (plan_id, queue_name, priority_level, max_workers, concurrency, max_queue_size, delay_between_jobs, memory_limit, cpu_limit) VALUES
    (enterprise_plan_id, 'web-scraping', 1, 30, 8, 300, 500, '4Gi', '4000m'),
    (enterprise_plan_id, 'page-analysis', 1, 40, 8, 300, 750, '8Gi', '8000m'),
    (enterprise_plan_id, 'screenshot-generation', 1, 25, 5, 150, 1000, '12Gi', '12000m'),
    (enterprise_plan_id, 'ai-analysis', 1, 30, 5, 200, 1000, '16Gi', '16000m'),
    (enterprise_plan_id, 'priority-queue', 1, 15, 3, 100, 250, '8Gi', '8000m'),
    (enterprise_plan_id, 'dedicated-processing', 1, 10, 2, 50, 100, '16Gi', '16000m'),
    (enterprise_plan_id, 'custom-integrations', 1, 5, 2, 25, 500, '4Gi', '4000m');
END $$;

-- =====================================================
-- Update User Profiles with Default Plan
-- =====================================================

-- Set default plan for users without a plan
UPDATE user_profiles 
SET 
  plan_id = (SELECT id FROM plans WHERE razorpay_plan_id = 'plan_web_audit_free' LIMIT 1),
  plan_status = 'free',
  queue_priority = 4,
  updated_at = NOW()
WHERE plan_id IS NULL;

-- =====================================================
-- Verify Updates
-- =====================================================

-- Show updated plans
SELECT 
  name,
  razorpay_plan_id,
  amount,
  interval,
  is_active,
  created_at,
  updated_at
FROM plans 
ORDER BY amount ASC;

-- Show queue priorities
SELECT 
  p.name as plan_name,
  qp.queue_name,
  qp.priority_level,
  qp.max_workers,
  qp.concurrency,
  qp.memory_limit,
  qp.cpu_limit
FROM queue_priorities qp
JOIN plans p ON qp.plan_id = p.id
ORDER BY qp.priority_level ASC, p.name ASC;

-- Show user plan distribution
SELECT 
  p.name as plan_name,
  COUNT(up.id) as user_count,
  COUNT(CASE WHEN up.plan_status = 'active' THEN 1 END) as active_users
FROM plans p
LEFT JOIN user_profiles up ON p.id = up.plan_id
GROUP BY p.name, p.amount
ORDER BY p.amount ASC;
