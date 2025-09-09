import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queueManager } from '@/lib/queue/queue-manager';
import { errorLogger } from '@/lib/logging/error-logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get comprehensive performance data
    const performanceData = await getQueuePerformanceData();

    return NextResponse.json({
      success: true,
      data: performanceData,
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to get queue performance data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get queue performance data' },
      { status: 500 }
    );
  }
}

async function getQueuePerformanceData() {
  try {
    // Get current queue statistics
    const queueStats = await queueManager.getAllQueueStats();
    
    // Get error statistics
    const errorStats = errorLogger.getErrorStats();
    
    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(queueStats);
    
    // Get user experience metrics
    const userExperienceMetrics = calculateUserExperienceMetrics(queueStats);
    
    // Get system health
    const systemHealth = calculateSystemHealth(queueStats, errorStats);
    
    // Get capacity analysis
    const capacityAnalysis = calculateCapacityAnalysis(queueStats);
    
    // Get optimization recommendations
    const optimizationRecommendations = generateOptimizationRecommendations(queueStats, errorStats);

    return {
      timestamp: new Date().toISOString(),
      queueStats,
      performanceMetrics,
      userExperienceMetrics,
      systemHealth,
      capacityAnalysis,
      optimizationRecommendations,
      errorStats,
    };

  } catch (error) {
    await errorLogger.logError('error', 'Failed to calculate performance data', error as Error);
    throw error;
  }
}

function calculatePerformanceMetrics(queueStats: any[]) {
  const totalJobs = queueStats.reduce((sum, stat) => sum + stat.total, 0);
  const totalCompleted = queueStats.reduce((sum, stat) => sum + stat.completed, 0);
  const totalFailed = queueStats.reduce((sum, stat) => sum + stat.failed, 0);
  const totalActive = queueStats.reduce((sum, stat) => sum + stat.active, 0);
  const totalWaiting = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);

  const successRate = totalJobs > 0 ? (totalCompleted / totalJobs) * 100 : 0;
  const errorRate = totalJobs > 0 ? (totalFailed / totalJobs) * 100 : 0;
  const utilizationRate = totalJobs > 0 ? (totalActive / totalJobs) * 100 : 0;

  // Calculate throughput (jobs per minute)
  const throughput = calculateThroughput(queueStats);

  return {
    totalJobs,
    totalCompleted,
    totalFailed,
    totalActive,
    totalWaiting,
    successRate: Math.round(successRate * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
    throughput,
  };
}

function calculateUserExperienceMetrics(queueStats: any[]) {
  // Calculate average wait times for different queue positions
  const webScrapingStats = queueStats.find(stat => stat.queueName === 'web-scraping');
  
  if (!webScrapingStats) {
    return {
      averageWaitTime: 0,
      estimatedCompletionTime: 0,
      queuePosition: 0,
      userExperience: 'unknown'
    };
  }

  const waitingJobs = webScrapingStats.waiting;
  const activeJobs = webScrapingStats.active;
  const concurrentCapacity = 60; // 20 workers × 3 concurrency (optimized)
  
  // Estimate wait time based on queue position
  const averageWaitTime = waitingJobs > 0 ? (waitingJobs / concurrentCapacity) * 5 : 0; // 5 minutes per batch
  const estimatedCompletionTime = averageWaitTime + 5; // 5 minutes processing time
  
  // Determine user experience level
  let userExperience = 'excellent';
  if (averageWaitTime > 30) userExperience = 'poor';
  else if (averageWaitTime > 15) userExperience = 'fair';
  else if (averageWaitTime > 5) userExperience = 'good';

  return {
    averageWaitTime: Math.round(averageWaitTime * 100) / 100,
    estimatedCompletionTime: Math.round(estimatedCompletionTime * 100) / 100,
    queuePosition: waitingJobs,
    userExperience,
    concurrentCapacity,
    currentLoad: Math.round(((waitingJobs + activeJobs) / concurrentCapacity) * 100),
  };
}

function calculateSystemHealth(queueStats: any[], errorStats: any) {
  const totalJobs = queueStats.reduce((sum, stat) => sum + stat.total, 0);
  const totalErrors = errorStats.recentErrors;
  const errorRate = totalJobs > 0 ? (totalErrors / totalJobs) * 100 : 0;
  
  let healthStatus = 'healthy';
  let healthScore = 100;
  
  // Check error rate
  if (errorRate > 10) {
    healthStatus = 'critical';
    healthScore -= 50;
  } else if (errorRate > 5) {
    healthStatus = 'warning';
    healthScore -= 25;
  }
  
  // Check queue utilization
  const totalWaiting = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);
  if (totalWaiting > 200) {
    healthStatus = 'critical';
    healthScore -= 30;
  } else if (totalWaiting > 100) {
    healthStatus = 'warning';
    healthScore -= 15;
  }
  
  // Check if queues are processing
  const totalActive = queueStats.reduce((sum, stat) => sum + stat.active, 0);
  if (totalActive === 0 && totalWaiting > 0) {
    healthStatus = 'critical';
    healthScore -= 40;
  }

  return {
    status: healthStatus,
    score: Math.max(0, healthScore),
    errorRate: Math.round(errorRate * 100) / 100,
    totalWaiting,
    totalActive,
    isProcessing: totalActive > 0,
  };
}

