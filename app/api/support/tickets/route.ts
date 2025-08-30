import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { SupportTicket, TicketWithResponses } from "@/lib/types/database";

// GET - Fetch user's tickets
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError?.message 
      }, { status: 401 });
    }

    // Fetch tickets with responses
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        responses: support_ticket_responses(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets || [] });

  } catch (error) {
    console.error('Tickets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new ticket
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError?.message 
      }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, priority } = body;

    // Validate required fields
    if (!title || !description || !category || !priority) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, category, priority' 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority. Must be one of: low, medium, high, urgent' 
      }, { status: 400 });
    }

    // Create the ticket
    const { data: ticket, error: createError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority,
        status: 'open'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating ticket:', createError);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    return NextResponse.json({ 
      ticket,
      message: 'Ticket created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Create ticket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
