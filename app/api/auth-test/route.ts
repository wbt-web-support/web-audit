import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth test error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message,
        code: authError.status || 'unknown'
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No authenticated user found',
        session: null
      }, { status: 401 });
    }

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        created_at: user.created_at
      },
      session: session ? {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
        expires_at: session.expires_at
      } : null
    });

  } catch (error) {
    console.error('Auth test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
