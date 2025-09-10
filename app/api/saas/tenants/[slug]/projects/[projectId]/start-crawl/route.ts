import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantManager } from '@/lib/saas/core/tenant-manager';
import { rateLimiter } from '@/lib/saas/core/rate-limiter';
import { TenantWebScraper } from '@/lib/saas/services/tenant-web-scraper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; projectId: string }> }
) {
  try {
    const { slug, projectId } = await params;
    const body = await request.json();
    const { background = false } = body;
    
    // Check rate limits
    const rateLimitInfo = await rateLimiter.checkRateLimit(
      'system',
      '/api/saas/tenants/[slug]/projects/[projectId]/start-crawl'
    );

    if (rateLimitInfo.remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': rateLimitInfo.resetTime.toISOString() } }
      );
    }

    // Get tenant
    const tenant = await tenantManager.getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check tenant limits
    const limitCheck = await tenantManager.checkTenantLimits(
      tenant.id,
      'currentCrawls',
      1
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Tenant limit exceeded: ${limitCheck.reason}` },
        { status: 403 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.tenant_id !== tenant.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('tenant_id', tenant.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is already crawling
    if (project.status === 'crawling') {
      return NextResponse.json(
        { error: 'Project is already being crawled' },
        { status: 409 }
      );
    }

    // Update project status
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        status: 'crawling',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 }
      );
    }

    // Create tenant web scraper
    const scraper = new TenantWebScraper(
      project.base_url,
      tenant.id,
      projectId,
      {
        maxPages: project.settings.maxPages,
        maxDepth: project.settings.maxDepth,
        followExternal: project.settings.followExternal,
        respectRobotsTxt: project.settings.respectRobotsTxt,
        userAgent: project.settings.userAgent,
        timeout: project.settings.timeout,
      }
    );

    // Start crawling with queue
    const crawlResult = await scraper.crawlWithQueue({
      tenantId: tenant.id,
      projectId,
      priority: 1,
      background,
    });

    // Calculate estimated time
    const estimatedTime = Math.ceil(
      (project.settings.maxPages * 2000) / Math.min(tenant.limits.maxWorkers, 5) / 1000
    );

    return NextResponse.json({
      success: true,
      jobId: crawlResult.jobId,
      queueName: crawlResult.queueName,
      estimated_time_sec: estimatedTime,
      message: background 
        ? 'Background crawling started successfully' 
        : 'Crawling started successfully',
    });

  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
