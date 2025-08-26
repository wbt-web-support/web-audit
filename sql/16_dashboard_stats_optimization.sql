-- Dashboard Stats Optimization
-- This script creates optimized functions and indexes for dashboard performance

-- Create optimized function for dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_id_param UUID)
RETURNS TABLE (
  total_projects BIGINT,
  active_projects BIGINT,
  total_pages_analyzed BIGINT,
  average_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH project_stats AS (
    SELECT 
      COUNT(*) as total_projects,
      COUNT(CASE WHEN status IN ('crawling', 'analyzing') THEN 1 END) as active_projects
    FROM audit_projects 
    WHERE user_id = user_id_param
  ),
  analysis_stats AS (
    SELECT 
      COUNT(*) as total_pages_analyzed,
      AVG(overall_score) as average_score
    FROM audit_results ar
    JOIN scraped_pages sp ON ar.scraped_page_id = sp.id
    JOIN audit_projects ap ON sp.audit_project_id = ap.id
    WHERE ap.user_id = user_id_param
    AND ar.overall_score IS NOT NULL
  )
  SELECT 
    ps.total_projects,
    ps.active_projects,
    COALESCE(analysis_stats.total_pages_analyzed, 0),
    COALESCE(analysis_stats.average_score, 0)
  FROM project_stats ps
  CROSS JOIN analysis_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create additional indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_status_created 
ON audit_projects(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_results_score_status 
ON audit_results(overall_score, overall_status) 
WHERE overall_score IS NOT NULL;

-- Create partial index for active projects
CREATE INDEX IF NOT EXISTS idx_audit_projects_active 
ON audit_projects(user_id, created_at DESC) 
WHERE status IN ('crawling', 'analyzing');

-- Create composite index for recent projects
CREATE INDEX IF NOT EXISTS idx_audit_projects_recent 
ON audit_projects(user_id, created_at DESC, id) 
INCLUDE (base_url, status, pages_crawled, pages_analyzed, company_name);

-- Optimize the materialized view refresh
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  -- Refresh only if needed (check if data has changed recently)
  IF EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE updated_at > (SELECT COALESCE(MAX(last_refresh), '1970-01-01'::timestamp) FROM dashboard_stats_refresh_log)
  ) THEN
    REFRESH MATERIALIZED VIEW project_stats;
    
    -- Update refresh log
    INSERT INTO dashboard_stats_refresh_log (last_refresh) 
    VALUES (NOW())
    ON CONFLICT (id) DO UPDATE SET last_refresh = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create refresh log table
CREATE TABLE IF NOT EXISTS dashboard_stats_refresh_log (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_refresh TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial record
INSERT INTO dashboard_stats_refresh_log (id, last_refresh) 
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;
GRANT SELECT ON dashboard_stats_refresh_log TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_dashboard_stats(UUID) IS 'Optimized function to get dashboard statistics for a user';
COMMENT ON INDEX idx_audit_projects_user_status_created IS 'Index for efficient dashboard stats queries';
COMMENT ON INDEX idx_audit_results_score_status IS 'Index for average score calculations';
