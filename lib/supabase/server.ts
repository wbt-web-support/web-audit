import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  
  // Log cookies for debugging (be careful with sensitive data)
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('sb-')
  );
  
  console.log('Server client: Found Supabase cookies:', 
    supabaseCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' }))
  );

  return createServerClient(
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
    },
  );
}
