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
      custom_info,
      instructions,
      crawlType,
      services,
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
      instructions: instructions || null,
      crawl_type: crawlType || null,
      services: services || null,
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

    if (session.status !== 'pending') {
      // Set session status to 'pending' after update
      const { data: updatedSession, error: statusError } = await supabase
        .from('audit_sessions')
        .update({ status: 'pending' })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (!statusError && updatedSession) {
        session.status = updatedSession.status;
      } else if (statusError) {
        console.error('Error setting session status to pending:', statusError);
      }
    }

    console.log('Session updated successfully:', session.id);

    // Fetch all scraped_pages for this session
    const { data: pages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('audit_session_id', id);

    if (pagesError) {
      console.error('Error fetching scraped pages:', pagesError);
    } else if (pages && pages.length > 0) {
      const pageIds = pages.map((p: { id: string }) => p.id);
      // 2. Delete all audit_results for these page ids
      const { error: deleteError } = await supabase
        .from('audit_results')
        .delete()
        .in('scraped_page_id', pageIds);
      if (deleteError) {
        console.error('Error deleting audit results:', deleteError);
        // Not a fatal error, continue
      }
      // 3. Delete all scraped_pages for this session
      const { error: deletePagesError } = await supabase
        .from('scraped_pages')
        .delete()
        .in('id', pageIds);
      if (deletePagesError) {
        console.error('Error deleting scraped pages:', deletePagesError);
        // Not a fatal error, continue
      }
    }

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