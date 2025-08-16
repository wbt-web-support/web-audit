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

  const coreFeatures = [
    {
      icon: Search,
      title: "Smart Website Crawling",
      description: "Single page or full website crawling with intelligent depth analysis up to 50 pages"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Site Overview",
      description: "Total pages, images, internal/external links, and content structure analysis"
    },
    {
      icon: FileText,
      title: "AI Grammar & Content Check",
      description: "Advanced LLM analysis for spelling, grammar, readability, and content quality"
    },
    {
      icon: TrendingUp,
      title: "SEO & Performance Analysis",
      description: "PageSpeed Insights, Core Web Vitals, accessibility, and optimization recommendations"
    }
  ];

  const advancedFeatures = [
    {
      icon: Smartphone,
      title: "Multi-Device UI Testing",
      description: "Screenshot analysis for mobile, tablet, and desktop with responsive design validation"
    },
    {
      icon: Image,
      title: "Image & Link Analysis",
      description: "Comprehensive image optimization, alt text, and broken link detection"
    },
    {
      icon: Share2,
      title: "Social Media Preview",
      description: "Open Graph, Twitter Cards, and social sharing optimization analysis"
    },
    {
      icon: Code,
      title: "WordPress & Analytics",
      description: "GTM, gtag, ClickCease detection and WordPress-specific optimizations"
    }
  ];

  const businessFeatures = [
    {
      icon: ShieldCheck,
      title: "Brand Consistency Check",
      description: "Verify company information, contact details, and brand messaging across all pages"
    },
    {
      icon: LinkIcon,
      title: "Hidden URL Discovery",
      description: "Find and analyze custom URLs, sitemaps, and hidden page structures"
    },
    {
      icon: AlertTriangle,
      title: "Security & Compliance",
      description: "Stripe key detection, HTTPS validation, and security header analysis"
    },
    {
      icon: MessageSquare,
      title: "Custom Instructions",
      description: "Tailored analysis based on your specific business requirements and goals"
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

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 sm:mb-8">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Trusted by 10,000+ companies worldwide</span>
              <span className="sm:hidden">Trusted by 10,000+ companies</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="block sm:inline">Audit Your Website with</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600"> AI-Powered</span>
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
                  className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:from-primary/90 hover:to-blue-600/90"
                >
                  Start Free Audit
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link 
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center">
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
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 sm:p-8">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">
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

      {/* Core Features Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Core Website Analysis Features</h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to understand and optimize your website's performance
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {coreFeatures.map((feature, index) => (
                <div key={index} className="group text-center p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Advanced Analysis & Testing</h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Professional-grade tools for comprehensive website optimization
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {advancedFeatures.map((feature, index) => (
                <div key={index} className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Business Features Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Business & Marketing Features</h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Specialized tools for business growth and marketing optimization
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {businessFeatures.map((feature, index) => (
                <div key={index} className="group text-center p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 sm:mb-16">How It Works in 3 Simple Steps</h2>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              <div className="relative">
                <div className="text-center p-6 sm:p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-xl sm:text-2xl mb-6 shadow-lg">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">Enter Your URL</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Input your website URL and choose between single page or full website crawling
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <div className="relative">
                <div className="text-center p-6 sm:p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-xl sm:text-2xl mb-6 shadow-lg">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">AI-Powered Analysis</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Our AI crawls pages, analyzes content, checks performance, and tests across all devices
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <div className="text-center p-6 sm:p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full text-white font-bold text-xl sm:text-2xl mb-6 shadow-lg">
                  3
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

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
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
                   className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:from-primary/90 hover:to-blue-600/90"
                 >
                   Start Free Audit Now
                   <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                 </Link>
                 <Link 
                   href="/auth/login"
                   className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary transition-all duration-300"
                 >
                   Sign In
                 </Link>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base">&copy; 2024 Web Audit. All rights reserved. • Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
