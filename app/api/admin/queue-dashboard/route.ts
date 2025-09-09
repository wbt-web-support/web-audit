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

    // Get comprehensive queue dashboard data
    const dashboardData = await getQueueDashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to get queue dashboard data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get queue dashboard data' },
      { status: 500 }
    );
  }
}

async function getQueueDashboardData() {
  try {
    // Get queue statistics
    const queueStats = await queueManager.getAllQueueStats();
    
    // Get error statistics
    const errorStats = errorLogger.getErrorStats();
    
    // Get recent logs
    const recentLogs = errorLogger.getRecentLogs(50);
    
    // Get queue-specific logs
    const queueLogs = queueStats.reduce((acc, stat) => {
      acc[stat.queueName] = errorLogger.getQueueLogs(stat.queueName, 20);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate system health metrics
    const totalJobs = queueStats.reduce((sum, stat) => sum + stat.total, 0);
    const totalErrors = errorStats.recentErrors;
    const errorRate = totalJobs > 0 ? (totalErrors / totalJobs) * 100 : 0;
    
    const systemHealth = {
      status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical',
      errorRate: Math.round(errorRate * 100) / 100,
      totalJobs,
      totalErrors,
      activeQueues: queueStats.length,
    };

    // Get queue performance metrics
    const queuePerformance = queueStats.map(stat => ({
      queueName: stat.queueName,
      throughput: stat.completed,
      errorRate: stat.failed > 0 ? (stat.failed / (stat.completed + stat.failed)) * 100 : 0,
      avgWaitTime: calculateAverageWaitTime(stat),
      utilization: calculateQueueUtilization(stat),
    }));

    return {
      systemHealth,
      queueStats,
      queuePerformance,
      errorStats,
      recentLogs,
      queueLogs,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    await errorLogger.logError('error', 'Failed to get queue dashboard data', error as Error);
    throw error;
  }
}

function calculateAverageWaitTime(stat: any): number {
  // This is a simplified calculation
  // In a real implementation, you'd track actual wait times
  if (stat.waiting === 0) return 0;
  
  // Estimate based on queue size and processing rate
  const estimatedProcessingRate = stat.completed / 3600; // jobs per hour (simplified)
  return estimatedProcessingRate > 0 ? stat.waiting / estimatedProcessingRate : 0;
}

function calculateQueueUtilization(stat: any): number {
  const total = stat.waiting + stat.active + stat.completed + stat.failed + stat.delayed;
  if (total === 0) return 0;
  
  const active = stat.active;
  return Math.round((active / total) * 100);
}
