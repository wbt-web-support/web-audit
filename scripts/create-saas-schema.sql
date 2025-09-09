-- SaaS Multi-Tenant Database Schema
-- This script creates all necessary tables for the SaaS web audit system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')),
  limits JSONB NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TENANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  settings JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  usage JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{}',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'completed', 'failed', 'paused')),
  settings JSONB NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id)
);

-- ============================================================================
-- SCRAPED PAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scraped_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  html TEXT,
  status_code INTEGER,
  links TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  meta JSONB DEFAULT '{}',
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYSIS RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.scraped_pages(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}',
  overall_score INTEGER,
  overall_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUEUE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.redis_queue_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  max_workers INTEGER NOT NULL DEFAULT 1,
  max_queue_size INTEGER NOT NULL DEFAULT 1000,
  concurrency INTEGER NOT NULL DEFAULT 1,
  delay_between_jobs INTEGER NOT NULL DEFAULT 0,
  retry_attempts INTEGER NOT NULL DEFAULT 3,
  retry_delay INTEGER NOT NULL DEFAULT 5000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(queue_name, tenant_id)
);

-- ============================================================================
-- ERROR LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  queue_name TEXT,
  job_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RATE LIMITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  limit_count INTEGER NOT NULL,
  window_ms INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, endpoint)
);

-- ============================================================================
-- SYSTEM METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_id ON public.tenants (plan_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects (tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects (created_by);

-- Scraped Pages
CREATE INDEX IF NOT EXISTS idx_scraped_pages_project_id ON public.scraped_pages (project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_analysis_status ON public.scraped_pages (analysis_status);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON public.scraped_pages (url);

-- Analysis Results
CREATE INDEX IF NOT EXISTS idx_analysis_results_page_id ON public.analysis_results (page_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON public.analysis_results (analysis_type);

-- Queue Management
CREATE INDEX IF NOT EXISTS idx_queue_management_tenant_id ON public.redis_queue_management (tenant_id);
CREATE INDEX IF NOT EXISTS idx_queue_management_queue_name ON public.redis_queue_management (queue_name);

-- Error Logs
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON public.error_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs (level);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant_id ON public.rate_limits (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits (endpoint);

-- System Metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_tenant_id ON public.system_metrics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON public.system_metrics (metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON public.system_metrics (timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redis_queue_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Tenants policies
CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant owners can update their tenant" ON public.tenants
  FOR UPDATE USING (id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'owner'
  ));

-- Users policies
CREATE POLICY "Users can view users in their tenant" ON public.users
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant admins can manage users" ON public.users
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Projects policies
CREATE POLICY "Users can view projects in their tenant" ON public.projects
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create projects in their tenant" ON public.projects
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Project creators and admins can update projects" ON public.projects
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Scraped Pages policies
CREATE POLICY "Users can view pages in their tenant's projects" ON public.scraped_pages
  FOR SELECT USING (project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.users u ON p.tenant_id = u.tenant_id
    WHERE u.id = auth.uid()
  ));

-- Analysis Results policies
CREATE POLICY "Users can view analysis results for their tenant's pages" ON public.analysis_results
  FOR SELECT USING (page_id IN (
    SELECT sp.id FROM public.scraped_pages sp
    JOIN public.projects p ON sp.project_id = p.id
    JOIN public.users u ON p.tenant_id = u.tenant_id
    WHERE u.id = auth.uid()
  ));

-- Queue Management policies
CREATE POLICY "Users can view queue config for their tenant" ON public.redis_queue_management
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    ) OR tenant_id IS NULL
  );

CREATE POLICY "Tenant admins can manage queue config" ON public.redis_queue_management
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Error Logs policies
CREATE POLICY "Users can view error logs for their tenant" ON public.error_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    ) OR tenant_id IS NULL
  );

-- Audit Logs policies
CREATE POLICY "Users can view audit logs for their tenant" ON public.audit_logs
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

-- Rate Limits policies
CREATE POLICY "Users can view rate limits for their tenant" ON public.rate_limits
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  ));

