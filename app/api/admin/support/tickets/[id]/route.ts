import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TicketStatus } from "@/lib/types/database";

// PUT - Update ticket status (admin only)
export async function PUT(
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 });
    }

    const { id: ticketId } = await params;
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
    console.error('Admin update ticket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
