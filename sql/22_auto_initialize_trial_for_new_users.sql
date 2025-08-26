-- Auto-initialize trial for new users
-- This trigger automatically sets up trial data when a new user profile is created

-- Function to initialize trial data for new users
CREATE OR REPLACE FUNCTION initialize_trial_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_trial_days INTEGER;
    trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get free trial days from environment (default to 14 if not set)
    -- Note: In production, you might want to store this in a config table
    free_trial_days := COALESCE(
        (SELECT value::INTEGER FROM app_config WHERE key = 'free_trial_days' LIMIT 1),
        14
    );
    
    -- Calculate trial end date
    trial_end_date := NEW.created_at + (free_trial_days || ' days')::INTERVAL;
    
    -- Set trial data for new user
    NEW.trial_start_date := NEW.created_at;
    NEW.trial_end_date := trial_end_date;
    NEW.is_trial_active := TRUE;
    NEW.active_plan_name := 'Free Trial';
    NEW.active_plan_start_date := NEW.created_at;
    NEW.active_plan_end_date := trial_end_date;
    NEW.is_subscription_active := FALSE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically initialize trial when new user profile is created
CREATE TRIGGER auto_initialize_trial_trigger
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_trial_for_new_user();

-- Create app_config table for storing configuration values
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default free trial days configuration
INSERT INTO app_config (key, value, description) 
VALUES ('free_trial_days', '14', 'Number of days for free trial')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Add RLS policy for app_config table
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to app_config" ON app_config
    FOR SELECT USING (true);

-- Function to update app configuration
CREATE OR REPLACE FUNCTION update_app_config(config_key TEXT, config_value TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO app_config (key, value) 
    VALUES (config_key, config_value)
    ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_app_config(TEXT, TEXT) TO authenticated;
