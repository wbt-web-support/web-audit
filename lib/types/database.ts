export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditSessionStatus = 'pending' | 'crawling' | 'analyzing' | 'completed' | 'failed';

export type AuditSession = {
  id: string;
  user_id: string;
  base_url: string;
  status: AuditSessionStatus;
  total_pages: number;
  pages_crawled: number;
  pages_analyzed: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  company_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  custom_info: string | null;
  instructions?: string[] | null;
  crawl_type?: string | null;
  services?: string[] | null;
};

export interface ScrapedPage {
  id: string;
  audit_session_id: string;
  url: string;
  title: string | null;
  html: string | null;
  content: string | null;
  status_code: number | null;
  scraped_at: string;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  error_message: string | null;
}

export type AuditStatus = 'pass' | 'warning' | 'fail';

// New single-entry audit result structure
export type AuditResult = {
  id: string;
  scraped_page_id: string;
  page_name: string | null;
  
  // Separate fields for each analysis type
  grammar_analysis: Record<string, any> | null;
  content_analysis: Record<string, any> | null;
  seo_analysis: Record<string, any> | null;
  performance_analysis: Record<string, any> | null;
  accessibility_analysis: Record<string, any> | null;
  ui_quality_analysis: Record<string, any> | null;
  image_relevance_analysis: Record<string, any> | null;
  context_analysis: Record<string, any> | null;
  
  // Overall scores and status
  overall_score: number | null;
  overall_status: AuditStatus | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
};

// Legacy types for backward compatibility (deprecated)
export type AuditType = 'grammar' | 'context' | 'seo' | 'performance' | 'accessibility' | 'ui_quality' | 'image_relevance';

export type LegacyAuditResult = {
  id: string;
  scraped_page_id: string;
  audit_type: AuditType;
  status: AuditStatus;
  score: number | null;
  details: Record<string, any> | null;
  created_at: string;
}; 