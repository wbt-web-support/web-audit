import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantManager } from '@/lib/saas/core/tenant-manager';
import { rateLimiter } from '@/lib/saas/core/rate-limiter';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // Check rate limits
    const rateLimitInfo = await rateLimiter.checkRateLimit(
      'system',
      '/api/saas/tenants/[slug]/projects'
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

    // Build query
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        base_url,
        status,
        settings,
        metrics,
        created_at,
        updated_at,
        created_by
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: projects, error: projectsError, count } = await query;

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Transform projects data
    const transformedProjects = projects.map(project => ({
      id: project.id,
      tenantId: tenant.id,
      name: project.name,
      baseUrl: project.base_url,
      status: project.status,
      settings: project.settings,
      metrics: project.metrics,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
      createdBy: project.created_by,
    }));

    return NextResponse.json({
      success: true,
      projects: transformedProjects,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching tenant projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { name, baseUrl, settings } = body;
    
    // Check rate limits
    const rateLimitInfo = await rateLimiter.checkRateLimit(
      'system',
      '/api/saas/tenants/[slug]/projects'
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
      'currentProjects',
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

    // Check user permissions
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate input
    if (!name || !baseUrl) {
      return NextResponse.json(
        { error: 'Name and base URL are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid base URL' },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        tenant_id: tenant.id,
        name,
        base_url: baseUrl,
        status: 'pending',
        settings: {
          maxPages: settings?.maxPages || 50,
          maxDepth: settings?.maxDepth || 3,
          followExternal: settings?.followExternal || false,
          respectRobotsTxt: settings?.respectRobotsTxt || true,
          userAgent: settings?.userAgent || 'WebAuditBot/1.0',
          timeout: settings?.timeout || 30000,
          analysisTypes: settings?.analysisTypes || ['seo', 'performance', 'accessibility'],
          customUrls: settings?.customUrls || [],
        },
        metrics: {
          pagesCrawled: 0,
          totalPages: 0,
          totalImages: 0,
          totalLinks: 0,
          internalLinks: 0,
          externalLinks: 0,
          averageLoadTime: 0,
          lastCrawledAt: null,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Update tenant usage
    await tenantManager.incrementUsage(tenant.id, 'currentProjects', 1);

    // Transform project data
    const transformedProject = {
      id: project.id,
      tenantId: tenant.id,
      name: project.name,
      baseUrl: project.base_url,
      status: project.status,
      settings: project.settings,
      metrics: project.metrics,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
      createdBy: project.created_by,
    };

    return NextResponse.json({
      success: true,
      project: transformedProject,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
