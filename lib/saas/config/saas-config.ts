/**
 * SaaS Configuration
 * Central configuration management for the multi-tenant SaaS system
 */

export interface SaaSConfig {
  // System Configuration
  system: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };

  // Database Configuration
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
  };

  // Redis Configuration
  redis: {
    url: string;
    maxRetries: number;
    retryDelay: number;
    connectionTimeout: number;
    commandTimeout: number;
  };

  // Queue Configuration
  queue: {
    defaultConcurrency: number;
    defaultMaxWorkers: number;
    defaultQueueSize: number;
    defaultRetryAttempts: number;
    defaultRetryDelay: number;
    cleanupInterval: number;
  };

  // Rate Limiting Configuration
  rateLimit: {
    defaultWindowMs: number;
    defaultMaxRequests: number;
    cleanupInterval: number;
    memoryLimit: number;
  };

  // Tenant Configuration
  tenant: {
    maxTenants: number;
    defaultPlan: string;
    cacheTimeout: number;
    usageResetDay: number; // Day of month to reset usage
  };

  // Security Configuration
  security: {
    jwtSecret: string;
    jwtExpiry: string;
    bcryptRounds: number;
    corsOrigins: string[];
    allowedHosts: string[];
  };

  // Monitoring Configuration
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
    alertThresholds: {
      cpu: number;
      memory: number;
      disk: number;
      errorRate: number;
    };
  };

  // File Storage Configuration
  storage: {
    provider: 'local' | 's3' | 'gcs';
    localPath: string;
    s3Bucket?: string;
    s3Region?: string;
    maxFileSize: number;
    allowedTypes: string[];
  };

  // Email Configuration
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    from: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    sendgridApiKey?: string;
    sesRegion?: string;
  };

  // Webhook Configuration
  webhook: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    signatureSecret: string;
  };

  // Feature Flags
  features: {
    multiTenancy: boolean;
    queueSystem: boolean;
    rateLimiting: boolean;
    monitoring: boolean;
    webhooks: boolean;
    analytics: boolean;
    apiVersioning: boolean;
  };
}

// Default configuration
const defaultConfig: SaaSConfig = {
  system: {
    name: 'Web Audit SaaS',
    version: '1.0.0',
    environment: process.env.NODE_ENV as any || 'development',
    debug: process.env.NODE_ENV === 'development',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },

  database: {
    url: process.env.DATABASE_URL || '',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
    connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000'),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
  },

  queue: {
    defaultConcurrency: parseInt(process.env.QUEUE_DEFAULT_CONCURRENCY || '5'),
    defaultMaxWorkers: parseInt(process.env.QUEUE_DEFAULT_MAX_WORKERS || '10'),
    defaultQueueSize: parseInt(process.env.QUEUE_DEFAULT_SIZE || '1000'),
    defaultRetryAttempts: parseInt(process.env.QUEUE_DEFAULT_RETRY_ATTEMPTS || '3'),
    defaultRetryDelay: parseInt(process.env.QUEUE_DEFAULT_RETRY_DELAY || '5000'),
    cleanupInterval: parseInt(process.env.QUEUE_CLEANUP_INTERVAL || '300000'), // 5 minutes
  },

  rateLimit: {
    defaultWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    defaultMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    cleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL || '300000'), // 5 minutes
    memoryLimit: parseInt(process.env.RATE_LIMIT_MEMORY_LIMIT || '1000000'), // 1MB
  },

  tenant: {
    maxTenants: parseInt(process.env.MAX_TENANTS || '1000'),
    defaultPlan: process.env.DEFAULT_PLAN || 'free',
    cacheTimeout: parseInt(process.env.TENANT_CACHE_TIMEOUT || '300000'), // 5 minutes
    usageResetDay: parseInt(process.env.USAGE_RESET_DAY || '1'), // 1st of month
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowedHosts: process.env.ALLOWED_HOSTS?.split(',') || ['localhost'],
  },

  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000'), // 1 minute
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    alertThresholds: {
      cpu: parseFloat(process.env.ALERT_CPU_THRESHOLD || '80'),
      memory: parseFloat(process.env.ALERT_MEMORY_THRESHOLD || '85'),
      disk: parseFloat(process.env.ALERT_DISK_THRESHOLD || '90'),
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '5'),
    },
  },

  storage: {
    provider: (process.env.STORAGE_PROVIDER as any) || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],
  },

  email: {
    provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
    from: process.env.EMAIL_FROM || 'noreply@web-audit.com',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sesRegion: process.env.SES_REGION,
  },

  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000'),
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'),
    signatureSecret: process.env.WEBHOOK_SIGNATURE_SECRET || 'webhook-secret',
  },

  features: {
    multiTenancy: process.env.FEATURE_MULTI_TENANCY !== 'false',
    queueSystem: process.env.FEATURE_QUEUE_SYSTEM !== 'false',
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
    monitoring: process.env.FEATURE_MONITORING !== 'false',
    webhooks: process.env.FEATURE_WEBHOOKS !== 'false',
    analytics: process.env.FEATURE_ANALYTICS !== 'false',
    apiVersioning: process.env.FEATURE_API_VERSIONING !== 'false',
  },
};

