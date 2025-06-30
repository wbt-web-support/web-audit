import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      base_url, 
      company_name, 
      phone_number, 
      email, 
      address, 
      custom_info 
    } = body;

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

    // First check if session exists and get its status
    const { data: existingSession, error: fetchError } = await supabase
      .from('audit_sessions')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingSession) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prevent editing if session is running
    if (existingSession.status === 'crawling' || existingSession.status === 'analyzing') {
      return NextResponse.json(
        { error: 'Cannot edit session while it is running' },
        { status: 400 }
      );
    }

    // Update session (only if it belongs to the user)
    const updateData: any = {
      base_url,
      updated_at: new Date().toISOString(),
      company_name: company_name || null,
      phone_number: phone_number || null,
      email: email || null,
      address: address || null,
      custom_info: custom_info || null,
    };

    const { data: session, error } = await supabase
      .from('audit_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log('Session updated successfully:', session.id);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('PUT route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('audit_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 