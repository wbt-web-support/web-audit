import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { 
  Globe2, 
  Search, 
  BarChart3, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Star, 
  ChevronDown, 
  Play,
  Smartphone,
  Monitor,
  Tablet,
  Target,
  FileText,
  Link as LinkIcon,
  Image,
  Eye,
  TrendingUp,
  Globe,
  ShieldCheck,
  MessageSquare,
  Share2,
  Code,
  Palette,
  Gauge,
  Users,
  Search as SearchIcon,
  BookOpen,
  AlertTriangle,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (data?.user) {
    redirect("/dashboard");
  }



  const allFeatures = [
    // Core Features
    {
      icon: Search,
      title: "Smart Website Crawling",
      description: "Single page or full website crawling with intelligent depth analysis up to 50 pages",
      category: "core"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Site Overview",
      description: "Total pages, images, internal/external links, and content structure analysis",
      category: "core"
    },
    {
      icon: FileText,
      title: "AI Grammar & Content Check",
      description: "Advanced LLM analysis for spelling, grammar, readability, and content quality",
      category: "core"
    },
    {
      icon: TrendingUp,
      title: "SEO & Performance Analysis",
      description: "PageSpeed Insights, Core Web Vitals, accessibility, and optimization recommendations",
      category: "core"
    },
    // Advanced Features
    {
      icon: Smartphone,
      title: "Multi-Device UI Testing",
      description: "Screenshot analysis for mobile, tablet, and desktop with responsive design validation",
      category: "advanced"
    },
    {
      icon: Image,
      title: "Image & Link Analysis",
      description: "Comprehensive image optimization, alt text, and broken link detection",
      category: "advanced"
    },
    {
      icon: Share2,
      title: "Social Media Preview",
      description: "Open Graph, Twitter Cards, and social sharing optimization analysis",
      category: "advanced"
    },
    {
      icon: Code,
      title: "WordPress & Analytics",
      description: "GTM, gtag, ClickCease detection and WordPress-specific optimizations",
      category: "advanced"
    },
    // Business Features
    {
      icon: ShieldCheck,
      title: "Brand Consistency Check",
      description: "Verify company information, contact details, and brand messaging across all pages",
      category: "business"
    },
    {
      icon: LinkIcon,
      title: "Hidden URL Discovery",
      description: "Find and analyze custom URLs, sitemaps, and hidden page structures",
      category: "business"
    },
    {
      icon: AlertTriangle,
      title: "Security & Compliance",
      description: "Stripe key detection, HTTPS validation, and security header analysis",
      category: "business"
    },
    {
      icon: MessageSquare,
      title: "Custom Instructions",
      description: "Tailored analysis based on your specific business requirements and goals",
      category: "business"
    }
  ];

  const stats = [
    { number: "50+", label: "Pages Per Crawl" },
    { number: "100%", label: "Mobile Responsive" },
    { number: "AI-Powered", label: "Content Analysis" },
    { number: "Real-time", label: "Progress Tracking" }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="h-6 w-6" />
            <span className="text-xl font-semibold">Website Audit</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {hasEnvVars && (
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
            {!hasEnvVars && <AuthButton />}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6 sm:mb-8">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Trusted by companies worldwide</span>
              <span className="sm:hidden">Trusted by companies</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="block sm:inline">Audit Your Website with</span>
              <span className="text-gradient"> AI-Powered</span>
              <span className="block sm:inline"> Analysis</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed px-4">
              Get comprehensive insights into your website's performance, SEO, accessibility, 
              content quality, and user experience across all devices with our intelligent web auditing platform.
            </p>
            
            {hasEnvVars ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
                <Link 
                  href="/auth/sign-up"
                  className="btn-primary inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg"
                >
                  Start Free Audit
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link 
                  href="/auth/login"
                  className="btn-secondary inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="bg-accent text-sm p-4 px-6 rounded-lg text-foreground flex gap-3 items-center justify-center max-w-md mx-auto mb-12">
                <Globe2 size="16" />
                <span className="text-xs sm:text-sm">Please set up your Supabase environment variables to get started</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white ml-0.5" />
                </div>
                <span className="text-xs sm:text-sm">Watch Demo (2 min)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 sm:p-8">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* How It Works Section */}
       <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 sm:mb-16">How It Works in 3 Simple Steps</h2>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              <div className="relative">
                <div className="text-center p-6 sm:p-8">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24  rounded-full text-white font-bold text-xl sm:text-2xl shadow-[var(--shadow-lg)] relative z-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                        1
                      </div>
                    </div>
                    <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-400/30 to-blue-600/30 rounded-full blur-xl"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">Enter Your URL</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Input your website URL and choose between single page or full website crawling
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <div className="w-12 h-12   rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="text-center p-6 sm:p-8">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24  rounded-full text-white font-bold text-xl sm:text-2xl shadow-[var(--shadow-lg)] relative z-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                        2
                      </div>
                    </div>
                    <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-400/30 to-blue-600/30 rounded-full blur-xl"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">AI-Powered Analysis</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Our AI crawls pages, analyzes content, checks performance, and tests across all devices
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <div className="w-12 h-12   rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center p-6 sm:p-8">
                <div className="relative mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24  rounded-full text-white font-bold text-xl sm:text-2xl shadow-[var(--shadow-lg)] relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      3
                    </div>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-400/30 to-blue-600/30 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Get Actionable Insights</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Receive comprehensive reports with detailed recommendations for improvement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.4),rgba(0,0,0,0.8))]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Complete Website Analysis
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Everything you need to understand, optimize, and grow your website's performance with AI-powered insights
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              {allFeatures.map((feature, index) => (
                <div key={index} className="group relative h-full">
                  {/* Card */}
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 h-full flex flex-col">
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    
                    {/* Icon Container */}
                    <div className="relative mb-4 sm:mb-6 flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-secondary/10 via-primary/10 to-secondary/10 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl">
                        <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-secondary" />
                      </div>
                      {/* Category Badge */}
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          feature.category === 'core' 
                            ? 'bg-secondary/10 text-secondary' 
                            : feature.category === 'advanced'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-success/10 text-success'
                        }`}>
                          {feature.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative flex-1 flex flex-col">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white group-hover:text-secondary transition-colors duration-300 line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-1">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            {/* <div className="text-center mt-16 sm:mt-20">
              <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>All features included in every plan</span>
              </div>
            </div> */}
          </div>
        </div>
      </section>

     

      {/* CTA Section */}
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
                         {hasEnvVars && (
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Link 
                   href="/auth/sign-up"
                   className="bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                 >
                   Start Free Audit Now
                   <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                 </Link>
                 <Link 
                   href="/auth/login"
                   className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                 >
                   Sign In
                 </Link>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base">&copy; 2024 Web Audit. All rights reserved. • Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
