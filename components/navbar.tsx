import { Globe2 } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { AuthButton } from "./auth-button";
import { hasEnvVars } from "@/lib/utils";

interface NavbarProps {
  showPricing?: boolean;
  showAuth?: boolean;
  className?: string;
}

export function Navbar({ showPricing = true, showAuth = true, className = "" }: NavbarProps) {
  return (
    <header className={`border-b border-slate-200 dark:border-slate-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Globe2 className="h-6 w-6" />
            <span className="text-xl font-semibold">Website Audit</span>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {showPricing && (
            <Link 
              href="/pricing"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Pricing
            </Link>
          )}
          <ThemeSwitcher />
          {showAuth && hasEnvVars && (
            <div className="flex items-center gap-3">
              <Link 
                href="/auth/login"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/sign-up"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Sign Up
              </Link>
            </div>
          )}
          {showAuth && !hasEnvVars && <AuthButton />}
        </div>
      </div>
    </header>
  );
}
