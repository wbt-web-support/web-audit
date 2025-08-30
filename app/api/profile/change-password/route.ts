import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in password change API:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found in password change API');
      return NextResponse.json({ 
        error: 'No authenticated user found' 
      }, { status: 401 });
    }

    console.log('User authenticated:', { id: user.id, email: user.email, provider: user.app_metadata?.provider });

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword, isOAuthUser } = body;

    // Check if user is OAuth user
    const isOAuth = user.app_metadata?.provider;
    
    if (isOAuth && !isOAuthUser) {
      return NextResponse.json({ error: 'OAuth users cannot change password through this method' }, { status: 400 });
    }

    // For OAuth users, skip current password verification
    if (!isOAuth) {
      // Validation for email/password users
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    } else {
      // For OAuth users, only validate new password
      if (!newPassword || !confirmPassword) {
        return NextResponse.json({ error: 'New password and confirmation are required' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }
    }

    // Update password
    console.log('Attempting to update password for user:', user.id);
    
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update password', 
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('Password updated successfully for user:', user.id);
    return NextResponse.json({ 
      message: 'Password updated successfully',
      user: { id: updateData.user?.id, email: updateData.user?.email }
    });

  } catch (error) {
    console.error('Password change API error:', error);
    return NextResponse.json({ 
      error: 'Failed to change password', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
