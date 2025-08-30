import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Profile API auth error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('Profile API: No user found');
      return NextResponse.json({ 
        error: 'No authenticated user found' 
      }, { status: 401 });
    }

    console.log('Profile API: User authenticated:', { 
      id: user.id, 
      email: user.email, 
      provider: user.app_metadata?.provider 
    });

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
        role: 'user', // Default role
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        auth_method: user.app_metadata?.provider || 'email',
        has_password: !!user.app_metadata?.provider || false,
      };
      return NextResponse.json(basicProfile);
    }

    // Add auth method info to existing profile
    const profileWithAuth = {
      ...profile,
      auth_method: user.app_metadata?.provider || 'email',
      has_password: !user.app_metadata?.provider,
    };

    return NextResponse.json(profileWithAuth);

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name } = body;

    if (!full_name || typeof full_name !== 'string') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: full_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return NextResponse.json(updatedProfile);
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: full_name.trim(),
          role: 'user',
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json(newProfile);
    }

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
