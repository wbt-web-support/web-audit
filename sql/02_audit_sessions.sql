-- Create audit projects table
CREATE TABLE IF NOT EXISTS audit_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'analyzing', 'completed', 'failed')),
  crawl_type TEXT DEFAULT 'full' CHECK (crawl_type IN ('single', 'full')),
  total_pages INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  pages_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE audit_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own audit projects" 
ON audit_projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audit projects" 
ON audit_projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audit projects" 
ON audit_projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audit projects" 
ON audit_projects FOR DELETE 
USING (auth.uid() = user_id);

-- Create scraped pages table
CREATE TABLE IF NOT EXISTS scraped_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_project_id UUID NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  html TEXT,
  status_code INTEGER,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(audit_project_id, url)
);

-- Enable Row Level Security
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for scraped_pages
CREATE POLICY "Users can view pages from own audit projects" 
ON scraped_pages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pages for own audit projects" 
ON scraped_pages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pages from own audit projects" 
ON scraped_pages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pages from own audit projects" 
ON scraped_pages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM audit_projects 
    WHERE audit_projects.id = scraped_pages.audit_project_id 
    AND audit_projects.user_id = auth.uid()
  )
);

-- Create audit results table
CREATE TABLE IF NOT EXISTS audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraped_page_id UUID NOT NULL REFERENCES scraped_pages(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('grammar', 'context', 'seo', 'performance', 'accessibility', 'ui_quality', 'image_relevance')),
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
  score DECIMAL(5,2),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_results
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

CREATE POLICY "Users can delete results for own audit projects" 
ON audit_results FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM scraped_pages
    JOIN audit_projects ON audit_projects.id = scraped_pages.audit_project_id
    WHERE scraped_pages.id = audit_results.scraped_page_id 
    AND audit_projects.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_audit_projects_user_id ON audit_projects(user_id);
CREATE INDEX idx_audit_projects_status ON audit_projects(status);
CREATE INDEX idx_scraped_pages_audit_project_id ON scraped_pages(audit_project_id);
CREATE INDEX idx_audit_results_scraped_page_id ON audit_results(scraped_page_id);

-- Create updated_at trigger for audit_projects
CREATE TRIGGER update_audit_projects_updated_at BEFORE UPDATE ON audit_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 