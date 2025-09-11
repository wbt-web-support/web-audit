-- Test script to verify subscription management schema
-- Run this to check if all tables and relationships are working

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'plans', 'user_profiles', 'payments', 'queue_priorities')
ORDER BY table_name;

-- Check subscriptions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any test data
SELECT COUNT(*) as subscription_count FROM subscriptions;
SELECT COUNT(*) as plan_count FROM plans;
SELECT COUNT(*) as user_profile_count FROM user_profiles;

-- Test the plan_statistics view
SELECT * FROM plan_statistics LIMIT 5;

-- Test the subscription_analytics view
SELECT * FROM subscription_analytics LIMIT 5;
