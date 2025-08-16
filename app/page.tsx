import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Globe2, Search, BarChart3, Shield, Zap, CheckCircle, ArrowRight, Star, ChevronDown, Play } from "lucide-react";
import { NavButton } from "@/components/ui/nav-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (data?.user) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: Search,
      title: "Intelligent Crawling",
      description: "Automatically discover and crawl all internal pages of your website with smart depth analysis"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Analysis",
      description: "Grammar, SEO, performance, accessibility, and content quality checks in one platform"
    },
    {
      icon: Shield,
      title: "AI-Powered Insights",
      description: "Advanced LLM analysis for image relevance, UI quality, and content alignment"
    },
    {
      icon: Zap,
      title: "Detailed Reports",
      description: "Get actionable insights with comprehensive audit reports and recommendations"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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

      {/* Hero Section - 100vh */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              Trusted by 10,000+ companies worldwide
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Audit Your Website with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600"> AI-Powered</span> Analysis
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Get comprehensive insights into your website's content quality, SEO performance, 
              accessibility, and more with our intelligent web auditing platform.
            </p>
            
            {hasEnvVars ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <NavButton href="/auth/sign-up" size="lg" className="px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Start Free Audit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </NavButton>
                <NavButton href="/auth/login" variant="outline" size="lg" className="px-10 py-4 text-lg font-semibold border-2 hover:bg-primary hover:text-white transition-all duration-300">
                  Sign In
                </NavButton>
              </div>
            ) : (
              <div className="bg-accent text-sm p-4 px-6 rounded-lg text-foreground flex gap-3 items-center justify-center max-w-md mx-auto mb-12">
                <Globe2 size="16" />
                Please set up your Supabase environment variables to get started
              </div>
            )}

            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Play className="h-5 w-5 text-white ml-1" />
                </div>
                <span>Watch Demo (2 min)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section - 100vh */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features for Modern Web Auditing</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to analyze, optimize, and improve your website's performance
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group text-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section - 100vh */}
      <section className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-16">How It Works in 3 Simple Steps</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative">
                <div className="text-center p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-2xl mb-6 shadow-lg">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Enter Your URL</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Simply input your website's base URL and choose your analysis preferences
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="relative">
                <div className="text-center p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-2xl mb-6 shadow-lg">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AI crawls and analyzes every page for multiple quality factors and insights
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-2xl mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Get Results</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive detailed reports with actionable insights and recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Web Audit. All rights reserved. • Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
