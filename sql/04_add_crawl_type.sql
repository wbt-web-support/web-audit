-- Add crawl_type column to audit_sessions table
ALTER TABLE audit_sessions 
ADD COLUMN crawl_type TEXT DEFAULT 'full' CHECK (crawl_type IN ('single', 'full'));

-- Add comment to explain the column
COMMENT ON COLUMN audit_sessions.crawl_type IS 'Type of crawling: single (one page) or full (entire website)'; 