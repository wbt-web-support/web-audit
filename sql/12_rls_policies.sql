-- =====================================================
-- COMPREHENSIVE ROW LEVEL SECURITY POLICIES
-- Web Audit Application
-- =====================================================

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================

-- Enable RLS on user_profiles (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean recreation)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create comprehensive policies for user_profiles
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- =====================================================
-- AUDIT PROJECTS TABLE
-- =====================================================

-- Enable RLS on audit_projects (if not already enabled)
ALTER TABLE audit_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own audit projects" ON audit_projects;
DROP POLICY IF EXISTS "Users can create own audit projects" ON audit_projects;
DROP POLICY IF EXISTS "Users can update own audit projects" ON audit_projects;
DROP POLICY IF EXISTS "Users can delete own audit projects" ON audit_projects;

-- Create comprehensive policies for audit_projects
CREATE POLICY "Users can view own audit projects" 
ON audit_projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audit projects" 
ON audit_projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audit projects" 
ON audit_projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audit projects" 
ON audit_projects FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- SCRAPED PAGES TABLE
-- =====================================================

-- Enable RLS on scraped_pages (if not already enabled)
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view pages from own audit projects" ON scraped_pages;
DROP POLICY IF EXISTS "Users can create pages for own audit projects" ON scraped_pages;
DROP POLICY IF EXISTS "Users can update pages from own audit projects" ON scraped_pages;
DROP POLICY IF EXISTS "Users can delete pages from own audit projects" ON scraped_pages;

-- Create comprehensive policies for scraped_pages
CREATE POLICY "Users can view pages from own audit projects" 
ON scraped_pages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pages for own audit projects" 
ON scraped_pages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pages from own audit projects" 
ON scraped_pages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pages from own audit projects" 
ON scraped_pages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

-- =====================================================
-- AUDIT RESULTS TABLE
-- =====================================================

-- Enable RLS on audit_results (if not already enabled)
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view results from own audit projects" ON audit_results;
DROP POLICY IF EXISTS "Users can create results for own audit projects" ON audit_results;
DROP POLICY IF EXISTS "Users can update results for own audit projects" ON audit_results;
DROP POLICY IF EXISTS "Users can delete results for own audit projects" ON audit_results;

-- Create comprehensive policies for audit_results
CREATE POLICY "Users can view results from own audit projects" 
ON audit_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM scraped_pages
    JOIN audit_projects ON audit_projects.id = scraped_pages.audit_project_id
    WHERE scraped_pages.id = audit_results.scraped_page_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create results for own audit projects" 
ON audit_results FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scraped_pages
    JOIN audit_projects ON audit_projects.id = scraped_pages.audit_project_id
    WHERE scraped_pages.id = audit_results.scraped_page_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update results for own audit projects" 
ON audit_results FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM scraped_pages
    JOIN audit_projects ON audit_projects.id = scraped_pages.audit_project_id
    WHERE scraped_pages.id = audit_results.scraped_page_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete results for own audit projects" 
ON audit_results FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM scraped_pages
    JOIN audit_projects ON audit_projects.id = scraped_pages.audit_project_id
    WHERE scraped_pages.id = audit_results.scraped_page_id 
    AND audit_projects.user_id = auth.uid()
  )
);

-- =====================================================
-- CONTENT ANALYSIS CACHE TABLE (if exists)
-- =====================================================

-- Check if content_analysis_cache table exists and create policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_analysis_cache') THEN
        -- Enable RLS on content_analysis_cache
        EXECUTE 'ALTER TABLE content_analysis_cache ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies if they exist
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own cached content" ON content_analysis_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Users can create own cached content" ON content_analysis_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own cached content" ON content_analysis_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own cached content" ON content_analysis_cache';
        
        -- Create policies for content_analysis_cache
        EXECUTE 'CREATE POLICY "Users can view own cached content" ON content_analysis_cache FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can create own cached content" ON content_analysis_cache FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update own cached content" ON content_analysis_cache FOR UPDATE USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can delete own cached content" ON content_analysis_cache FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

-- =====================================================
-- ADDITIONAL SECURITY MEASURES
-- =====================================================

-- Create a function to validate user authentication
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user's projects
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS SETOF audit_projects AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM audit_projects 
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Ensure all necessary indexes exist for RLS performance
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_id ON audit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_audit_project_id ON scraped_pages(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_scraped_page_id ON audit_results(scraped_page_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_status ON audit_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_project_status ON scraped_pages(audit_project_id, analysis_status);
CREATE INDEX IF NOT EXISTS idx_audit_results_page_created ON audit_results(scraped_page_id, created_at);

-- =====================================================
-- AUDIT LOGGING (Optional - for security monitoring)
-- =====================================================

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log (only admins can view)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own audit entries
CREATE POLICY "Users can view own audit log entries" 
ON security_audit_log FOR SELECT 
USING (auth.uid() = user_id);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_table_name TEXT,
  p_operation TEXT,
  p_record_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (user_id, table_name, operation, record_id)
  VALUES (auth.uid(), p_table_name, p_operation, p_record_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_profiles IS 'User profile information with RLS ensuring users can only access their own data';
COMMENT ON TABLE audit_projects IS 'Audit projects with RLS ensuring users can only access their own projects';
COMMENT ON TABLE scraped_pages IS 'Scraped pages with RLS ensuring users can only access pages from their own projects';
COMMENT ON TABLE audit_results IS 'Audit analysis results with RLS ensuring users can only access results from their own projects';
COMMENT ON TABLE security_audit_log IS 'Security audit log for monitoring access patterns and potential security issues';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'audit_projects', 'scraped_pages', 'audit_results')
ORDER BY tablename;

-- Query to list all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 