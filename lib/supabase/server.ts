import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Global client instance for connection reuse
let globalSupabaseClient: ReturnType<typeof createServerClient> | null = null;

export async function createClient() {
  // Return cached client if available (connection pooling)
  if (globalSupabaseClient) {
    return globalSupabaseClient;
  }

  const cookieStore = await cookies();
  
  // Only log cookies in development
  if (process.env.NODE_ENV === 'development') {
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-')
    );
    
    console.log('Server client: Found Supabase cookies:', 
      supabaseCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' }))
    );
  }

  globalSupabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user projects.
          }
        },
      },
      // Optimize for high concurrency
      global: {
        headers: {
          'Connection': 'keep-alive',
        },
      },
    },
  );

  return globalSupabaseClient;
}

// Function to reset client (useful for testing or when needed)
export function resetClient() {
  globalSupabaseClient = null;
}
