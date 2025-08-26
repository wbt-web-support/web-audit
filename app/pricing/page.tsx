"use client";

import { CheckCircle, Star, ArrowRight, Zap, Shield, Users, Globe2 } from "lucide-react";
import Link from "next/link";
import { getPricingConfig, getPlanDisplayPrice } from '@/lib/pricing';
import { BillingToggle } from '@/components/ui/billing-toggle';
import { useState } from 'react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('month');
  const { plans: basePlans, currency, locale } = getPricingConfig();

  // Calculate prices based on billing period
  const yearlyDiscountPercent = parseInt(process.env.NEXT_PUBLIC_YEARLY_DISCOUNT_PERCENT || '20');
  const getPlanPrice = (basePrice: number, period: string) => {
    if (period === 'year' || period === 'yearly' || period === 'annual') {
      // Apply yearly discount for yearly billing
      const discountMultiplier = (100 - yearlyDiscountPercent) / 100;
      return Math.round(basePrice * 12 * discountMultiplier);
    }
    return basePrice;
  };

  const plans = basePlans.map(plan => ({
    ...plan,
    price: getPlanPrice(plan.price, billingPeriod),
    period: billingPeriod === 'year' || billingPeriod === 'yearly' || billingPeriod === 'annual' 
      ? 'per year' 
      : 'per month'
  }));

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get comprehensive audit results in minutes, not hours"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data is protected with bank-level security standards"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share reports and collaborate with your team seamlessly"
    },
    {
      icon: Globe2,
      title: "Global Coverage",
      description: "Audit websites from anywhere in the world"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Globe2 className="h-6 w-6" />
              <span className="text-xl font-semibold">Website Audit</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              href="/pricing"
              className="text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Pricing
            </Link>
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Simple, Transparent
              <span className="text-gradient block">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Choose the perfect plan for your website auditing needs. All plans include a {process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS || '14'}-day free trial.
            </p>
            
            {/* Billing Toggle */}
                         <BillingToggle
               billingPeriod={billingPeriod}
               onBillingPeriodChange={setBillingPeriod}
               showYearlyDiscount={true}
               yearlyDiscountPercent={yearlyDiscountPercent}
               className="mb-8"
             />
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                  plan.popular 
                    ? 'border-blue-500 scale-105' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{getPlanDisplayPrice(plan)}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={plan.href}
                    className={`w-full block text-center py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for
              <span className="text-gradient"> Professional Audits</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform provides comprehensive tools and insights to help you optimize your website for better performance and user experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked
              <span className="text-gradient"> Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about our website auditing platform
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">How does the free trial work?</h3>
              <p className="text-muted-foreground">
                All plans include a 14-day free trial with full access to all features. No credit card required to start. 
                You can upgrade, downgrade, or cancel at any time during the trial period.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Can I change my plan later?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate your billing accordingly.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">What happens if I exceed my monthly limit?</h3>
              <p className="text-muted-foreground">
                We'll notify you when you're approaching your limit. You can either upgrade your plan 
                or wait until the next billing cycle to continue auditing.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Do you offer team collaboration features?</h3>
              <p className="text-muted-foreground">
                Yes! Our Professional and Enterprise plans include team collaboration tools, 
                allowing you to share reports and work together with your team members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by
              <span className="text-gradient"> Professionals</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what our customers say about their experience with Website Audit
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "Website Audit has transformed how we approach SEO. The AI-powered insights are incredibly accurate 
                and have helped us improve our search rankings significantly."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">SEO Manager, TechCorp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "The comprehensive reports and actionable recommendations have made website optimization 
                so much easier. Our clients love the detailed insights we can provide."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Mike Chen</p>
                  <p className="text-sm text-muted-foreground">Digital Agency Owner</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "As a small business owner, I needed an affordable way to audit my website. 
                This platform gives me enterprise-level insights at a fraction of the cost."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold">Lisa Rodriguez</p>
                  <p className="text-sm text-muted-foreground">E-commerce Entrepreneur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your
              <span className="text-gradient"> Website Audit?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses optimizing their websites with our AI-powered analysis platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/sign-up"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
