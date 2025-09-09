-- Create redis_queue_management table for queue configuration
CREATE TABLE IF NOT EXISTS redis_queue_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_name VARCHAR(100) NOT NULL UNIQUE,
  max_workers INTEGER NOT NULL DEFAULT 5,
  max_queue_size INTEGER NOT NULL DEFAULT 1000,
  concurrency INTEGER NOT NULL DEFAULT 3,
  delay_between_jobs INTEGER NOT NULL DEFAULT 1000, -- milliseconds
  retry_attempts INTEGER NOT NULL DEFAULT 3,
  retry_delay INTEGER NOT NULL DEFAULT 5000, -- milliseconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default queue configurations
INSERT INTO redis_queue_management (queue_name, max_workers, max_queue_size, concurrency, delay_between_jobs, retry_attempts, retry_delay, description) VALUES
('web-scraping', 5, 1000, 3, 1000, 3, 5000, 'Queue for web scraping operations'),
('image-extraction', 3, 500, 2, 2000, 2, 3000, 'Queue for image extraction and analysis'),
('content-analysis', 2, 300, 1, 3000, 3, 5000, 'Queue for content analysis operations'),
('seo-analysis', 2, 200, 1, 2000, 2, 4000, 'Queue for SEO analysis operations'),
('performance-analysis', 1, 100, 1, 5000, 2, 6000, 'Queue for performance analysis operations')
ON CONFLICT (queue_name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_redis_queue_management_queue_name ON redis_queue_management(queue_name);
CREATE INDEX IF NOT EXISTS idx_redis_queue_management_is_active ON redis_queue_management(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_redis_queue_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_redis_queue_management_updated_at ON redis_queue_management;
CREATE TRIGGER trigger_update_redis_queue_management_updated_at
  BEFORE UPDATE ON redis_queue_management
  FOR EACH ROW
  EXECUTE FUNCTION update_redis_queue_management_updated_at();
