-- Web Audit SaaS Database Schema for Supabase
-- Modified to work with existing Supabase auth.users table

-- Create a profiles table that references Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  tier VARCHAR(20) DEFAULT 'BASIC' CHECK (tier IN ('BASIC', 'PRO', 'ENTERPRISE')),
  subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit projects table (references profiles instead of users)
CREATE TABLE IF NOT EXISTS audit_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  crawl_type VARCHAR(20) DEFAULT 'full' CHECK (crawl_type IN ('full', 'single')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Company details
  company_name VARCHAR(255),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  custom_info TEXT,
  
  -- Audit configuration
  instructions JSONB,
  services JSONB,
  custom_urls JSONB,
  stripe_key_urls JSONB,
  
  -- Results and metadata
  audit_results JSONB,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  job_id VARCHAR(255),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- Authentication logs table for security monitoring
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    endpoint TEXT,
    method TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'auth_attempt', 'auth_success', 'auth_failure', 'auth_error', 'sign_out'
    ))
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_id ON audit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_status ON audit_projects(status);
CREATE INDEX IF NOT EXISTS idx_audit_projects_created_at ON audit_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_projects_base_url ON audit_projects(base_url);
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_base_url ON audit_projects(user_id, base_url);

-- Indexes for auth logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);

-- Composite index for user projects query
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_status_created ON audit_projects(user_id, status, created_at DESC);

-- Profiles tier index
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Function to create audit project with validation (updated for profiles)
CREATE OR REPLACE FUNCTION create_audit_project_optimized(
  p_user_id UUID,
  p_base_url TEXT,
  p_crawl_type VARCHAR(20) DEFAULT 'full',
  p_instructions JSONB DEFAULT NULL,
  p_services JSONB DEFAULT NULL,
  p_company_name VARCHAR(255) DEFAULT NULL,
  p_phone_number VARCHAR(50) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_custom_info TEXT DEFAULT NULL,
  p_custom_urls JSONB DEFAULT NULL,
  p_stripe_key_urls JSONB DEFAULT NULL,
  p_user_tier VARCHAR(20) DEFAULT 'BASIC'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_tier_config JSONB;
  v_current_count INTEGER;
  v_max_projects INTEGER;
  v_existing_project_id UUID;
  v_new_project_id UUID;
  v_result JSONB;
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists, create if not
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Create profile from auth.users data
    INSERT INTO profiles (id, email, name, tier)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', au.email),
      p_user_tier
    FROM auth.users au
    WHERE au.id = p_user_id;
  END IF;
  
  -- Get user tier configuration
  v_user_tier_config := CASE p_user_tier
    WHEN 'BASIC' THEN '{"maxProjects": 5}'::jsonb
    WHEN 'PRO' THEN '{"maxProjects": 50}'::jsonb
    WHEN 'ENTERPRISE' THEN '{"maxProjects": 500}'::jsonb
    ELSE '{"maxProjects": 5}'::jsonb
  END;
  
  v_max_projects := (v_user_tier_config->>'maxProjects')::INTEGER;
  
  -- Check for duplicate URL
  SELECT id INTO v_existing_project_id
  FROM audit_projects
  WHERE user_id = p_user_id AND base_url = LOWER(TRIM(p_base_url));
  
  IF v_existing_project_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A project with this URL already exists',
      'error_code', 'DUPLICATE_URL',
      'project_id', v_existing_project_id
    );
  END IF;
  
  -- Check project count limit
  SELECT COUNT(*) INTO v_current_count
  FROM audit_projects
  WHERE user_id = p_user_id;
  
  IF v_current_count >= v_max_projects THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project limit exceeded for your tier',
      'error_code', 'TOO_MANY_PROJECTS',
      'current_count', v_current_count,
      'max_allowed', v_max_projects,
      'user_tier', p_user_tier
    );
  END IF;
  
  -- Create the project
  INSERT INTO audit_projects (
    user_id, base_url, crawl_type, instructions, services,
    company_name, phone_number, email, address, custom_info,
    custom_urls, stripe_key_urls
  ) VALUES (
    p_user_id, LOWER(TRIM(p_base_url)), p_crawl_type, p_instructions, p_services,
    p_company_name, p_phone_number, p_email, p_address, p_custom_info,
    p_custom_urls, p_stripe_key_urls
  ) RETURNING id INTO v_new_project_id;
  
  -- Get the created project
  SELECT to_jsonb(ap.*) INTO v_result
  FROM audit_projects ap
  WHERE ap.id = v_new_project_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'project', v_result
  );
END;
$$;

-- Function to update project status
CREATE OR REPLACE FUNCTION update_project_status(
  p_project_id UUID,
  p_status VARCHAR(20),
  p_audit_results JSONB DEFAULT NULL,
  p_overall_score INTEGER DEFAULT NULL,
  p_job_id VARCHAR(255) DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE audit_projects
  SET 
    status = p_status,
    updated_at = NOW(),
    audit_results = COALESCE(p_audit_results, audit_results),
    overall_score = COALESCE(p_overall_score, overall_score),
    job_id = COALESCE(p_job_id, job_id),
    error_message = COALESCE(p_error_message, error_message),
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
    failed_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE failed_at END
  WHERE id = p_project_id
  RETURNING to_jsonb(audit_projects.*) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'project', v_result);
END;
$$;

-- Function to get user project statistics
CREATE OR REPLACE FUNCTION get_user_project_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_count INTEGER;
  v_completed_count INTEGER;
  v_processing_count INTEGER;
  v_failed_count INTEGER;
  v_today_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO v_total_count
  FROM audit_projects
  WHERE user_id = p_user_id;
  
  -- Get completed count
  SELECT COUNT(*) INTO v_completed_count
  FROM audit_projects
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Get processing count
  SELECT COUNT(*) INTO v_processing_count
  FROM audit_projects
  WHERE user_id = p_user_id AND status = 'processing';
  
  -- Get failed count
  SELECT COUNT(*) INTO v_failed_count
  FROM audit_projects
  WHERE user_id = p_user_id AND status = 'failed';
  
  -- Get today's count
  SELECT COUNT(*) INTO v_today_count
  FROM audit_projects
  WHERE user_id = p_user_id AND DATE(created_at) = CURRENT_DATE;
  
  v_result := jsonb_build_object(
    'total', v_total_count,
    'completed', v_completed_count,
    'processing', v_processing_count,
    'failed', v_failed_count,
    'today', v_today_count
  );
  
  RETURN v_result;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_projects_updated_at BEFORE UPDATE ON audit_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'BASIC'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Audit projects policies
CREATE POLICY "Users can view own projects" ON audit_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON audit_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON audit_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON audit_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Auth logs policies (admin only)
CREATE POLICY "Only authenticated users can insert auth logs" ON auth_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
