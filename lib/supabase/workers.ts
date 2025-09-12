import { createClient } from '@supabase/supabase-js';

// Standalone Supabase client for workers (no Next.js context)
export function createWorkerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Return null if environment variables are not set (workers will use default configs)
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
    console.warn('⚠️ Supabase environment variables not set, using default queue configurations');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const workerSupabase = createWorkerSupabaseClient();