// Configuration validation
function validateConfig(config: SaaSConfig): void {
  const errors: string[] = [];

  // Required environment variables
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.redis.url) {
    errors.push('REDIS_URL is required');
  }

  if (!config.security.jwtSecret || config.security.jwtSecret === 'your-secret-key') {
    errors.push('JWT_SECRET must be set to a secure value');
  }

  // Validate numeric values
  if (config.database.maxConnections < 1) {
    errors.push('DB_MAX_CONNECTIONS must be at least 1');
  }

  if (config.queue.defaultConcurrency < 1) {
    errors.push('QUEUE_DEFAULT_CONCURRENCY must be at least 1');
  }

  if (config.tenant.maxTenants < 1) {
    errors.push('MAX_TENANTS must be at least 1');
  }

  // Validate email configuration
  if (config.email.provider === 'smtp' && !config.email.smtpHost) {
    errors.push('SMTP_HOST is required when using SMTP email provider');
  }

  if (config.email.provider === 'sendgrid' && !config.email.sendgridApiKey) {
    errors.push('SENDGRID_API_KEY is required when using SendGrid email provider');
  }

  // Validate storage configuration
  if (config.storage.provider === 's3' && (!config.storage.s3Bucket || !config.storage.s3Region)) {
    errors.push('S3_BUCKET and S3_REGION are required when using S3 storage provider');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Get configuration with validation
export function getSaaSConfig(): SaaSConfig {
  try {
    validateConfig(defaultConfig);
    return defaultConfig;
  } catch (error) {
    console.error('Configuration error:', error);
    throw error;
  }
}

// Environment-specific configurations
export const environmentConfigs = {
  development: {
    system: {
      name: 'WebAudit SaaS',
      version: '1.0.0',
      environment: 'development' as const,
      debug: true,
      logLevel: 'debug' as const,
    },
    monitoring: {
      enabled: false,
      metricsInterval: 60000,
      healthCheckInterval: 30000,
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        errorRate: 5,
      },
    },
    features: {
      multiTenancy: true,
      queueSystem: true,
      rateLimiting: false, // Disable in development
      monitoring: false,
      webhooks: false,
      analytics: false,
      apiVersioning: false,
    },
  },

  staging: {
    system: {
      name: 'WebAudit SaaS',
      version: '1.0.0',
      environment: 'staging' as const,
      debug: false,
      logLevel: 'info' as const,
    },
    monitoring: {
      enabled: true,
      metricsInterval: 60000,
      healthCheckInterval: 30000,
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        errorRate: 5,
      },
    },
    features: {
      multiTenancy: true,
      queueSystem: true,
      rateLimiting: true,
      monitoring: true,
      webhooks: true,
      analytics: true,
      apiVersioning: true,
    },
  },

  production: {
    system: {
      name: 'WebAudit SaaS',
      version: '1.0.0',
      environment: 'production' as const,
      debug: false,
      logLevel: 'warn' as const,
    },
    monitoring: {
      enabled: true,
      metricsInterval: 60000,
      healthCheckInterval: 30000,
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        errorRate: 5,
      },
    },
    features: {
      multiTenancy: true,
      queueSystem: true,
      rateLimiting: true,
      monitoring: true,
      webhooks: true,
      analytics: true,
      apiVersioning: true,
    },
  },
};

// Merge environment-specific config
export function getEnvironmentConfig(): Partial<SaaSConfig> {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfigs[env as keyof typeof environmentConfigs] || environmentConfigs.development;
}

// Final configuration with environment overrides
export const saasConfig = (() => {
  const baseConfig = getSaaSConfig();
  const envConfig = getEnvironmentConfig();
  
  return {
    ...baseConfig,
    ...envConfig,
    system: {
      ...baseConfig.system,
      ...envConfig.system,
    },
    monitoring: {
      ...baseConfig.monitoring,
      ...envConfig.monitoring,
    },
    features: {
      ...baseConfig.features,
      ...envConfig.features,
    },
  };
})();

export default saasConfig;
