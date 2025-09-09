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
    
    // Check rate limits
    const rateLimitInfo = await rateLimiter.checkRateLimit(
      'system', // Use system for tenant lookup
      '/api/saas/tenants/[slug]'
    );

    if (rateLimitInfo.remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': rateLimitInfo.resetTime.toISOString() } }
      );
    }

    // Get tenant by slug
    const tenant = await tenantManager.getTenantBySlug(slug);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if tenant is active
    if (tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'Tenant is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
        limits: tenant.limits,
        usage: tenant.usage,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tenant
    const tenant = await tenantManager.getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user belongs to this tenant
    if (profile.tenant_id !== tenant.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update tenant settings
    const { settings } = body;
    if (settings) {
      const success = await tenantManager.updateTenantSettings(tenant.id, settings);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update tenant settings' },
          { status: 500 }
        );
      }
    }

    // Get updated tenant
    const updatedTenant = await tenantManager.getTenant(tenant.id);

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });

  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
