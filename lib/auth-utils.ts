import { createClient } from "@/lib/supabase/client";

export type SocialProvider = "google";

export interface SocialAuthOptions {
  provider: SocialProvider;
  redirectTo?: string;
}

export async function signInWithSocial({ provider, redirectTo }: SocialAuthOptions) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function signUpWithSocial({ provider, redirectTo }: SocialAuthOptions) {
  // For social auth, sign up and sign in are the same
  return signInWithSocial({ provider, redirectTo });
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }
  
  return user;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  return { success: true };
}
