-- Add analysis_status field to scraped_pages table to track individual page analysis status
-- This allows us to know if a specific page is being analyzed, completed, etc.

ALTER TABLE scraped_pages 
ADD COLUMN analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed'));

-- Add index for faster queries on analysis status
CREATE INDEX idx_scraped_pages_analysis_status ON scraped_pages(analysis_status);

-- Add index for session + status combinations (useful for dashboard queries)
CREATE INDEX idx_scraped_pages_session_status ON scraped_pages(audit_session_id, analysis_status);

-- Update existing pages to have 'completed' status if they have analysis results
UPDATE scraped_pages 
SET analysis_status = 'completed' 
WHERE id IN (
    SELECT scraped_page_id 
    FROM audit_results 
    WHERE grammar_analysis IS NOT NULL OR seo_analysis IS NOT NULL
);

-- Add comment explaining the field
COMMENT ON COLUMN scraped_pages.analysis_status IS 'Tracks the analysis status of individual pages: pending (not analyzed), analyzing (currently being analyzed), completed (analysis finished), failed (analysis failed)'; 