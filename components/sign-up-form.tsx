"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import { SocialAuth } from "@/components/auth";
import { useAppDispatch } from "@/app/stores/hooks";
import { setWebsiteUrl } from "@/app/stores/homeSlice";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  // Capture website URL from query parameter and store in Redux
  useEffect(() => {
    const websiteParam = searchParams.get('website');
    if (websiteParam) {
      dispatch(setWebsiteUrl(websiteParam));
    }
  }, [searchParams, dispatch]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      setIsLoading(false);
      return;
    }

    // Get the website URL from query parameters
    const websiteParam = searchParams.get('website');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${websiteParam ? '/audit' : '/dashboard'}`,
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });
      
      if (error) throw error;
      console.log("sign up success going to sign up success page");
      
      // Check if there's a stored website URL for auto-project creation
      const storedUrl = searchParams.get('website');
      if (storedUrl) {
        // Store the website URL in Redux for later use after email confirmation
        // The user will be redirected to audit after confirming email
        router.push("/auth/sign-up-success");
      } else {
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="card p-8">
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name Field */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                First Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10 h-12 input-field"
                />
              </div>
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Last Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-10 h-12 input-field"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 input-field"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 h-12 input-field"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-500" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Repeat Password Field */}
          <div className="space-y-2">
            <Label htmlFor="repeat-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="repeat-password"
                type={showRepeatPassword ? "text" : "password"}
                placeholder="Confirm your password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="pl-10 pr-12 h-12 input-field"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              >
                {showRepeatPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-500" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-700)]/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Requirements:</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                At least 8 characters long
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Mix of letters, numbers, and symbols
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="btn-primary w-full h-12 font-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Social Login Options */}
          <SocialAuth variant="signup" />

          {/* Terms and Privacy */}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-border-light dark:border-border-darkMode">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="text-primary font-medium hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
