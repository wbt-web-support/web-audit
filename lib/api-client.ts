import { createClient } from '@/lib/supabase/client';
import { BACKEND_CONFIG } from '@/lib/config/backend';

class ApiClient {
  private baseURL: string;

  constructor() {
    // Use backend configuration
    this.baseURL = BACKEND_CONFIG.BASE_URL;
  }

  /**
   * Get JWT token from Supabase session
   */
  async getAuthToken(): Promise<string> {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Auth session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        error: error?.message,
        userEmail: session?.user?.email 
      });
      
      if (!session?.access_token) {
        throw new Error('No authentication token found. Please sign in.');
      }

      console.log('Token retrieved successfully, length:', session.access_token.length);
      return session.access_token;
    } catch (error) {
      console.error('Token retrieval failed:', error);
      throw new Error('Authentication required: ' + (error as Error).message);
    }
  }

  /**
   * Make authenticated API request to Fastify backend
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;

      console.log('Making API request to:', url);
      console.log('Backend URL configured as:', this.baseURL);

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      };

      console.log('=== REQUEST CONFIG ===');
      console.log('URL:', url);
      console.log('Method:', config.method || 'GET');
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('Has Auth Header:', !!(config.headers as any)['Authorization']);
      console.log('Body:', config.body);
      console.log('=====================');

      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage;
        let errorData;
        try {
          const responseText = await response.text();
          console.log('Raw error response text:', responseText);
          
          if (responseText) {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            errorData = null;
          }
          
          console.error('=== API ERROR DETAILS ===');
          console.error('Status:', response.status);
          console.error('Status Text:', response.statusText);
          console.error('URL:', url);
          console.error('Method:', config.method || 'GET');
          console.error('Error Data:', errorData);
          console.error('Raw Response:', responseText);
          console.error('========================');
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error('=== API ERROR (Parse Failed) ===');
          console.error('Status:', response.status);
          console.error('Status Text:', response.statusText);
          console.error('URL:', url);
          console.error('Method:', config.method || 'GET');
          console.error('Parse Error:', parseError);
          console.error('===============================');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', { 
        endpoint, 
        baseURL: this.baseURL,
        fullUrl: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET'
      });
      throw error;
    }
  }

  // ==================== PROJECT API METHODS ====================

  /**
   * Validate project data against backend schema
   */
  private validateProjectData(projectData: any): void {
    if (!projectData.base_url || typeof projectData.base_url !== 'string') {
      throw new Error('base_url is required and must be a string');
    }
    
    // Validate URL format
    try {
      new URL(projectData.base_url);
    } catch {
      throw new Error('Invalid URL format for base_url');
    }
    
    // Validate crawl_type if provided
    if (projectData.crawl_type && !['full', 'quick', 'custom'].includes(projectData.crawl_type)) {
      throw new Error('crawl_type must be one of: full, quick, custom');
    }
    
    // Validate email if provided in companyDetails
    if (projectData.companyDetails?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(projectData.companyDetails.email)) {
        throw new Error('Invalid email format in companyDetails');
      }
    }
    
    // Validate URLs in arrays if provided
    if (projectData.custom_urls && projectData.custom_urls.length > 0) {
      for (const url of projectData.custom_urls) {
        if (url && url.trim()) {
          try {
            new URL(url);
          } catch {
            throw new Error(`Invalid URL format in custom_urls: ${url}`);
          }
        }
      }
    }
    
    if (projectData.stripe_key_urls && projectData.stripe_key_urls.length > 0) {
      for (const url of projectData.stripe_key_urls) {
        if (url && url.trim()) {
          try {
            new URL(url);
          } catch {
            throw new Error(`Invalid URL format in stripe_key_urls: ${url}`);
          }
        }
      }
    }
  }

  /**
   * Create a new audit project
   */
  async createProject(projectData: {
    base_url: string;
    crawl_type?: string;
    services?: string[];
    companyDetails?: {
      companyName?: string;
      phoneNumber?: string;
      email?: string;
      address?: string;
      customInfo?: string;
    };
    instructions?: string[];
    custom_urls?: string[];
    stripe_key_urls?: string[];
  }) {
    try {
      // Debug logging as suggested in analysis
      console.log('=== PROJECT CREATION DEBUG ===');
      console.log('Original project data:', JSON.stringify(projectData, null, 2));
      
      // Validate project data against backend schema
      this.validateProjectData(projectData);
      console.log('✅ Project data validation passed');
      
      // Check authentication token
      const token = await this.getAuthToken();
      console.log('Auth token available:', !!token);
      console.log('Auth token length:', token.length);
      
      // Clean and transform the data to match backend expectations
      const transformedData = {
        base_url: projectData.base_url,
        crawl_type: projectData.crawl_type, // Backend expects snake_case
        services: Array.isArray(projectData.services) 
          ? projectData.services.filter(item => item && item.trim()) 
          : [],
        companyDetails: {
          companyName: projectData.companyDetails?.companyName?.trim() || undefined,
          phoneNumber: projectData.companyDetails?.phoneNumber?.trim() || undefined,
          email: projectData.companyDetails?.email?.trim() || undefined,
          address: projectData.companyDetails?.address?.trim() || undefined,
          customInfo: projectData.companyDetails?.customInfo?.trim() || undefined
        },
        instructions: Array.isArray(projectData.instructions) 
          ? projectData.instructions.filter(item => item && item.trim()) 
          : [],
        custom_urls: Array.isArray(projectData.custom_urls) 
          ? projectData.custom_urls.filter(item => item && item.trim()) 
          : [],
        stripe_key_urls: Array.isArray(projectData.stripe_key_urls) 
          ? projectData.stripe_key_urls.filter(item => item && item.trim()) 
          : []
      };
      
      console.log('Transformed data for backend:', JSON.stringify(transformedData, null, 2));
      console.log('=== END DEBUG ===');
      
      return this.request('/api/projects', {
        method: 'POST',
        body: JSON.stringify(transformedData)
      });
    } catch (error) {
      console.error('Project creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all projects for the authenticated user
   */
  async getProjects(options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status) params.append('status', options.status);

    const queryString = params.toString();
    return this.request(`/api/projects${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string) {
    return this.request(`/api/projects/${projectId}`);
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, updateData: any) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // ==================== AUTH API METHODS ====================

  /**
   * Get current user information
   */
  async getUserInfo() {
    return this.request('/api/auth/me');
  }


  // ==================== AUDIT API METHODS ====================

  /**
   * Start an audit for a project
   */
  async startAudit(projectId: string) {
    return this.request(`/api/projects/${projectId}/audit`, {
      method: 'POST'
    });
  }

  /**
   * Get audit results for a project
   */
  async getAuditResults(projectId: string) {
    return this.request(`/api/projects/${projectId}/results`);
  }

  /**
   * Get audit status for a project
   */
  async getAuditStatus(projectId: string) {
    return this.request(`/api/projects/${projectId}/status`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if the API client is properly configured
   */
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: (error as Error).message };
    }
  }

  /**
   * Test backend connection without authentication
   */
  async testConnection() {
    try {
      console.log('Testing connection to:', `${this.baseURL}/health`);
      const response = await fetch(`${this.baseURL}/health`);
      const responseText = await response.text();
      
      console.log('Health check response status:', response.status);
      console.log('Health check response text:', responseText);
      
      return {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok ? 'Backend is accessible' : `Backend returned ${response.status}`,
        responseText
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        message: `Cannot connect to backend at ${this.baseURL}: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get user tier information
   */
  async getUserTier(): Promise<{ tier: string; subscription_status?: string }> {
    return this.request('/api/auth/tier');
  }

  /**
   * Get user profile with tier information
   */
  async getUserProfile(): Promise<{ 
    id: string; 
    email: string; 
    name?: string; 
    tier: string; 
    subscription_status: string;
    created_at?: string;
    updated_at?: string;
  }> {
    return this.request('/api/auth/me');
  }

  /**
   * Get user project limits and usage
   */
  async getUserLimits(): Promise<{
    tier: string;
    maxProjects: number;
    currentProjects: number;
    remainingProjects: number;
    usagePercentage: number;
  }> {
    return this.request('/api/auth/limits');
  }

  /**
   * Get rate limit information
   */
  async getRateLimitInfo(): Promise<{
    rateLimitInfo: {
      remaining: number;
      resetTime: number;
      burstRemaining: number;
      burstResetTime: number;
    };
  }> {
    return this.request('/api/auth/rate-limit');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for better TypeScript support
export interface ProjectData {
  base_url: string;
  crawl_type?: string;
  services?: string[];
  companyDetails?: {
    companyName?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    customInfo?: string;
  };
  instructions?: string[];
  custom_urls?: string[];
  stripe_key_urls?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface ProjectResponse {
  project: any;
  message: string;
  code: string;
  userTier: string;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
    burstRemaining: number;
    burstResetTime: number;
  };
}

export interface ProjectsListResponse {
  projects: any[];
  count: number;
  userTier: string;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
    burstRemaining: number;
    burstResetTime: number;
  };
}
