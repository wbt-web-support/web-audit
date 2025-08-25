-- Add subscription fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS current_plan_name TEXT DEFAULT 'Free',
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'month',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_plan ON user_profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);

-- Update existing profiles to have default values
UPDATE user_profiles 
SET 
  current_plan_id = 'free',
  current_plan_name = 'Free',
  billing_period = 'month',
  subscription_status = 'inactive'
WHERE current_plan_id IS NULL;

-- Create a function to update user profile subscription info
CREATE OR REPLACE FUNCTION update_user_subscription_info(
  p_user_id UUID,
  p_plan_id TEXT,
  p_plan_name TEXT,
  p_billing_period TEXT,
  p_status TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    current_plan_id = p_plan_id,
    current_plan_name = p_plan_name,
    billing_period = p_billing_period,
    subscription_status = p_status,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    subscription_start_date = COALESCE(p_start_date, subscription_start_date),
    subscription_end_date = COALESCE(p_end_date, subscription_end_date),
    next_billing_date = CASE 
      WHEN p_end_date IS NOT NULL THEN p_end_date
      ELSE next_billing_date
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
