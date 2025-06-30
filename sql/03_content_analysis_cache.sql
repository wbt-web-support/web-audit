-- Content Analysis Caching Optimization
-- Add indexes for better performance when querying cached content analysis results

-- Create index for faster lookups of content analysis results by page and type
CREATE INDEX IF NOT EXISTS idx_audit_results_page_type ON audit_results(scraped_page_id, audit_type);

-- Create index for faster ordering by creation date when fetching latest results
CREATE INDEX IF NOT EXISTS idx_audit_results_created_at ON audit_results(created_at DESC);

-- Create composite index for the most common query pattern (page + type + date)
CREATE INDEX IF NOT EXISTS idx_audit_results_page_type_date ON audit_results(scraped_page_id, audit_type, created_at DESC);

-- Add comment explaining the caching strategy
COMMENT ON TABLE audit_results IS 'Stores audit analysis results including cached AI content analysis. Use audit_type="content" for cached Gemini API responses.'; 