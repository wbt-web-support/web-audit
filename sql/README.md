# Database Migrations

This directory contains SQL migrations for the web-audit application.

## Migration Order

Apply migrations in numerical order:

1. `01_user_profiles.sql` - Creates user profiles table
2. `02_audit_sessions.sql` - Creates audit sessions table
3. `03_content_analysis_cache.sql` - Creates content analysis cache table
4. `04_add_crawl_type.sql` - Adds crawl type to audit sessions
5. `05_restructure_audit_results.sql` - Restructures audit results
6. `06_add_website_info_to_sessions.sql` - Adds website info to sessions
7. `07_add_page_analysis_status.sql` - Adds page analysis status
8. `07_add_tags_analysis_to_audit_results.sql` - Adds tags analysis
9. `08_add_custom_urls_analysis_to_audit_projects.sql` - Adds custom URLs analysis
10. `09_add_social_meta_analysis_to_audit_results.sql` - Adds social meta analysis
11. `10_add_all_image_analysis_to_audit_projects.sql` - Adds image analysis
12. `11_performance_optimization.sql` - Performance optimizations
13. `12_rls_policies.sql` - Row Level Security policies
14. `13_add_stopped_status_to_analysis.sql` - Adds stopped status
15. `14_social_auth_profiles.sql` - Social auth profiles
16. `15_add_instructions_to_audit_projects.sql` - Adds instructions
17. `16_add_first_last_name_to_user_profiles.sql` - Adds first/last name
18. `17_user_subscriptions.sql` - Creates user subscriptions table
19. `18_add_subscription_fields_to_user_profiles.sql` - Adds subscription fields
20. `19_create_billing_history_table.sql` - Creates billing history
21. `20_updated_user_subscriptions.sql` - Updates user subscriptions
22. `21_add_subscription_fields_to_user_profiles.sql` - Adds more subscription fields
23. `22_auto_initialize_trial_for_new_users.sql` - Auto-initializes trial for new users
24. `23_fix_user_profile_trial_initialization.sql` - **FIXES TRIAL INITIALIZATION ISSUE**

## Important: Migration 23

Migration 23 (`23_fix_user_profile_trial_initialization.sql`) fixes the issue where user profiles were not getting trial data initialized properly after login/signup. This migration:

1. Updates the `handle_new_user()` function to properly set trial data
2. Ensures all required columns exist before updating
3. Updates existing user profiles that don't have trial data
4. Fixes the database trigger to work correctly

### How to Apply

Run this migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of 23_fix_user_profile_trial_initialization.sql
```

### What it fixes

- `trial_start_date` - When the trial started
- `trial_end_date` - When the trial expires (14 days from signup)
- `active_plan_name` - Set to "Free Trial"
- `active_plan_start_date` - When the active plan started
- `active_plan_end_date` - When the active plan expires
- `is_trial_active` - Set to true for new users
- `is_subscription_active` - Set to false for trial users

### After applying

After applying this migration, new users who sign up (both manual and Google OAuth) will automatically have their trial data initialized with:
- 14-day free trial
- Proper trial start and end dates
- Active plan information
- Trial status flags

Existing users without trial data will also be updated with the appropriate trial information. 