-- Create error_logs table for comprehensive error logging
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level VARCHAR(10) NOT NULL CHECK (level IN ('error', 'warning', 'info', 'debug')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID,
  job_id VARCHAR(255),
  queue_name VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_queue_name ON error_logs(queue_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_job_id ON error_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_project_id ON error_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON error_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_queue_timestamp ON error_logs(queue_name, timestamp DESC);

-- Create function to automatically clean up old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days'
    AND level IN ('info', 'debug');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Keep error and warning logs for 90 days
  DELETE FROM error_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days'
    AND level IN ('error', 'warning');
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (if pg_cron is available)
-- SELECT cron.schedule('cleanup-error-logs', '0 2 * * *', 'SELECT cleanup_old_error_logs();');

-- Create view for error statistics
CREATE OR REPLACE VIEW error_log_stats AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  level,
  queue_name,
  COUNT(*) as count,
  COUNT(DISTINCT job_id) as unique_jobs,
  COUNT(DISTINCT project_id) as unique_projects
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), level, queue_name
ORDER BY hour DESC, level, queue_name;

-- Create view for recent errors
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  id,
  level,
  message,
  queue_name,
  job_id,
  project_id,
  timestamp,
  resolved
FROM error_logs
WHERE level = 'error'
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;

-- Create view for queue health
CREATE OR REPLACE VIEW queue_health AS
SELECT 
  queue_name,
  COUNT(*) as total_logs,
  COUNT(CASE WHEN level = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN level = 'warning' THEN 1 END) as warning_count,
  COUNT(CASE WHEN level = 'info' THEN 1 END) as info_count,
  ROUND(
    COUNT(CASE WHEN level = 'error' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as error_percentage,
  MAX(timestamp) as last_activity
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND queue_name IS NOT NULL
GROUP BY queue_name
ORDER BY error_percentage DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON error_logs TO authenticated;
-- GRANT SELECT ON error_log_stats TO authenticated;
-- GRANT SELECT ON recent_errors TO authenticated;
-- GRANT SELECT ON queue_health TO authenticated;
