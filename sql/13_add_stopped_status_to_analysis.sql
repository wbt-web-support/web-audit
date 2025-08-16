-- Add 'stopped' status to analysis_status check constraint
-- This allows users to manually stop page analysis

-- Drop the existing check constraint
ALTER TABLE scraped_pages 
DROP CONSTRAINT IF EXISTS scraped_pages_analysis_status_check;

-- Add the new check constraint that includes 'stopped'
ALTER TABLE scraped_pages 
ADD CONSTRAINT scraped_pages_analysis_status_check 
CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed', 'stopped'));

-- Update the comment to reflect the new status
COMMENT ON COLUMN scraped_pages.analysis_status IS 'Tracks the analysis status of individual pages: pending (not analyzed), analyzing (currently being analyzed), completed (analysis finished), failed (analysis failed), stopped (analysis was manually stopped by user)';
