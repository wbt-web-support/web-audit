import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TicketStatus } from "@/lib/types/database";

// GET - Fetch specific ticket with responses
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const ticketId = params.id;

    // Fetch ticket with responses
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        responses: support_ticket_responses(*)
      `)
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Get ticket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update ticket status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    const ticketId = params.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: open, in_progress, resolved, closed' 
      }, { status: 400 });
    }

    // Update the ticket
    const { data: ticket, error: updateError } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      console.error('Error updating ticket:', updateError);
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }

    return NextResponse.json({ 
      ticket,
      message: 'Ticket updated successfully' 
    });

  } catch (error) {
    console.error('Update ticket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete ticket (only if it's open)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const ticketId = params.id;

    // Check if ticket exists and belongs to user
    const { data: existingTicket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('status')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      console.error('Error fetching ticket:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }

    // Only allow deletion of open tickets
    if (existingTicket.status !== 'open') {
      return NextResponse.json({ 
        error: 'Only open tickets can be deleted' 
      }, { status: 400 });
    }

    // Delete the ticket (responses will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting ticket:', deleteError);
      return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Ticket deleted successfully' 
    });

  } catch (error) {
    console.error('Delete ticket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
