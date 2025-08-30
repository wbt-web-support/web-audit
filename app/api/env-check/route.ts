import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
    };

    const hasAllVars = envVars.NEXT_PUBLIC_SUPABASE_URL === 'set' && 
                      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'set';

    return NextResponse.json({ 
      success: hasAllVars,
      environment: process.env.NODE_ENV,
      envVars,
      message: hasAllVars ? 'All required environment variables are set' : 'Missing required environment variables'
    });

  } catch (error) {
    console.error('Env check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check environment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
