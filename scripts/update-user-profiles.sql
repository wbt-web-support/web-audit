-- Update user_profiles table to include first_name and last_name fields
-- Run this script in your Supabase SQL editor

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update the trigger function to handle first_name and last_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Get full name from user metadata
  user_full_name := new.raw_user_meta_data->>'full_name';
  
  -- For Google OAuth, extract first and last name from full_name
  IF user_full_name IS NOT NULL THEN
    -- Split full name into first and last name
    user_first_name := split_part(user_full_name, ' ', 1);
    user_last_name := CASE 
      WHEN array_length(string_to_array(user_full_name, ' '), 1) > 1 
      THEN array_to_string(string_to_array(user_full_name, ' ')[2:], ' ')
      ELSE NULL
    END;
  END IF;
  
  -- Insert or update user profile
  INSERT INTO public.user_profiles (id, email, full_name, first_name, last_name)
  VALUES (new.id, new.email, user_full_name, user_first_name, user_last_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = CURRENT_TIMESTAMP;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing records to populate first_name and last_name from full_name
UPDATE user_profiles 
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
    THEN array_to_string(string_to_array(full_name, ' ')[2:], ' ')
    ELSE NULL
  END
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Success message
SELECT 'User profiles updated successfully!' as status;
