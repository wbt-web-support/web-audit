# Create Test Users Script

This script creates 20 test users in your Supabase database for testing purposes.

## Prerequisites

You need to set up the following environment variables:

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (not the anon key)

## Setup

### Option 1: Using .env.local file (Recommended)

Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Option 2: Using terminal environment variables

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run create:test-users

# Windows CMD
set NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run create:test-users

# Linux/Mac
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run create:test-users
```

## Running the Script

```bash
npm run create:test-users
```

## What it creates

The script will create 20 test users with the following credentials:

- **Emails**: test1@gmail.com, test2@gmail.com, ..., test20@gmail.com
- **Passwords**: test1, test2, ..., test20
- **Email confirmed**: Yes (all users are automatically confirmed)

## Output

The script provides detailed output showing:
- ✅ Successfully created users
- ❌ Failed user creations (with error messages)
- 📊 Summary of results

## Notes

- The script uses the Supabase Admin API (service role key) to create users
- All users are created with `email_confirm: true` so they can log in immediately
- There's a small delay between user creations to avoid rate limiting
- The script will exit with error code 1 if environment variables are missing
