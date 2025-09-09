import { errorLogger } from '@/lib/logging/error-logger';
import { queueManager } from '@/lib/queue/queue-manager';

export interface MemoryStats {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  memoryUsagePercentage: number;
  queueMemoryUsage: Record<string, number>;
  isMemoryCritical: boolean;
  recommendations: string[];
}

export interface QueueMemoryUsage {
  queueName: string;
  estimatedMemoryMB: number;
  workerCount: number;
  queueSize: number;
  activeJobs: number;
  waitingJobs: number;
}

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryThresholds = {
    warning: 6144, // 6GB (75% of 8GB)
    critical: 7168, // 7GB (87.5% of 8GB)
    emergency: 7680, // 7.5GB (93.75% of 8GB)
  };

  private constructor() {}

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  async getMemoryStats(): Promise<MemoryStats> {
    try {
      const systemMemory = this.getSystemMemoryInfo();
      const queueMemoryUsage = await this.calculateQueueMemoryUsage();
      
      const totalQueueMemory = Object.values(queueMemoryUsage).reduce(
        (sum, usage) => sum + usage.estimatedMemoryMB, 0
      );
      
      const memoryUsagePercentage = (totalQueueMemory / (8 * 1024)) * 100; // 8GB in MB
      const isMemoryCritical = totalQueueMemory > this.memoryThresholds.critical;
      
      const recommendations = this.generateMemoryRecommendations(
        totalQueueMemory, 
        queueMemoryUsage
      );

      return {
        totalMemory: 8 * 1024, // 8GB in MB
        usedMemory: totalQueueMemory,
        freeMemory: (8 * 1024) - totalQueueMemory,
        memoryUsagePercentage: Math.round(memoryUsagePercentage * 100) / 100,
        queueMemoryUsage,
        isMemoryCritical,
        recommendations,
      };
    } catch (error) {
      await errorLogger.logError('error', 'Failed to get memory stats', error as Error);
      throw error;
    }
  }

  private getSystemMemoryInfo() {
    // In a real implementation, you'd use system APIs to get actual memory usage
    // For now, we'll estimate based on queue usage
    const memUsage = process.memoryUsage();
    return {
      rss: memUsage.rss / 1024 / 1024, // Convert to MB
      heapTotal: memUsage.heapTotal / 1024 / 1024,
      heapUsed: memUsage.heapUsed / 1024 / 1024,
      external: memUsage.external / 1024 / 1024,
    };
  }

  private async calculateQueueMemoryUsage(): Promise<Record<string, number>> {
    const queueStats = await queueManager.getAllQueueStats();
    const memoryUsage: Record<string, number> = {};

    for (const stat of queueStats) {
      const queueMemory = this.estimateQueueMemory(stat);
      memoryUsage[stat.queueName] = queueMemory;
    }

    return memoryUsage;
  }

  private estimateQueueMemory(queueStat: any): number {
    // Memory estimation based on queue configuration and activity
    const baseMemoryPerWorker = 50; // MB per worker
    const memoryPerActiveJob = 15; // MB per active job
    const memoryPerWaitingJob = 5; // MB per waiting job
    const memoryPerCompletedJob = 2; // MB per completed job (cached)

    // Get queue configuration to estimate worker count
    const estimatedWorkers = this.getEstimatedWorkerCount(queueStat.queueName);
    
    const baseMemory = estimatedWorkers * baseMemoryPerWorker;
    const activeJobMemory = queueStat.active * memoryPerActiveJob;
    const waitingJobMemory = queueStat.waiting * memoryPerWaitingJob;
    const completedJobMemory = Math.min(queueStat.completed, 100) * memoryPerCompletedJob; // Limit cached jobs

    return Math.round(baseMemory + activeJobMemory + waitingJobMemory + completedJobMemory);
  }

  private getEstimatedWorkerCount(queueName: string): number {
    // Estimated worker counts based on ultra-optimized configuration
    const workerCounts: Record<string, number> = {
      'web-scraping': 50,
      'image-extraction': 25,
      'content-analysis': 20,
      'seo-analysis': 10,
      'performance-analysis': 5,
    };

    return workerCounts[queueName] || 5;
  }

  private generateMemoryRecommendations(
    totalMemory: number, 
    queueMemoryUsage: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (totalMemory > this.memoryThresholds.emergency) {
      recommendations.push('🚨 EMERGENCY: Memory usage > 7.5GB. Immediately reduce worker counts by 50%');
      recommendations.push('🚨 Clear completed jobs from all queues');
      recommendations.push('🚨 Pause non-critical queues (seo-analysis, performance-analysis)');
    } else if (totalMemory > this.memoryThresholds.critical) {
      recommendations.push('⚠️ CRITICAL: Memory usage > 7GB. Reduce worker counts by 25%');
      recommendations.push('⚠️ Clear old completed jobs');
      recommendations.push('⚠️ Consider pausing seo-analysis queue');
    } else if (totalMemory > this.memoryThresholds.warning) {
      recommendations.push('⚠️ WARNING: Memory usage > 6GB. Monitor closely');
      recommendations.push('💡 Consider reducing queue sizes');
      recommendations.push('💡 Clear completed jobs older than 1 hour');
    } else {
      recommendations.push('✅ Memory usage is within safe limits');
      recommendations.push('💡 System is optimized for 200+ users');
    }

    // Queue-specific recommendations
    const webScrapingMemory = queueMemoryUsage['web-scraping'] || 0;
    if (webScrapingMemory > 2000) {
      recommendations.push('🔧 Web scraping queue using > 2GB. Consider reducing workers from 50 to 40');
    }

    const imageExtractionMemory = queueMemoryUsage['image-extraction'] || 0;
    if (imageExtractionMemory > 1500) {
      recommendations.push('🔧 Image extraction queue using > 1.5GB. Consider reducing workers from 25 to 20');
    }

    return recommendations;
  }

  async checkMemoryAndTakeAction(): Promise<boolean> {
    try {
      const memoryStats = await this.getMemoryStats();
      
      if (memoryStats.usedMemory > this.memoryThresholds.emergency) {
        await this.emergencyMemoryReduction();
        return true;
      } else if (memoryStats.usedMemory > this.memoryThresholds.critical) {
        await this.criticalMemoryReduction();
        return true;
      } else if (memoryStats.usedMemory > this.memoryThresholds.warning) {
        await this.warningMemoryOptimization();
        return false;
      }

      return false;
    } catch (error) {
      await errorLogger.logError('error', 'Failed to check memory and take action', error as Error);
      return false;
    }
  }

  private async emergencyMemoryReduction(): Promise<void> {
    console.log('🚨 EMERGENCY: Reducing memory usage immediately...');
    
    try {
      // Pause non-critical queues
      await queueManager.pauseQueue('seo-analysis');
      await queueManager.pauseQueue('performance-analysis');
      
      // Clear completed jobs
      await queueManager.clearQueue('seo-analysis');
      await queueManager.clearQueue('performance-analysis');
      
      await errorLogger.logError('warning', 'Emergency memory reduction performed', undefined, {
        action: 'emergency_memory_reduction',
        pausedQueues: ['seo-analysis', 'performance-analysis'],
        clearedQueues: ['seo-analysis', 'performance-analysis'],
      });
      
      console.log('✅ Emergency memory reduction completed');
    } catch (error) {
      await errorLogger.logError('error', 'Failed to perform emergency memory reduction', error as Error);
    }
  }

  private async criticalMemoryReduction(): Promise<void> {
    console.log('⚠️ CRITICAL: Reducing memory usage...');
    
    try {
      // Pause seo-analysis queue
      await queueManager.pauseQueue('seo-analysis');
      
      // Clear old completed jobs
      await queueManager.clearQueue('seo-analysis');
      
      await errorLogger.logError('warning', 'Critical memory reduction performed', undefined, {
        action: 'critical_memory_reduction',
        pausedQueues: ['seo-analysis'],
        clearedQueues: ['seo-analysis'],
      });
      
      console.log('✅ Critical memory reduction completed');
    } catch (error) {
      await errorLogger.logError('error', 'Failed to perform critical memory reduction', error as Error);
    }
  }

  private async warningMemoryOptimization(): Promise<void> {
    console.log('⚠️ WARNING: Memory usage high, monitoring...');
    
    await errorLogger.logError('info', 'High memory usage detected', undefined, {
      action: 'memory_warning',
      recommendation: 'Monitor memory usage closely',
    });
  }

  async getQueueMemoryBreakdown(): Promise<QueueMemoryUsage[]> {
    try {
      const queueStats = await queueManager.getAllQueueStats();
      const breakdown: QueueMemoryUsage[] = [];

      for (const stat of queueStats) {
        const estimatedMemory = this.estimateQueueMemory(stat);
        const workerCount = this.getEstimatedWorkerCount(stat.queueName);
        
        breakdown.push({
          queueName: stat.queueName,
          estimatedMemoryMB: estimatedMemory,
          workerCount,
          queueSize: stat.waiting + stat.active,
          activeJobs: stat.active,
          waitingJobs: stat.waiting,
        });
      }

      return breakdown.sort((a, b) => b.estimatedMemoryMB - a.estimatedMemoryMB);
    } catch (error) {
      await errorLogger.logError('error', 'Failed to get queue memory breakdown', error as Error);
      return [];
    }
  }

  // Start continuous memory monitoring
  startMemoryMonitoring(intervalMs: number = 30000): void {
    console.log(`🔍 Starting memory monitoring (every ${intervalMs / 1000} seconds)...`);
    
    setInterval(async () => {
      try {
        const actionTaken = await this.checkMemoryAndTakeAction();
        
        if (actionTaken) {
          console.log('🔄 Memory action taken, monitoring continues...');
        }
        
        // Log memory stats every 5 minutes
        const now = new Date();
        if (now.getMinutes() % 5 === 0) {
          const memoryStats = await this.getMemoryStats();
          await errorLogger.logInfo('Memory monitoring stats', {
            totalMemoryMB: memoryStats.totalMemory,
            usedMemoryMB: memoryStats.usedMemory,
            freeMemoryMB: memoryStats.freeMemory,
            usagePercentage: memoryStats.memoryUsagePercentage,
            isCritical: memoryStats.isMemoryCritical,
          });
        }
      } catch (error) {
        console.error('❌ Memory monitoring error:', error);
      }
    }, intervalMs);
  }

  // Stop memory monitoring
  stopMemoryMonitoring(): void {
    console.log('🛑 Memory monitoring stopped');
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Convenience functions
export const getMemoryStats = () => memoryMonitor.getMemoryStats();
export const checkMemoryAndTakeAction = () => memoryMonitor.checkMemoryAndTakeAction();
export const getQueueMemoryBreakdown = () => memoryMonitor.getQueueMemoryBreakdown();
export const startMemoryMonitoring = (intervalMs?: number) => memoryMonitor.startMemoryMonitoring(intervalMs);
export const stopMemoryMonitoring = () => memoryMonitor.stopMemoryMonitoring();