-- System Metrics policies
CREATE POLICY "Users can view metrics for their tenant" ON public.system_metrics
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    ) OR tenant_id IS NULL
  );

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, limits, features, price, billing_cycle) VALUES
(
  'Free',
  'free',
  '{
    "maxProjects": 3,
    "maxPagesPerProject": 50,
    "maxConcurrentCrawls": 1,
    "maxWorkers": 2,
    "rateLimitPerMinute": 60,
    "storageGB": 1
  }',
  ARRAY[
    'Basic web crawling',
    'Standard analysis',
    'Email support',
    'Community forum access'
  ],
  0,
  'monthly'
),
(
  'Starter',
  'starter',
  '{
    "maxProjects": 10,
    "maxPagesPerProject": 200,
    "maxConcurrentCrawls": 3,
    "maxWorkers": 5,
    "rateLimitPerMinute": 300,
    "storageGB": 10
  }',
  ARRAY[
    'Everything in Free',
    'Advanced analysis',
    'Priority support',
    'Custom user agents',
    'API access'
  ],
  29.99,
  'monthly'
),
(
  'Professional',
  'professional',
  '{
    "maxProjects": 50,
    "maxPagesPerProject": 1000,
    "maxConcurrentCrawls": 10,
    "maxWorkers": 20,
    "rateLimitPerMinute": 1000,
    "storageGB": 100
  }',
  ARRAY[
    'Everything in Starter',
    'Unlimited projects',
    'Custom integrations',
    'Advanced reporting',
    'White-label options'
  ],
  99.99,
  'monthly'
),
(
  'Enterprise',
  'enterprise',
  '{
    "maxProjects": -1,
    "maxPagesPerProject": -1,
    "maxConcurrentCrawls": -1,
    "maxWorkers": -1,
    "rateLimitPerMinute": -1,
    "storageGB": -1
  }',
  ARRAY[
    'Everything in Professional',
    'Dedicated support',
    'Custom limits',
    'SLA guarantee',
    'On-premise deployment'
  ],
  499.99,
  'monthly'
)
ON CONFLICT DO NOTHING;

-- Insert default queue configurations
INSERT INTO public.redis_queue_management (queue_name, max_workers, max_queue_size, concurrency, delay_between_jobs, retry_attempts, retry_delay, is_active, description) VALUES
('web-scraping', 5, 1000, 3, 1000, 3, 5000, TRUE, 'Queue for web scraping operations'),
('image-extraction', 3, 500, 2, 2000, 2, 3000, TRUE, 'Queue for image extraction and analysis'),
('content-analysis', 2, 300, 1, 3000, 3, 5000, TRUE, 'Queue for content analysis operations'),
('seo-analysis', 2, 200, 1, 2000, 2, 4000, TRUE, 'Queue for SEO analysis operations'),
('performance-analysis', 1, 100, 1, 5000, 2, 6000, TRUE, 'Queue for performance analysis operations')
ON CONFLICT (queue_name, tenant_id) DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scraped_pages_updated_at BEFORE UPDATE ON public.scraped_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analysis_results_updated_at BEFORE UPDATE ON public.analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_management_updated_at BEFORE UPDATE ON public.redis_queue_management FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize tenant usage
CREATE OR REPLACE FUNCTION initialize_tenant_usage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.usage = '{
        "currentProjects": 0,
        "currentPages": 0,
        "currentCrawls": 0,
        "currentWorkers": 0,
        "currentStorageGB": 0,
        "monthlyCrawls": 0,
        "lastResetDate": "' || NOW()::text || '"
    }'::jsonb;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to initialize tenant usage
CREATE TRIGGER initialize_tenant_usage_trigger 
    BEFORE INSERT ON public.tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION initialize_tenant_usage();

