-- Add subscription fields to user_profiles table
-- This allows us to track which plan is active and when it expires

ALTER TABLE user_profiles 
ADD COLUMN active_plan_name TEXT,
ADD COLUMN active_plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN active_plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_subscription_active BOOLEAN DEFAULT FALSE,
ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_trial_active BOOLEAN DEFAULT TRUE;

-- Add indexes for performance
CREATE INDEX idx_user_profiles_active_plan ON user_profiles(active_plan_name, is_subscription_active);
CREATE INDEX idx_user_profiles_trial_status ON user_profiles(is_trial_active, trial_end_date);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.active_plan_name IS 'Name of the currently active subscription plan (Starter, Professional, Enterprise)';
COMMENT ON COLUMN user_profiles.active_plan_start_date IS 'When the active subscription plan started';
COMMENT ON COLUMN user_profiles.active_plan_end_date IS 'When the active subscription plan expires';
COMMENT ON COLUMN user_profiles.is_subscription_active IS 'Whether the user has an active paid subscription';
COMMENT ON COLUMN user_profiles.trial_start_date IS 'When the free trial started (usually same as created_at)';
COMMENT ON COLUMN user_profiles.trial_end_date IS 'When the free trial expires';
COMMENT ON COLUMN user_profiles.is_trial_active IS 'Whether the user is still in their free trial period';

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to update subscription status when user logs in
CREATE OR REPLACE FUNCTION update_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if trial has expired
    IF NEW.is_trial_active AND NEW.trial_end_date < NOW() THEN
        NEW.is_trial_active = FALSE;
    END IF;
    
    -- Check if subscription has expired
    IF NEW.is_subscription_active AND NEW.active_plan_end_date < NOW() THEN
        NEW.is_subscription_active = FALSE;
        NEW.active_plan_name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update subscription status
CREATE TRIGGER update_subscription_status_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_subscription_status();
