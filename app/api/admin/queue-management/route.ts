import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queueManager } from '@/lib/queue/queue-manager';
import { getAllQueueConfigs, updateQueueConfig } from '@/lib/queue/queue-config';
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

    // Get all queue configurations
    const queueConfigs = await getAllQueueConfigs();
    
    // Get queue statistics
    const queueStats = await queueManager.getAllQueueStats();
    
    // Get error statistics
    const errorStats = errorLogger.getErrorStats();

    return NextResponse.json({
      success: true,
      data: {
        queueConfigs,
        queueStats,
        errorStats,
      },
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to get queue management data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get queue management data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { queueName, config } = body;

    if (!queueName || !config) {
      return NextResponse.json(
        { error: 'Queue name and config are required' },
        { status: 400 }
      );
    }

    // Validate config
    const validFields = [
      'maxWorkers', 'maxQueueSize', 'concurrency', 
      'delayBetweenJobs', 'retryAttempts', 'retryDelay', 'isActive'
    ];
    
    const invalidFields = Object.keys(config).filter(key => !validFields.includes(key));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update queue configuration
    const success = await updateQueueConfig(queueName, config);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update queue configuration' },
        { status: 500 }
      );
    }

    await errorLogger.logInfo(`Queue configuration updated for ${queueName}`, {
      queueName,
      config,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Queue configuration updated for ${queueName}`,
    });

  } catch (error) {
    await errorLogger.logError('error', 'Failed to update queue configuration', error as Error);
    return NextResponse.json(
      { error: 'Failed to update queue configuration' },
      { status: 500 }
    );
  }
}