-- Function to initialize user permissions
CREATE OR REPLACE FUNCTION initialize_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.role
        WHEN 'owner' THEN
            NEW.permissions = '{
                "canCreateProjects": true,
                "canDeleteProjects": true,
                "canManageUsers": true,
                "canViewAnalytics": true,
                "canManageSettings": true,
                "canAccessAPI": true
            }'::jsonb;
        WHEN 'admin' THEN
            NEW.permissions = '{
                "canCreateProjects": true,
                "canDeleteProjects": true,
                "canManageUsers": true,
                "canViewAnalytics": true,
                "canManageSettings": false,
                "canAccessAPI": true
            }'::jsonb;
        WHEN 'member' THEN
            NEW.permissions = '{
                "canCreateProjects": true,
                "canDeleteProjects": false,
                "canManageUsers": false,
                "canViewAnalytics": true,
                "canManageSettings": false,
                "canAccessAPI": true
            }'::jsonb;
        WHEN 'viewer' THEN
            NEW.permissions = '{
                "canCreateProjects": false,
                "canDeleteProjects": false,
                "canManageUsers": false,
                "canViewAnalytics": true,
                "canManageSettings": false,
                "canAccessAPI": false
            }'::jsonb;
    END CASE;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to initialize user permissions
CREATE TRIGGER initialize_user_permissions_trigger 
    BEFORE INSERT ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION initialize_user_permissions();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for tenant dashboard data
CREATE OR REPLACE VIEW public.tenant_dashboard AS
SELECT 
    t.id,
    t.name,
    t.slug,
    t.status,
    sp.name as plan_name,
    sp.tier as plan_tier,
    sp.limits as plan_limits,
    t.usage,
    t.settings,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT sp.id) as page_count,
    t.created_at,
    t.updated_at
FROM public.tenants t
LEFT JOIN public.subscription_plans sp ON t.plan_id = sp.id
LEFT JOIN public.users u ON t.id = u.tenant_id
LEFT JOIN public.projects p ON t.id = p.tenant_id
LEFT JOIN public.scraped_pages sp ON p.id = sp.project_id
GROUP BY t.id, t.name, t.slug, t.status, sp.name, sp.tier, sp.limits, t.usage, t.settings, t.created_at, t.updated_at;

-- View for system metrics
CREATE OR REPLACE VIEW public.system_overview AS
SELECT 
    COUNT(DISTINCT t.id) as total_tenants,
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT sp.id) as total_pages,
    COUNT(DISTINCT CASE WHEN p.status = 'crawling' THEN p.id END) as active_crawls,
    AVG(CASE WHEN t.usage->>'currentProjects' IS NOT NULL THEN (t.usage->>'currentProjects')::int END) as avg_projects_per_tenant,
    AVG(CASE WHEN t.usage->>'currentPages' IS NOT NULL THEN (t.usage->>'currentPages')::int END) as avg_pages_per_tenant
FROM public.tenants t
LEFT JOIN public.users u ON t.id = u.tenant_id
LEFT JOIN public.projects p ON t.id = p.tenant_id
LEFT JOIN public.scraped_pages sp ON p.id = sp.project_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans with their limits and features';
COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations using the SaaS platform';
COMMENT ON TABLE public.users IS 'Users belonging to tenants with role-based permissions';
COMMENT ON TABLE public.projects IS 'Web audit projects created by users within tenants';
COMMENT ON TABLE public.scraped_pages IS 'Individual pages scraped from websites during crawling';
COMMENT ON TABLE public.analysis_results IS 'Analysis results for scraped pages (SEO, performance, etc.)';
COMMENT ON TABLE public.redis_queue_management IS 'Queue configuration for BullMQ job processing';
COMMENT ON TABLE public.error_logs IS 'System error logs with tenant context';
COMMENT ON TABLE public.audit_logs IS 'User action audit trail for compliance';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting configuration per tenant and endpoint';
COMMENT ON TABLE public.system_metrics IS 'System performance and usage metrics';

COMMENT ON VIEW public.tenant_dashboard IS 'Aggregated data for tenant dashboard display';
COMMENT ON VIEW public.system_overview IS 'High-level system statistics for admin dashboard';
