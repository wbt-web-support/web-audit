-- Dashboard Performance Optimization Script
-- Run this script in your Supabase SQL editor to optimize dashboard performance

-- 1. Create optimized function for dashboard stats
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

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_status_created 
ON audit_projects(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_results_score_status 
ON audit_results(overall_score, overall_status) 
WHERE overall_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_projects_active 
ON audit_projects(user_id, created_at DESC) 
WHERE status IN ('crawling', 'analyzing');

CREATE INDEX IF NOT EXISTS idx_audit_projects_recent 
ON audit_projects(user_id, created_at DESC, id) 
INCLUDE (base_url, status, pages_crawled, pages_analyzed, company_name);

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;

-- 4. Analyze tables for better query planning
ANALYZE audit_projects;
ANALYZE audit_results;
ANALYZE scraped_pages;

-- 5. Success message
SELECT 'Dashboard optimization completed successfully!' as status;
