import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Profile fetch error:', profileError);
    }

    // If no profile exists, create a basic one from auth user data
    if (!profile) {
      const basicProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
      return NextResponse.json(basicProfile);
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
