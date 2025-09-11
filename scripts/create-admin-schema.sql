-- Admin Panel Database Schema for Priority-Based Queue System
-- This script creates all necessary tables for plan management, subscriptions, and queue priorities

-- 1. Plans table for Razorpay plan configuration
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  razorpay_plan_id VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  interval VARCHAR(20) NOT NULL, -- monthly, yearly
  description TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  queue_priority INTEGER NOT NULL DEFAULT 3, -- 1=highest, 3=lowest
  max_projects INTEGER NOT NULL DEFAULT 1,
  max_pages_per_project INTEGER NOT NULL DEFAULT 5,
  includes_screenshots BOOLEAN DEFAULT false,
  includes_ai_analysis BOOLEAN DEFAULT false,
  queue_wait_time_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Plans table (extends user_profiles)
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, suspended, cancelled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- 3. Subscriptions table for Razorpay integration
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  razorpay_subscription_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_customer_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, cancelled, expired
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
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
  razorpay_order_id VARCHAR(100),
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL, -- success, failed, pending, refunded
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Queue Priorities table for queue management
CREATE TABLE IF NOT EXISTS queue_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  queue_name VARCHAR(100) NOT NULL, -- web-scraping, page-analysis, screenshot-generation, ai-analysis
  priority_level INTEGER NOT NULL, -- 1=highest, 5=lowest
  max_workers INTEGER NOT NULL DEFAULT 1,
  concurrency INTEGER NOT NULL DEFAULT 1,
  max_queue_size INTEGER NOT NULL DEFAULT 100,
  delay_between_jobs INTEGER DEFAULT 0, -- milliseconds
  memory_limit_mb INTEGER DEFAULT 512,
  cpu_limit_percent INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, queue_name)
);

-- 6. Audit Projects table updates (add plan_id)
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id),
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS queue_status VARCHAR(20) DEFAULT 'pending'; -- pending, processing, completed, failed

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_queue_priorities_plan_id ON queue_priorities(plan_id);
CREATE INDEX IF NOT EXISTS idx_queue_priorities_queue_name ON queue_priorities(queue_name);
CREATE INDEX IF NOT EXISTS idx_audit_projects_plan_id ON audit_projects(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_priority ON audit_projects(priority_level);

-- 8. Insert default plans
INSERT INTO plans (name, razorpay_plan_id, amount, interval, description, features, queue_priority, max_projects, max_pages_per_project, includes_screenshots, includes_ai_analysis, queue_wait_time_minutes) VALUES
('Free Plan', 'plan_free', 0, 'monthly', 'Basic web audit with SEO analysis', '{"seo_analysis": true, "basic_reports": true}', 3, 1, 5, false, false, 30),
('Pro Plan', 'plan_pro_monthly', 99900, 'monthly', 'Advanced web audit with screenshots', '{"seo_analysis": true, "screenshots": true, "ai_analysis": true, "advanced_reports": true}', 2, 5, 20, true, true, 5),
('Enterprise Plan', 'plan_enterprise_monthly', 199900, 'monthly', 'Premium web audit with priority processing', '{"seo_analysis": true, "screenshots": true, "ai_analysis": true, "advanced_reports": true, "priority_support": true, "custom_features": true}', 1, 50, 100, true, true, 0);

-- 9. Insert default queue priorities for each plan
INSERT INTO queue_priorities (plan_id, queue_name, priority_level, max_workers, concurrency, max_queue_size, delay_between_jobs, memory_limit_mb, cpu_limit_percent) 
SELECT 
  p.id,
  q.queue_name,
  CASE 
    WHEN p.name = 'Free Plan' THEN 3
    WHEN p.name = 'Pro Plan' THEN 2
    WHEN p.name = 'Enterprise Plan' THEN 1
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 5
    WHEN p.name = 'Pro Plan' THEN 15
    WHEN p.name = 'Enterprise Plan' THEN 25
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 1
    WHEN p.name = 'Pro Plan' THEN 3
    WHEN p.name = 'Enterprise Plan' THEN 5
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 50
    WHEN p.name = 'Pro Plan' THEN 100
    WHEN p.name = 'Enterprise Plan' THEN 200
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 5000
    WHEN p.name = 'Pro Plan' THEN 1000
    WHEN p.name = 'Enterprise Plan' THEN 0
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 256
    WHEN p.name = 'Pro Plan' THEN 512
    WHEN p.name = 'Enterprise Plan' THEN 1024
  END,
  CASE 
    WHEN p.name = 'Free Plan' THEN 25
    WHEN p.name = 'Pro Plan' THEN 50
    WHEN p.name = 'Enterprise Plan' THEN 75
  END
FROM plans p
CROSS JOIN (
  SELECT 'web-scraping' as queue_name
  UNION SELECT 'page-analysis'
  UNION SELECT 'screenshot-generation'
  UNION SELECT 'ai-analysis'
) q;

-- 10. Create RLS policies for security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_priorities ENABLE ROW LEVEL SECURITY;

-- Admin can access all tables
CREATE POLICY "Admin can access all plans" ON plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can access all user_plans" ON user_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can access all subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can access all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can access all queue_priorities" ON queue_priorities FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can only access their own data
CREATE POLICY "Users can view their own user_plans" ON user_plans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM subscriptions WHERE id = payments.subscription_id AND user_id = auth.uid())
);

-- 11. Create functions for plan management
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name VARCHAR,
  plan_features JSONB,
  queue_priority INTEGER,
  max_projects INTEGER,
  max_pages_per_project INTEGER,
  includes_screenshots BOOLEAN,
  includes_ai_analysis BOOLEAN,
  queue_wait_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.features,
    p.queue_priority,
    p.max_projects,
    p.max_pages_per_project,
    p.includes_screenshots,
    p.includes_ai_analysis,
    p.queue_wait_time_minutes
  FROM user_plans up
  JOIN plans p ON up.plan_id = p.id
  WHERE up.user_id = user_uuid 
    AND up.status = 'active'
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  ORDER BY up.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to update user plan
CREATE OR REPLACE FUNCTION update_user_plan(
  user_uuid UUID,
  new_plan_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the requesting user is admin
  SELECT role = 'admin' INTO is_admin
  FROM user_profiles 
  WHERE id = admin_user_id;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Deactivate current plan
  UPDATE user_plans 
  SET status = 'inactive', updated_at = NOW()
  WHERE user_id = user_uuid AND status = 'active';
  
  -- Add new plan
  INSERT INTO user_plans (user_id, plan_id, status, started_at)
  VALUES (user_uuid, new_plan_id, 'active', NOW())
  ON CONFLICT (user_id, plan_id) 
  DO UPDATE SET status = 'active', started_at = NOW(), updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
