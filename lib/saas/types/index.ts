/**
 * SaaS Core Types
 * Central type definitions for the multi-tenant SaaS system
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: SubscriptionPlan;
  status: 'active' | 'suspended' | 'cancelled';
  settings: TenantSettings;
  limits: TenantLimits;
  usage: TenantUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  limits: {
    maxProjects: number;
    maxPagesPerProject: number;
    maxConcurrentCrawls: number;
    maxWorkers: number;
    rateLimitPerMinute: number;
    storageGB: number;
  };
  features: string[];
  price: number;
  billingCycle: 'monthly' | 'yearly';
}

export interface TenantSettings {
  timezone: string;
  notifications: {
    email: boolean;
    webhook: boolean;
    webhookUrl?: string;
  };
  crawling: {
    defaultMaxPages: number;
    defaultMaxDepth: number;
    respectRobotsTxt: boolean;
    userAgent: string;
  };
  analysis: {
    enabledTypes: string[];
    autoAnalyze: boolean;
  };
}

export interface TenantLimits {
  maxProjects: number;
  maxPagesPerProject: number;
  maxConcurrentCrawls: number;
  maxWorkers: number;
  rateLimitPerMinute: number;
  storageGB: number;
  monthlyCrawlLimit: number;
}

export interface TenantUsage {
  currentProjects: number;
  currentPages: number;
  currentCrawls: number;
  currentWorkers: number;
  currentStorageGB: number;
  monthlyCrawls: number;
  lastResetDate: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  tenantId: string;
  permissions: UserPermissions;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface UserPermissions {
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canAccessAPI: boolean;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  baseUrl: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
  settings: ProjectSettings;
  metrics: ProjectMetrics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProjectSettings {
  maxPages: number;
  maxDepth: number;
  followExternal: boolean;
  respectRobotsTxt: boolean;
  userAgent: string;
  timeout: number;
  analysisTypes: string[];
  customUrls: string[];
}

export interface ProjectMetrics {
  pagesCrawled: number;
  totalPages: number;
  totalImages: number;
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  averageLoadTime: number;
  lastCrawledAt: Date;
}

export interface CrawlJob {
  id: string;
  tenantId: string;
  projectId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export interface QueueConfig {
  name: string;
  tenantId?: string; // null for global queues
  maxWorkers: number;
  maxQueueSize: number;
  concurrency: number;
  delayBetweenJobs: number;
  retryAttempts: number;
  retryDelay: number;
  isActive: boolean;
  priority: number;
}

export interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  totalProjects: number;
  activeCrawls: number;
  queueStats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  systemLoad: {
    cpu: number;
    memory: number;
    disk: number;
  };
  timestamp: Date;
}

export interface RateLimitInfo {
  tenantId: string;
  endpoint: string;
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
