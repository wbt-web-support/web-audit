-- Performance Optimization Script
-- This script adds indexes to improve query performance and prevent timeouts

-- 1. Index for audit_projects table (user_id for faster project lookups)
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_id ON audit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_status ON audit_projects(status);

-- 2. Indexes for scraped_pages table (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_scraped_pages_project_id ON scraped_pages(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_analysis_status ON scraped_pages(analysis_status);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_project_status ON scraped_pages(audit_project_id, analysis_status);

-- 3. Indexes for audit_results table (prevents complex join timeouts)
CREATE INDEX IF NOT EXISTS idx_audit_results_page_id ON audit_results(scraped_page_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_overall_score ON audit_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_audit_results_overall_status ON audit_results(overall_status);
CREATE INDEX IF NOT EXISTS idx_audit_results_created_at ON audit_results(created_at);

-- 4. Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pages_project_status ON scraped_pages(audit_project_id, analysis_status, scraped_at);
CREATE INDEX IF NOT EXISTS idx_results_page_score ON audit_results(scraped_page_id, overall_score, overall_status);

-- 5. Partial indexes for better performance on specific conditions
CREATE INDEX IF NOT EXISTS idx_pages_analyzing ON scraped_pages(audit_project_id) 
WHERE analysis_status = 'analyzing';

CREATE INDEX IF NOT EXISTS idx_pages_completed ON scraped_pages(audit_project_id) 
WHERE analysis_status = 'completed';

CREATE INDEX IF NOT EXISTS idx_results_completed ON audit_results(scraped_page_id) 
WHERE overall_status IN ('pass', 'warning', 'fail');

-- 6. Index for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 7. Add statistics hints for better query planning
ANALYZE audit_projects;
ANALYZE scraped_pages;
ANALYZE audit_results;
ANALYZE user_profiles;

-- 8. Create a materialized view for frequently accessed project statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS project_stats AS
SELECT 
    ap.id as project_id,
    ap.user_id,
    ap.status as project_status,
    COUNT(sp.id) as total_pages,
    COUNT(CASE WHEN sp.analysis_status = 'completed' THEN 1 END) as completed_pages,
    COUNT(CASE WHEN sp.analysis_status = 'analyzing' THEN 1 END) as analyzing_pages,
    COUNT(CASE WHEN sp.analysis_status = 'failed' THEN 1 END) as failed_pages,
    AVG(ar.overall_score) as avg_score,
    MAX(sp.scraped_at) as last_scraped,
    MAX(ar.created_at) as last_analyzed
FROM audit_projects ap
LEFT JOIN scraped_pages sp ON ap.id = sp.audit_project_id
LEFT JOIN audit_results ar ON sp.id = ar.scraped_page_id
GROUP BY ap.id, ap.user_id, ap.status;

-- 9. Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_project_stats_user_id ON project_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_project_stats_status ON project_stats(project_status);

-- 10. Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_project_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW project_stats;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a trigger to automatically refresh stats when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_project_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_project_stats();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic refresh
DROP TRIGGER IF EXISTS trigger_refresh_stats_on_pages ON scraped_pages;
CREATE TRIGGER trigger_refresh_stats_on_pages
    AFTER INSERT OR UPDATE OR DELETE ON scraped_pages
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_project_stats();

DROP TRIGGER IF EXISTS trigger_refresh_stats_on_results ON audit_results;
CREATE TRIGGER trigger_refresh_stats_on_results
    AFTER INSERT OR UPDATE OR DELETE ON audit_results
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_project_stats();

-- 12. Add comments for documentation
COMMENT ON INDEX idx_scraped_pages_project_id IS 'Optimizes queries filtering by project_id';
COMMENT ON INDEX idx_audit_results_page_id IS 'Optimizes join queries between pages and results';
COMMENT ON MATERIALIZED VIEW project_stats IS 'Cached project statistics for faster dashboard loading';

-- 13. Grant necessary permissions
GRANT SELECT ON project_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_project_stats() TO authenticated; 