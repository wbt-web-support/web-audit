import { createClient } from '@/lib/supabase/server';

export interface QueueConfig {
  queueName: string;
  maxWorkers: number;
  maxQueueSize: number;
  concurrency: number;
  delayBetweenJobs: number;
  retryAttempts: number;
  retryDelay: number;
  isActive: boolean;
  description?: string;
}

// Default configurations as fallback
const DEFAULT_QUEUE_CONFIGS: Record<string, QueueConfig> = {
  'web-scraping': {
    queueName: 'web-scraping',
    maxWorkers: 5,
    maxQueueSize: 1000,
    concurrency: 3,
    delayBetweenJobs: 1000,
    retryAttempts: 3,
    retryDelay: 5000,
    isActive: true,
    description: 'Queue for web scraping operations'
  },
  'image-extraction': {
    queueName: 'image-extraction',
    maxWorkers: 3,
    maxQueueSize: 500,
    concurrency: 2,
    delayBetweenJobs: 2000,
    retryAttempts: 2,
    retryDelay: 3000,
    isActive: true,
    description: 'Queue for image extraction and analysis'
  },
  'content-analysis': {
    queueName: 'content-analysis',
    maxWorkers: 2,
    maxQueueSize: 300,
    concurrency: 1,
    delayBetweenJobs: 3000,
    retryAttempts: 3,
    retryDelay: 5000,
    isActive: true,
    description: 'Queue for content analysis operations'
  },
  'seo-analysis': {
    queueName: 'seo-analysis',
    maxWorkers: 2,
    maxQueueSize: 200,
    concurrency: 1,
    delayBetweenJobs: 2000,
    retryAttempts: 2,
    retryDelay: 4000,
    isActive: true,
    description: 'Queue for SEO analysis operations'
  },
  'performance-analysis': {
    queueName: 'performance-analysis',
    maxWorkers: 1,
    maxQueueSize: 100,
    concurrency: 1,
    delayBetweenJobs: 5000,
    retryAttempts: 2,
    retryDelay: 6000,
    isActive: true,
    description: 'Queue for performance analysis operations'
  }
};

export async function getQueueConfig(queueName: string): Promise<QueueConfig> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('redis_queue_management')
      .select('*')
      .eq('queue_name', queueName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn(`⚠️ Queue config not found in database for ${queueName}, using default config`);
      return DEFAULT_QUEUE_CONFIGS[queueName] || DEFAULT_QUEUE_CONFIGS['web-scraping'];
    }

    return {
      queueName: data.queue_name,
      maxWorkers: data.max_workers,
      maxQueueSize: data.max_queue_size,
      concurrency: data.concurrency,
      delayBetweenJobs: data.delay_between_jobs,
      retryAttempts: data.retry_attempts,
      retryDelay: data.retry_delay,
      isActive: data.is_active,
      description: data.description
    };
  } catch (error) {
    console.error(`❌ Error fetching queue config for ${queueName}:`, error);
    return DEFAULT_QUEUE_CONFIGS[queueName] || DEFAULT_QUEUE_CONFIGS['web-scraping'];
  }
}

export async function updateQueueConfig(queueName: string, config: Partial<QueueConfig>): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const updateData: any = {};
    if (config.maxWorkers !== undefined) updateData.max_workers = config.maxWorkers;
    if (config.maxQueueSize !== undefined) updateData.max_queue_size = config.maxQueueSize;
    if (config.concurrency !== undefined) updateData.concurrency = config.concurrency;
    if (config.delayBetweenJobs !== undefined) updateData.delay_between_jobs = config.delayBetweenJobs;
    if (config.retryAttempts !== undefined) updateData.retry_attempts = config.retryAttempts;
    if (config.retryDelay !== undefined) updateData.retry_delay = config.retryDelay;
    if (config.isActive !== undefined) updateData.is_active = config.isActive;
    if (config.description !== undefined) updateData.description = config.description;

    const { error } = await supabase
      .from('redis_queue_management')
      .update(updateData)
      .eq('queue_name', queueName);

    if (error) {
      console.error(`❌ Error updating queue config for ${queueName}:`, error);
      return false;
    }

    console.log(`✅ Queue config updated for ${queueName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating queue config for ${queueName}:`, error);
    return false;
  }
}

export async function getAllQueueConfigs(): Promise<QueueConfig[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('redis_queue_management')
      .select('*')
      .order('queue_name');

    if (error) {
      console.error('❌ Error fetching all queue configs:', error);
      return Object.values(DEFAULT_QUEUE_CONFIGS);
    }

    return data.map(item => ({
      queueName: item.queue_name,
      maxWorkers: item.max_workers,
      maxQueueSize: item.max_queue_size,
      concurrency: item.concurrency,
      delayBetweenJobs: item.delay_between_jobs,
      retryAttempts: item.retry_attempts,
      retryDelay: item.retry_delay,
      isActive: item.is_active,
      description: item.description
    }));
  } catch (error) {
    console.error('❌ Error fetching all queue configs:', error);
    return Object.values(DEFAULT_QUEUE_CONFIGS);
  }
}
