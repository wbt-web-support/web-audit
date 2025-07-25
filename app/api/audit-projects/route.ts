import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { AuditProject } from '@/lib/types/database';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received body:", body);
   
    const { 
      base_url, 
      crawlType, 
      services, 
      companyDetails,
      instructions,
      custom_urls,
      stripe_key_urls
    } = body;

    const {
      companyName,
      phoneNumber,
      email,
      address,
      customInfo
    } = companyDetails || {};
   
    if (!base_url) {
      return NextResponse.json(
        { error: 'base_url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(base_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create audit project
    const { data: project, error } = await supabase
      .from('audit_projects')
      .insert({
        user_id: user.id,
        base_url,
        crawl_type: crawlType,
        instructions: instructions || null,
        services: services || null,
        status: 'pending',
        company_name: companyName || null,
        phone_number: phoneNumber || null,
        email: email || null,
        address: address || null,
        custom_info: customInfo || null,
        custom_urls: custom_urls || null,
        stripe_key_urls: stripe_key_urls || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 


