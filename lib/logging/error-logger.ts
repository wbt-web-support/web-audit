import { workerSupabase } from '@/lib/supabase/workers';

export interface ErrorLog {
  id?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  projectId?: string;
  jobId?: string;
  queueName?: string;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface QueueErrorLog extends ErrorLog {
  queueName: string;
  jobId: string;
  jobData?: any;
  retryCount?: number;
  maxRetries?: number;
}

export interface ScrapingErrorLog extends ErrorLog {
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
}

export interface AnalysisErrorLog extends ErrorLog {
  analysisType?: 'image' | 'link' | 'content' | 'seo' | 'performance';
  pageUrl?: string;
  resourceCount?: number;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private maxLogsInMemory = 1000;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  // General error logging
  async logError(
    level: ErrorLog['level'],
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): Promise<void> {
    const errorLog: ErrorLog = {
      level,
      message,
      stack: error?.stack,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      timestamp: new Date(),
    };

    // Add to memory buffer
    this.addToMemoryBuffer(errorLog);

    // Log to console with appropriate level
    this.logToConsole(errorLog);

    // Save to database
    await this.saveToDatabase(errorLog);
  }

  // Queue-specific error logging
  async logQueueError(
    queueName: string,
    jobId: string,
    message: string,
    error?: Error,
    jobData?: any,
    retryCount?: number,
    maxRetries?: number
  ): Promise<void> {
    const queueErrorLog: QueueErrorLog = {
      level: 'error',
      message,
      stack: error?.stack,
      context: {
        errorName: error?.name,
        errorMessage: error?.message,
        jobData: jobData ? JSON.stringify(jobData) : undefined,
      },
      queueName,
      jobId,
      jobData: jobData ? JSON.stringify(jobData) : undefined,
      retryCount,
      maxRetries,
      timestamp: new Date(),
    };

    this.addToMemoryBuffer(queueErrorLog);
    this.logToConsole(queueErrorLog);
    await this.saveToDatabase(queueErrorLog);
  }

  // Scraping-specific error logging
  async logScrapingError(
    message: string,
    error?: Error,
    url?: string,
    statusCode?: number,
    responseTime?: number,
    userAgent?: string,
    context?: Record<string, any>
  ): Promise<void> {
    const scrapingErrorLog: ScrapingErrorLog = {
      level: 'error',
      message,
      stack: error?.stack,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      url,
      statusCode,
      responseTime,
      userAgent,
      timestamp: new Date(),
    };

    this.addToMemoryBuffer(scrapingErrorLog);
    this.logToConsole(scrapingErrorLog);
    await this.saveToDatabase(scrapingErrorLog);
  }

  // Analysis-specific error logging
  async logAnalysisError(
    analysisType: AnalysisErrorLog['analysisType'],
    message: string,
    error?: Error,
    pageUrl?: string,
    resourceCount?: number,
    context?: Record<string, any>
  ): Promise<void> {
    const analysisErrorLog: AnalysisErrorLog = {
      level: 'error',
      message,
      stack: error?.stack,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      analysisType,
      pageUrl,
      resourceCount,
      timestamp: new Date(),
    };

    this.addToMemoryBuffer(analysisErrorLog);
    this.logToConsole(analysisErrorLog);
    await this.saveToDatabase(analysisErrorLog);
  }

  // Performance logging
  async logPerformance(
    operation: string,
    duration: number,
    context?: Record<string, any>
  ): Promise<void> {
    const performanceLog: ErrorLog = {
      level: 'info',
      message: `Performance: ${operation} took ${duration}ms`,
      context: {
        operation,
        duration,
        ...context,
      },
      timestamp: new Date(),
    };

    this.addToMemoryBuffer(performanceLog);
    this.logToConsole(performanceLog);
    await this.saveToDatabase(performanceLog);
  }

  // Queue statistics logging
  async logQueueStats(
    queueName: string,
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }
  ): Promise<void> {
    const statsLog: ErrorLog = {
      level: 'info',
      message: `Queue stats for ${queueName}`,
      context: {
        queueName,
        ...stats,
      },
      queueName,
      timestamp: new Date(),
    };

    this.addToMemoryBuffer(statsLog);
    this.logToConsole(statsLog);
    await this.saveToDatabase(statsLog);
  }

