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
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
      return NextResponse.json(basicProfile);
    }

    // Add avatar and provider info to existing profile
    const enhancedProfile = {
      ...profile,
      avatar_url: user.user_metadata?.avatar_url || profile.avatar_url || null,
      provider: user.app_metadata?.provider || profile.provider || null,
    };

    return NextResponse.json(enhancedProfile);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
