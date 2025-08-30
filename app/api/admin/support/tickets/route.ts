import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TicketWithResponses } from "@/lib/types/database";

// GET - Fetch all tickets (admin only)
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

    // Fetch all tickets with responses
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        responses: support_ticket_responses(*)
      `)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets || [] });

  } catch (error) {
    console.error('Admin tickets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
