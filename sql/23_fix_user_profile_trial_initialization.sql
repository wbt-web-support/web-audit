-- Fix user profile trial initialization
-- Update the handle_new_user function to properly initialize trial data

-- Drop the existing auto_initialize_trial_trigger first to avoid conflicts
DROP TRIGGER IF EXISTS auto_initialize_trial_trigger ON user_profiles;

-- Update the handle_new_user function to include trial initialization
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_trial_days INTEGER;
    trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get free trial days from environment (default to 14 if not set)
    free_trial_days := COALESCE(
        (SELECT value::INTEGER FROM app_config WHERE key = 'free_trial_days' LIMIT 1),
        14
    );
    
    -- Calculate trial end date
    trial_end_date := NOW() + (free_trial_days || ' days')::INTERVAL;
    
    -- Insert user profile with trial data
    INSERT INTO public.user_profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        full_name,
        trial_start_date,
        trial_end_date,
        is_trial_active,
        active_plan_name,
        active_plan_start_date,
        active_plan_end_date,
        is_subscription_active
    )
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'full_name',
        NOW(),
        trial_end_date,
        TRUE,
        'Free Trial',
        NOW(),
        trial_end_date,
        FALSE
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure all required columns exist before updating
DO $$
BEGIN
    -- Add current_plan_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_plan_id') THEN
        ALTER TABLE user_profiles ADD COLUMN current_plan_id TEXT DEFAULT 'free';
    END IF;
    
    -- Add current_plan_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_plan_name') THEN
        ALTER TABLE user_profiles ADD COLUMN current_plan_name TEXT DEFAULT 'Free';
    END IF;
    
    -- Add subscription_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    END IF;
END $$;

-- Update existing user profiles that don't have trial data
UPDATE user_profiles 
SET 
    trial_start_date = COALESCE(trial_start_date, created_at),
    trial_end_date = COALESCE(trial_end_date, created_at + INTERVAL '14 days'),
    is_trial_active = COALESCE(is_trial_active, TRUE),
    active_plan_name = COALESCE(active_plan_name, 'Free Trial'),
    active_plan_start_date = COALESCE(active_plan_start_date, created_at),
    active_plan_end_date = COALESCE(active_plan_end_date, created_at + INTERVAL '14 days'),
    is_subscription_active = COALESCE(is_subscription_active, FALSE),
    current_plan_id = COALESCE(current_plan_id, 'free'),
    current_plan_name = COALESCE(current_plan_name, 'Free Trial'),
    subscription_status = COALESCE(subscription_status, 'trial')
WHERE trial_start_date IS NULL 
   OR trial_end_date IS NULL 
   OR active_plan_name IS NULL;

-- Add comment to document the function
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new user profile with trial data when a user signs up';
