import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Add support response to ticket (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError?.message 
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 });
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const { message } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }

    // Don't allow responses on closed tickets
    if (ticket.status === 'closed') {
      return NextResponse.json({ 
        error: 'Cannot add responses to closed tickets' 
      }, { status: 400 });
    }

    const authorName = profile?.full_name || 'Support Team';

    // Create the response
    const { data: response, error: createError } = await supabase
      .from('support_ticket_responses')
      .insert({
        ticket_id: ticketId,
        message: message.trim(),
        is_from_support: true,
        author_name: authorName,
        author_id: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating response:', createError);
      return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
    }

    return NextResponse.json({ 
      response,
      message: 'Response added successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Admin add response API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
