"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          router.push("/auth/error?message=Authentication failed");
          return;
        }

        if (data.session) {
          // Get user data to check if profile needs to be updated
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user && !userError) {
            // Check if this is a new user or OAuth user that needs profile update
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            // If profile doesn't exist or needs update, create/update it
            if (profileError || !profile) {
              const userMetadata = user.user_metadata;
              const fullName = userMetadata?.full_name || userMetadata?.name || '';
              const firstName = userMetadata?.first_name || userMetadata?.given_name || '';
              const lastName = userMetadata?.last_name || userMetadata?.family_name || '';

              // Extract first and last name from full name if not provided separately
              let finalFirstName = firstName;
              let finalLastName = lastName;
              
              if (!firstName && !lastName && fullName) {
                const nameParts = fullName.split(' ');
                finalFirstName = nameParts[0] || '';
                finalLastName = nameParts.slice(1).join(' ') || '';
              }

              // Insert or update user profile
              const { error: upsertError } = await supabase
                .from('user_profiles')
                .upsert({
                  id: user.id,
                  email: user.email || '',
                  full_name: fullName,
                  first_name: finalFirstName,
                  last_name: finalLastName,
                }, {
                  onConflict: 'id'
                });

              if (upsertError) {
                console.error("Profile upsert error:", upsertError);
              }
            }
          }

          // Get the next parameter from the URL
          const next = searchParams.get("next") || "/dashboard";
          router.push(next);
        } else {
          // No session, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        router.push("/auth/error?message=An unexpected error occurred");
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Completing Authentication
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we complete your sign-in...
        </p>
      </Card>
    </div>
  );
}
