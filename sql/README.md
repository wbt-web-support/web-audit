# Database Setup Instructions

To set up the database tables for the Web Audit application, follow these steps:

## Prerequisites

1. Make sure you have a Supabase project created
2. Have your Supabase project's connection details ready

## Setting Up the Tables

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the SQL scripts in the following order:

### 1. User Profiles Table (01_user_profiles.sql)
This creates the user profiles table and sets up automatic profile creation when users sign up.

### 2. Audit Sessions Tables (02_audit_sessions.sql)
This creates:
- `audit_sessions` - Main table for audit sessions
- `scraped_pages` - Stores scraped page data
- `audit_results` - Stores analysis results for each page

### 3. Content Analysis Caching (03_content_analysis_cache.sql)
This adds:
- Performance indexes for cached AI analysis results
- Optimizations for content analysis lookups
- Support for storing and retrieving cached Gemini API responses

### 4. Add Content Audit Type (04_add_content_audit_type.sql)
This adds:
- 'content' to the audit_type constraint
- Support for content analysis caching

### 5. Restructure Audit Results (05_restructure_audit_results.sql) ⚠️ **BREAKING CHANGE**
This completely restructures the audit_results table for better performance:
- **Single entry per page** instead of multiple rows per audit type
- Separate JSONB fields for each analysis type (`grammar_analysis`, `seo_analysis`, etc.)
- Added `page_name` field for easy identification
- Overall score and status fields
- **Note**: This will drop the existing audit_results table and recreate it

## Important Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- The `user_profiles` table is automatically populated when a user signs up
- Make sure to run the scripts in order as there are foreign key dependencies
- Content analysis results are cached in the `audit_results` table with `audit_type='content'` to avoid repeated AI API calls
- Cached analysis can be refreshed by users when needed via the UI

## Environment Variables

Ensure you have the following environment variables set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Verifying the Setup

After running the SQL scripts, you can verify the setup by:

1. Going to the Table Editor in Supabase Dashboard
2. Checking that all tables are created with the correct columns
3. Verifying that RLS policies are enabled on all tables 