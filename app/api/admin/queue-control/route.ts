import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queueManager } from '@/lib/queue/queue-manager';
import { logInfo, logError } from '@/lib/logging/error-logger';

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
    const { action, queueName, jobId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'pause':
        if (!queueName) {
          return NextResponse.json(
            { error: 'Queue name is required for pause action' },
            { status: 400 }
          );
        }
        await queueManager.pauseQueue(queueName);
        result = { message: `Queue ${queueName} paused` };
        break;

      case 'resume':
        if (!queueName) {
          return NextResponse.json(
            { error: 'Queue name is required for resume action' },
            { status: 400 }
          );
        }
        await queueManager.resumeQueue(queueName);
        result = { message: `Queue ${queueName} resumed` };
        break;

      case 'clear':
        if (!queueName) {
          return NextResponse.json(
            { error: 'Queue name is required for clear action' },
            { status: 400 }
          );
        }
        await queueManager.clearQueue(queueName);
        result = { message: `Queue ${queueName} cleared` };
        break;

      case 'cancel_job':
        if (!queueName || !jobId) {
          return NextResponse.json(
            { error: 'Queue name and job ID are required for cancel job action' },
            { status: 400 }
          );
        }
        
        // Import the specific cancel functions
        const { cancelScrapingJob } = await import('@/lib/services/web-scraper');
        const { cancelImageExtractionJob, cancelLinkExtractionJob } = await import('@/lib/services/extract-resources');
        
        let cancelled = false;
        switch (queueName) {
          case 'web-scraping':
            cancelled = await cancelScrapingJob(jobId);
            break;
          case 'image-extraction':
            cancelled = await cancelImageExtractionJob(jobId);
            break;
          case 'content-analysis':
            cancelled = await cancelLinkExtractionJob(jobId);
            break;
          default:
            return NextResponse.json(
              { error: `Unknown queue: ${queueName}` },
              { status: 400 }
            );
        }
        
        result = { 
          message: cancelled ? `Job ${jobId} cancelled` : `Failed to cancel job ${jobId}`,
          success: cancelled
        };
        break;

      case 'get_stats':
        if (queueName) {
          result = await queueManager.getQueueStats(queueName);
        } else {
          result = await queueManager.getAllQueueStats();
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    await logInfo(`Queue control action: ${action}`, {
      action,
      queueName,
      jobId,
      performedBy: user.id,
      result,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    await logError('Failed to perform queue control action', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform queue control action' },
      { status: 500 }
    );
  }
}
