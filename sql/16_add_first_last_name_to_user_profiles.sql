-- Add first_name and last_name columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update the trigger function to handle first_name and last_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, full_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
