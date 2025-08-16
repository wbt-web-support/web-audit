"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signInWithSocial, signUpWithSocial } from "@/lib/auth-utils";

interface SocialAuthProps {
  className?: string;
  variant?: "login" | "signup";
}

export function SocialAuth({ className, variant = "login" }: SocialAuthProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google") => {
    setIsLoading(provider);
    try {
      if (variant === "signup") {
        await signUpWithSocial({ provider });
      } else {
        await signInWithSocial({ provider });
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      // Error will be handled by Supabase redirect
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          className="h-11 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading === "google"}
        >
          {isLoading === "google" ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {isLoading === "google" ? "Connecting..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
