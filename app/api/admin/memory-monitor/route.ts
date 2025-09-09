import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { memoryMonitor } from '@/lib/monitoring/memory-monitor';
import { errorLogger, logInfo } from '@/lib/logging/error-logger';

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

    // Get memory statistics
    const memoryStats = await memoryMonitor.getMemoryStats();
    const queueMemoryBreakdown = await memoryMonitor.getQueueMemoryBreakdown();

    return NextResponse.json({
      success: true,
      data: {
        memoryStats,
        queueMemoryBreakdown,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to get memory monitor data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get memory monitor data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    let result: any = {};

    switch (action) {
      case 'check_memory':
        const actionTaken = await memoryMonitor.checkMemoryAndTakeAction();
        result = { actionTaken, message: actionTaken ? 'Memory action taken' : 'No action needed' };
        break;

      case 'get_breakdown':
        const breakdown = await memoryMonitor.getQueueMemoryBreakdown();
        result = { breakdown };
        break;

      case 'start_monitoring':
        const { intervalMs = 30000 } = body;
        memoryMonitor.startMemoryMonitoring(intervalMs);
        result = { message: `Memory monitoring started with ${intervalMs}ms interval` };
        break;

      case 'stop_monitoring':
        memoryMonitor.stopMemoryMonitoring();
        result = { message: 'Memory monitoring stopped' };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    await logInfo(`Memory monitor action: ${action}`, {
      action,
      performedBy: user.id,
      result,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to perform memory monitor action', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform memory monitor action' },
      { status: 500 }
    );
  }
}