function calculateCapacityAnalysis(queueStats: any[]) {
  const webScrapingStats = queueStats.find(stat => stat.queueName === 'web-scraping');
  const imageExtractionStats = queueStats.find(stat => stat.queueName === 'image-extraction');
  const contentAnalysisStats = queueStats.find(stat => stat.queueName === 'content-analysis');
  
  const currentCapacity = {
    webScraping: webScrapingStats ? (webScrapingStats.active + webScrapingStats.waiting) : 0,
    imageExtraction: imageExtractionStats ? (imageExtractionStats.active + imageExtractionStats.waiting) : 0,
    contentAnalysis: contentAnalysisStats ? (contentAnalysisStats.active + contentAnalysisStats.waiting) : 0,
  };
  
  const maxCapacity = {
    webScraping: 60, // 20 workers × 3 concurrency
    imageExtraction: 30, // 15 workers × 2 concurrency
    contentAnalysis: 20, // 10 workers × 2 concurrency
  };
  
  const utilization = {
    webScraping: Math.round((currentCapacity.webScraping / maxCapacity.webScraping) * 100),
    imageExtraction: Math.round((currentCapacity.imageExtraction / maxCapacity.imageExtraction) * 100),
    contentAnalysis: Math.round((currentCapacity.contentAnalysis / maxCapacity.contentAnalysis) * 100),
  };
  
  const totalCurrentCapacity = Object.values(currentCapacity).reduce((sum, cap) => sum + cap, 0);
  const totalMaxCapacity = Object.values(maxCapacity).reduce((sum, cap) => sum + cap, 0);
  const overallUtilization = Math.round((totalCurrentCapacity / totalMaxCapacity) * 100);
  
  return {
    currentCapacity,
    maxCapacity,
    utilization,
    overallUtilization,
    canHandleMoreUsers: overallUtilization < 80,
    estimatedMaxUsers: Math.round(totalMaxCapacity * 0.8), // 80% utilization
  };
}

function generateOptimizationRecommendations(queueStats: any[], errorStats: any) {
  const recommendations = [];
  
  // Check web scraping queue
  const webScrapingStats = queueStats.find(stat => stat.queueName === 'web-scraping');
  if (webScrapingStats && webScrapingStats.waiting > 50) {
    recommendations.push({
      type: 'scale',
      queue: 'web-scraping',
      priority: 'high',
      message: `Web scraping queue has ${webScrapingStats.waiting} waiting jobs. Consider increasing workers.`,
      action: 'Increase maxWorkers from 20 to 30',
    });
  }
  
  // Check image extraction queue
  const imageExtractionStats = queueStats.find(stat => stat.queueName === 'image-extraction');
  if (imageExtractionStats && imageExtractionStats.waiting > 30) {
    recommendations.push({
      type: 'scale',
      queue: 'image-extraction',
      priority: 'medium',
      message: `Image extraction queue has ${imageExtractionStats.waiting} waiting jobs.`,
      action: 'Increase maxWorkers from 15 to 20',
    });
  }
  
  // Check error rate
  const totalJobs = queueStats.reduce((sum, stat) => sum + stat.total, 0);
  const errorRate = totalJobs > 0 ? (errorStats.recentErrors / totalJobs) * 100 : 0;
  
  if (errorRate > 5) {
    recommendations.push({
      type: 'error',
      priority: 'high',
      message: `High error rate: ${errorRate.toFixed(2)}%. Check system health.`,
      action: 'Investigate error logs and system resources',
    });
  }
  
  // Check overall utilization
  const totalWaiting = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);
  if (totalWaiting > 200) {
    recommendations.push({
      type: 'capacity',
      priority: 'critical',
      message: `High queue utilization: ${totalWaiting} waiting jobs.`,
      action: 'Consider horizontal scaling or increasing all queue capacities',
    });
  }
  
  return recommendations;
}

function calculateThroughput(queueStats: any[]) {
  // This is a simplified calculation
  // In a real implementation, you'd track actual throughput over time
  const totalCompleted = queueStats.reduce((sum, stat) => sum + stat.completed, 0);
  const totalActive = queueStats.reduce((sum, stat) => sum + stat.active, 0);
  
  // Estimate based on current activity
  const estimatedThroughput = totalActive * 0.1; // Rough estimate: 0.1 jobs per minute per active job
  
  return Math.round(estimatedThroughput * 100) / 100;
}
