-- =====================================================
-- Plan Management Database Schema
-- =====================================================

-- 1. Plans table for Razorpay plan configuration
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  razorpay_plan_id VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  interval VARCHAR(20) NOT NULL, -- monthly, yearly
  description TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Plans table (extends user_profiles)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id),
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'free', -- free, active, expired, cancelled
ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 3; -- 1=enterprise, 2=pro, 3=free

-- 3. Subscriptions table for Razorpay integration
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  razorpay_subscription_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL, -- active, paused, cancelled, expired
  current_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_end TIMESTAMP WITH TIME ZONE NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payments table for payment tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL, -- created, authorized, captured, failed, refunded
  method VARCHAR(20), -- card, upi, netbanking, wallet
  description TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Queue Priorities table for queue management
CREATE TABLE IF NOT EXISTS queue_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id),
  queue_name VARCHAR(50) NOT NULL,
  priority_level INTEGER NOT NULL, -- 1=highest, 5=lowest
  max_workers INTEGER NOT NULL DEFAULT 1,
  concurrency INTEGER NOT NULL DEFAULT 1,
  max_queue_size INTEGER NOT NULL DEFAULT 100,
  delay_between_jobs INTEGER DEFAULT 0, -- milliseconds
  memory_limit VARCHAR(20) DEFAULT '512Mi',
  cpu_limit VARCHAR(20) DEFAULT '500m',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, queue_name)
);

-- 6. Add plan_id to audit_projects table
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id),
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 3;

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Plans table indexes
CREATE INDEX IF NOT EXISTS idx_plans_razorpay_plan_id ON plans(razorpay_plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_id ON user_profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_status ON user_profiles(plan_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_queue_priority ON user_profiles(queue_priority);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription_id ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_end ON subscriptions(current_end);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- Queue priorities indexes
CREATE INDEX IF NOT EXISTS idx_queue_priorities_plan_id ON queue_priorities(plan_id);
CREATE INDEX IF NOT EXISTS idx_queue_priorities_priority_level ON queue_priorities(priority_level);
CREATE INDEX IF NOT EXISTS idx_queue_priorities_queue_name ON queue_priorities(queue_name);

-- Audit projects indexes
CREATE INDEX IF NOT EXISTS idx_audit_projects_plan_id ON audit_projects(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_priority_level ON audit_projects(priority_level);

-- =====================================================
-- Insert Default Plans
-- =====================================================

INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, is_active) VALUES
(
  'Free Plan',
  'plan_web_audit_free',
  0,
  'monthly',
  'Perfect for trying out our web audit tool',
  '{
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
  true
),
(
  'Pro Plan',
  'plan_web_audit_pro_monthly',
  90000,
  'monthly',
  'Ideal for freelancers and small businesses',
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
    "throttle_heavy_usage": true
  }',
  true
),
(
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
),
(
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
),
(
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
),
(
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
);

-- =====================================================
-- Insert Default Queue Priorities
-- =====================================================

-- Get plan IDs for queue priorities
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
-- Create Functions for Plan Management
-- =====================================================

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TABLE (
    plan_id UUID,
    plan_name VARCHAR,
    plan_status VARCHAR,
    queue_priority INTEGER,
    features JSONB,
    plan_start_date TIMESTAMP WITH TIME ZONE,
    plan_end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        up.plan_status,
        up.queue_priority,
        p.features,
        up.plan_start_date,
        up.plan_end_date
    FROM user_profiles up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update user plan
CREATE OR REPLACE FUNCTION update_user_plan(
    user_uuid UUID,
    new_plan_id UUID,
    plan_status VARCHAR DEFAULT 'active'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        plan_id = new_plan_id,
        plan_status = plan_status,
        plan_start_date = CASE WHEN plan_status = 'active' THEN NOW() ELSE plan_start_date END,
        plan_end_date = CASE 
            WHEN plan_status = 'active' THEN NOW() + INTERVAL '1 month'
            ELSE plan_end_date 
        END,
        queue_priority = (SELECT priority_level FROM queue_priorities WHERE plan_id = new_plan_id LIMIT 1),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create Triggers for Updated At
-- =====================================================

-- Plans table trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_priorities_updated_at
    BEFORE UPDATE ON queue_priorities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Create Views for Admin Dashboard
-- =====================================================

-- View for plan statistics
CREATE OR REPLACE VIEW plan_statistics AS
SELECT 
    p.id,
    p.name,
    p.amount,
    p.interval,
    COUNT(up.id) as user_count,
    COUNT(CASE WHEN up.plan_status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN up.plan_status = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN up.plan_status = 'expired' THEN 1 END) as expired_users,
    COUNT(CASE WHEN up.plan_status = 'cancelled' THEN 1 END) as cancelled_users
FROM plans p
LEFT JOIN user_profiles up ON p.id = up.plan_id
GROUP BY p.id, p.name, p.amount, p.interval;

-- View for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
    p.name as plan_name,
    s.status,
    COUNT(s.id) as subscription_count,
    SUM(s.amount) as total_revenue,
    AVG(s.amount) as average_revenue,
    COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_subscriptions_30d,
    COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_subscriptions_7d
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
GROUP BY p.name, s.status;

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON plans TO authenticated;
GRANT SELECT ON plan_statistics TO authenticated;
GRANT SELECT ON subscription_analytics TO authenticated;

-- Grant permissions to service role
GRANT ALL ON plans TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON payments TO service_role;
GRANT ALL ON queue_priorities TO service_role;
GRANT ALL ON plan_statistics TO service_role;
GRANT ALL ON subscription_analytics TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_plan(UUID, UUID, VARCHAR) TO service_role;
