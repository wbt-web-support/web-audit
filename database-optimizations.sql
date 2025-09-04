-- Database optimization for audit-projects API
-- This replaces 3 separate queries with 1 atomic operation

-- Function to create audit project with all validations
CREATE OR REPLACE FUNCTION create_audit_project_optimized(
  p_user_id UUID,
  p_base_url TEXT,
  p_crawl_type TEXT DEFAULT 'full',
  p_instructions JSONB DEFAULT NULL,
  p_services JSONB DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_custom_info TEXT DEFAULT NULL,
  p_custom_urls JSONB DEFAULT NULL,
  p_stripe_key_urls JSONB DEFAULT NULL,
  p_user_tier TEXT DEFAULT 'BASIC'
) RETURNS JSONB AS $$
DECLARE
  project_count INTEGER;
  existing_project_id UUID;
  new_project RECORD;
  max_projects INTEGER;
  ts_now TIMESTAMPTZ;
BEGIN
  ts_now := NOW();
  
  -- Set max projects based on user tier
  max_projects := CASE p_user_tier
    WHEN 'FREE' THEN 50
    WHEN 'BASIC' THEN 200
    WHEN 'PREMIUM' THEN 1000
    WHEN 'ENTERPRISE' THEN 5000
    ELSE 200
  END;
  
  -- Check project count
  SELECT COUNT(*) INTO project_count
  FROM audit_projects 
  WHERE user_id = p_user_id;
  
  -- Check for existing project with same URL
  SELECT id INTO existing_project_id
  FROM audit_projects 
  WHERE user_id = p_user_id AND base_url = p_base_url 
  LIMIT 1;
  
  -- Return error if project exists
  IF existing_project_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A project with this URL already exists',
      'error_code', 'DUPLICATE_URL',
      'project_id', existing_project_id
    );
  END IF;
  
  -- Check project limit
  IF project_count >= max_projects THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project limit reached for your tier',
      'error_code', 'TOO_MANY_PROJECTS',
      'current_count', project_count,
      'max_allowed', max_projects,
      'user_tier', p_user_tier
    );
  END IF;
  
  -- Insert new project
  INSERT INTO audit_projects (
    user_id,
    base_url,
    crawl_type,
    instructions,
    services,
    status,
    company_name,
    phone_number,
    email,
    address,
    custom_info,
    custom_urls,
    stripe_key_urls,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_base_url,
    p_crawl_type,
    p_instructions,
    p_services,
    'pending',
    p_company_name,
    p_phone_number,
    p_email,
    p_address,
    p_custom_info,
    p_custom_urls,
    p_stripe_key_urls,
    ts_now,
    ts_now
  )
  RETURNING * INTO new_project;
  
  -- Return success with project data
  RETURN jsonb_build_object(
    'success', true,
    'project', row_to_json(new_project)
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project already exists',
      'error_code', 'DUPLICATE_PROJECT'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM,
      'error_code', 'DB_INSERT_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on user_id and base_url lookups
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_url 
ON audit_projects(user_id, base_url);

-- Create index for user_id for faster counting
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_id 
ON audit_projects(user_id);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_audit_project_optimized TO authenticated;
