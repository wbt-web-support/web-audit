'use client';

import { useState } from "react";
import { 
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
import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { setWebsiteUrl } from "./stores/homeSlice";
import { HomeUrlDisplay } from "../components/home-url-display";
import { Navbar } from "../components/navbar";
import { CTASection } from "../components/cta-section";

export default function Home() {
  const dispatch = useAppDispatch();
  const websiteUrl = useAppSelector((state) => state.home.websiteUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    
    setIsSubmitting(true);
    
    // Store the website URL in Redux
    dispatch(setWebsiteUrl(websiteUrl.trim()));
    
    // Redirect to sign-up with the website URL
    const signUpUrl = `/auth/sign-up?website=${encodeURIComponent(websiteUrl.trim())}`;
    window.location.href = signUpUrl;
  };

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
      <HomeUrlDisplay />
      <Navbar websiteUrl={websiteUrl} />
      
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
            
            <div className="max-w-2xl mx-auto mb-12 px-4">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  type="url"
                  placeholder="Enter your website URL (e.g., https://example.com)"
                  value={websiteUrl}
                  onChange={(e) => dispatch(setWebsiteUrl(e.target.value))}
                  className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Free Audit
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </button>
              </form>
              
            </div>

            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
              
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
          </div>
        </div>
      </section>

      <CTASection websiteUrl={websiteUrl} />

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base">&copy; 2024 Web Audit. All rights reserved. • Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