  private addToMemoryBuffer(log: ErrorLog): void {
    this.logs.unshift(log);
    
    // Keep only the most recent logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(0, this.maxLogsInMemory);
    }
  }

  private logToConsole(log: ErrorLog): void {
    const timestamp = log.timestamp.toISOString();
    const contextStr = log.context ? ` | Context: ${JSON.stringify(log.context)}` : '';
    const queueStr = log.queueName ? ` | Queue: ${log.queueName}` : '';
    const jobStr = log.jobId ? ` | Job: ${log.jobId}` : '';

    const logMessage = `[${timestamp}] ${log.level.toUpperCase()}: ${log.message}${queueStr}${jobStr}${contextStr}`;

    switch (log.level) {
      case 'error':
        console.error(logMessage);
        if (log.stack) {
          console.error('Stack trace:', log.stack);
        }
        break;
      case 'warning':
        console.warn(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'debug':
        console.debug(logMessage);
        break;
    }
  }

  private async saveToDatabase(log: ErrorLog): Promise<void> {
    try {
      const supabase = workerSupabase;
      
      if (!supabase) {
        console.warn('⚠️ Cannot save error to database: Supabase client not available');
        return;
      }
      
      const { error } = await supabase
        .from('error_logs')
        .insert({
          level: log.level,
          message: log.message,
          stack: log.stack,
          context: log.context,
          user_id: log.userId,
          project_id: log.projectId,
          job_id: log.jobId,
          queue_name: log.queueName,
          timestamp: log.timestamp.toISOString(),
          resolved: log.resolved || false,
        });

      if (error) {
        console.error('❌ Failed to save error log to database:', error);
      }
    } catch (error) {
      console.error('❌ Error saving to database:', error);
    }
  }

  // Get recent logs from memory
  getRecentLogs(limit: number = 100): ErrorLog[] {
    return this.logs.slice(0, limit);
  }

  // Get logs by level
  getLogsByLevel(level: ErrorLog['level'], limit: number = 100): ErrorLog[] {
    return this.logs.filter(log => log.level === level).slice(0, limit);
  }

  // Get queue-specific logs
  getQueueLogs(queueName: string, limit: number = 100): ErrorLog[] {
    return this.logs.filter(log => log.queueName === queueName).slice(0, limit);
  }

  // Clear memory buffer
  clearMemoryBuffer(): void {
    this.logs = [];
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byLevel: Record<string, number>;
    byQueue: Record<string, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.logs.filter(log => 
      log.level === 'error' && log.timestamp > oneHourAgo
    ).length;

    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byQueue = this.logs.reduce((acc, log) => {
      if (log.queueName) {
        acc[log.queueName] = (acc[log.queueName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.logs.length,
      byLevel,
      byQueue,
      recentErrors,
    };
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Convenience functions for common logging scenarios
export const logError = (message: string, error?: Error, context?: Record<string, any>) =>
  errorLogger.logError('error', message, error, context);

export const logWarning = (message: string, context?: Record<string, any>) =>
  errorLogger.logError('warning', message, undefined, context);

export const logInfo = (message: string, context?: Record<string, any>) =>
  errorLogger.logError('info', message, undefined, context);

export const logDebug = (message: string, context?: Record<string, any>) =>
  errorLogger.logError('debug', message, undefined, context);

export const logQueueError = (
  queueName: string,
  jobId: string,
  message: string,
  error?: Error,
  jobData?: any,
  retryCount?: number,
  maxRetries?: number
) => errorLogger.logQueueError(queueName, jobId, message, error, jobData, retryCount, maxRetries);

export const logScrapingError = (
  message: string,
  error?: Error,
  url?: string,
  statusCode?: number,
  responseTime?: number,
  userAgent?: string,
  context?: Record<string, any>
) => errorLogger.logScrapingError(message, error, url, statusCode, responseTime, userAgent, context);

export const logAnalysisError = (
  analysisType: AnalysisErrorLog['analysisType'],
  message: string,
  error?: Error,
  pageUrl?: string,
  resourceCount?: number,
  context?: Record<string, any>
) => errorLogger.logAnalysisError(analysisType, message, error, pageUrl, resourceCount, context);

export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) =>
  errorLogger.logPerformance(operation, duration, context);

export const logQueueStats = (queueName: string, stats: any) =>
  errorLogger.logQueueStats(queueName, stats);
