-- Fix the trigger constraint issue
-- Run this SQL in your Supabase dashboard SQL editor

-- Option 1: Update the trigger function to set subscription_status to 'inactive'
CREATE OR REPLACE FUNCTION handle_new_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Set subscription_status to 'inactive' instead of 'free' to satisfy constraint
  NEW.subscription_status := 'inactive';
  
  -- Set other default values if not already set
  IF NEW.role IS NULL THEN
    NEW.role := 'user';
  END IF;
  
  IF NEW.tier IS NULL THEN
    NEW.tier := 'BASIC';
  END IF;
  
  IF NEW.plan_status IS NULL THEN
    NEW.plan_status := 'free';
  END IF;
  
  IF NEW.queue_priority IS NULL THEN
    NEW.queue_priority := 3;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Option 2: Alternative - Update the constraint to allow 'free' values
-- Uncomment the lines below if you prefer to allow 'free' as a valid subscription_status

-- ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;
-- ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_status_check 
-- CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due', 'free'));

-- Test the fix by creating a test profile
-- This should work after running the above SQL
INSERT INTO user_profiles (
  id, email, full_name, first_name, last_name, 
  role, tier, subscription_status, plan_status, queue_priority
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'test@example.com', 
  'Test User', 
  'Test', 
  'User',
  'user',
  'BASIC',
  'inactive',
  'free',
  3
) ON CONFLICT (id) DO NOTHING;

-- Clean up test profile
DELETE FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000000';
