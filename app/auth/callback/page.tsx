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
          // Trial initialization will be handled by the TrialInitializer component
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
