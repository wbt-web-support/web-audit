-- Restructure audit_results table for single entry per page
-- This migration creates a new optimized structure with separate fields for each audit type

-- First, backup existing data (optional, but recommended)
-- CREATE TABLE audit_results_backup AS SELECT * FROM audit_results;

-- Drop existing table and recreate with new structure
DROP TABLE IF EXISTS audit_results CASCADE;

-- Create new optimized audit_results table
CREATE TABLE audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraped_page_id UUID NOT NULL REFERENCES scraped_pages(id) ON DELETE CASCADE,
  page_name TEXT, -- Page title/name for easy identification
  
  -- Separate fields for each audit type
  grammar_analysis JSONB,
  content_analysis JSONB,
  seo_analysis JSONB,
  performance_analysis JSONB,
  accessibility_analysis JSONB,
  ui_quality_analysis JSONB,
  image_relevance_analysis JSONB,
  context_analysis JSONB,
  
  -- Overall scores and status
  overall_score DECIMAL(5,2),
  overall_status TEXT CHECK (overall_status IN ('pass', 'warning', 'fail')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one entry per page
  UNIQUE(scraped_page_id)
);

-- Enable Row Level Security
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Create policies for the new structure
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

-- Create indexes for performance
CREATE INDEX idx_audit_results_scraped_page_id ON audit_results(scraped_page_id);
CREATE INDEX idx_audit_results_overall_status ON audit_results(overall_status);
CREATE INDEX idx_audit_results_overall_score ON audit_results(overall_score);
CREATE INDEX idx_audit_results_created_at ON audit_results(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audit_results_updated_at 
    BEFORE UPDATE ON audit_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE audit_results IS 'Single entry per page containing all audit analysis results';
COMMENT ON COLUMN audit_results.page_name IS 'Page title for easy identification';
COMMENT ON COLUMN audit_results.grammar_analysis IS 'Cached grammar and content analysis from Gemini AI';
COMMENT ON COLUMN audit_results.content_analysis IS 'Content quality analysis results';
COMMENT ON COLUMN audit_results.seo_analysis IS 'SEO analysis including meta tags, headings, etc.';
COMMENT ON COLUMN audit_results.performance_analysis IS 'Performance metrics and optimization suggestions';
COMMENT ON COLUMN audit_results.accessibility_analysis IS 'Accessibility compliance analysis';
COMMENT ON COLUMN audit_results.ui_quality_analysis IS 'UI/UX quality assessment';
COMMENT ON COLUMN audit_results.image_relevance_analysis IS 'Image relevance and optimization analysis';
COMMENT ON COLUMN audit_results.context_analysis IS 'Contextual content analysis'; 