# User Profile Updates - First Name and Last Name Fields

## Overview
Added first name and last name fields to the user profile system to provide better user identification and personalization.

## Changes Made

### 1. Database Schema Updates
- **File**: `sql/16_add_first_last_name_to_user_profiles.sql`
- Added `first_name` and `last_name` columns to the `user_profiles` table
- Updated the `handle_new_user()` trigger function to capture first_name and last_name from user metadata

### 2. TypeScript Type Updates
- **File**: `lib/types/database.ts`
- Updated `UserProfile` interface to include `first_name` and `last_name` fields
- Maintained backward compatibility with existing `full_name` field

### 3. Sign-Up Form Updates
- **File**: `components/sign-up-form.tsx`
- Added first name and last name input fields with proper validation
- Updated form submission to include first_name and last_name in user metadata
- Added validation to ensure both fields are required
- Maintained existing password and email validation

### 4. Profile Page Updates
- **File**: `app/(dashboard)/profile/page.tsx`
- Updated `UserProfile` interface to include new fields
- Modified name display logic to show first_name + last_name when available
- Falls back to full_name for backward compatibility

### 5. API Updates
- **File**: `app/api/profile/route.ts`
- Updated profile API to handle first_name and last_name fields
- Maintains backward compatibility with existing full_name field

## Database Migration
To apply the database changes, run the SQL migration:
```sql
-- Execute the contents of sql/16_add_first_last_name_to_user_profiles.sql
```

## User Experience
- New users will be prompted to enter their first and last name during sign-up
- Existing users will continue to see their full_name if available
- Profile page displays the name in format: "First Last" when both fields are available
- Falls back to full_name or "Not provided" for backward compatibility

## Backward Compatibility
- All existing user profiles continue to work
- The `full_name` field is preserved for existing users
- New users get both separate fields and a combined full_name
- API responses include all three name fields for maximum compatibility
