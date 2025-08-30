import { createClient } from "@/lib/supabase/server";

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getCurrentUserRole(): Promise<'user' | 'admin' | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return 'user'; // Default to user role
    }

    return profile.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to user role
  }
}

export async function requireAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}
