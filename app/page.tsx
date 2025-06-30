import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Globe2, Search, BarChart3, Shield, Zap, CheckCircle } from "lucide-react";
import { NavButton } from "@/components/ui/nav-button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is already logged in and redirect to dashboard
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (data?.user) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: Search,
      title: "Intelligent Crawling",
      description: "Automatically discover and crawl all internal pages of your website"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Analysis",
      description: "Grammar, SEO, performance, accessibility, and content quality checks"
    },
    {
      icon: Shield,
      title: "AI-Powered Insights",
      description: "Advanced LLM analysis for image relevance, UI quality, and content alignment"
    },
    {
      icon: Zap,
      title: "Detailed Reports",
      description: "Get actionable insights with comprehensive audit reports"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
            <Globe2 className="h-6 w-6" />
            <span className="text-xl font-semibold">Web Audit</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {hasEnvVars && <AuthButton />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Audit Your Website with
                <span className="text-primary"> AI-Powered</span> Analysis
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get comprehensive insights into your website's content quality, SEO performance, 
                accessibility, and more with our intelligent web auditing platform.
              </p>
              
              {hasEnvVars ? (
                <div className="flex gap-4 justify-center">
                  <NavButton href="/auth/sign-up" size="lg" className="px-8">
                    Start Free Audit
                  </NavButton>
                  <NavButton href="/auth/login" variant="outline" size="lg" className="px-8">
                    Sign In
                  </NavButton>
                </div>
              ) : (
                <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center justify-center max-w-md mx-auto">
                  <Globe2 size="16" />
                  Please set up your Supabase environment variables to get started
                </div>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* How it Works */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full text-white font-semibold mb-4">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Enter Your URL</h3>
                  <p className="text-sm text-muted-foreground">
                    Simply input your website's base URL to get started
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full text-white font-semibold mb-4">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI crawls and analyzes every page for multiple quality factors
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full text-white font-semibold mb-4">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Get Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed reports with actionable insights and recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
          </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Built with Next.js & Supabase</p>
        </div>
        </footer>
      </div>
  );
}
