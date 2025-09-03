import { Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";

interface CTASectionProps {
  websiteUrl?: string;
}

export function CTASection({ websiteUrl }: CTASectionProps) {
  const { isAuthenticated, loading } = useAuth();

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full mb-6">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Website?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join thousands of businesses optimizing their online presence with AI-powered insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard"
                    className="bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      href={websiteUrl ? `/auth/sign-up?website=${encodeURIComponent(websiteUrl)}` : "/auth/sign-up"}
                      className="bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Start Free Audit Now
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                    <Link 
                      href={websiteUrl ? `/auth/login?website=${encodeURIComponent(websiteUrl)}` : "/auth/login"}
                      className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
