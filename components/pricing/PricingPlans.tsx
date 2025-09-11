'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Users, 
  Building, 
  Crown,
  ArrowRight,
  Clock,
  Shield,
  Headphones
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  enterprise?: boolean;
  costPerUser: number;
  targetMargin: number;
  maxProjects: number;
  maxPages: number;
  screenshots: boolean;
  aiAnalysis: boolean;
  queuePriority: number;
  support: string;
  sla?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for trying out our web audit tool',
    features: [
      '3 projects',
      '50 pages per project',
      'Basic SEO analysis',
      'Page speed check',
      'Mobile responsiveness',
      'One-time site analysis',
      'Community support'
    ],
    limitations: [
      'No screenshots',
      'No AI analysis',
      '15-30 min queue wait',
      'Limited to 100 API calls/month'
    ],
    costPerUser: 0.0,
    targetMargin: 0.0,
    maxProjects: 3,
    maxPages: 50,
    screenshots: false,
    aiAnalysis: false,
    queuePriority: 4,
    support: 'Community'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    interval: 'month',
    description: 'Ideal for freelancers and small businesses',
    features: [
      '10 projects',
      '200 pages per project',
      'Full SEO analysis',
      'Screenshot generation',
      'AI content analysis',
      'UI/UX analysis',
      'Performance metrics',
      'Priority queue (5-10 min)',
      'Unlimited crawls',
      'Advanced reports',
      'Email support'
    ],
    limitations: [
      'Throttled heavy usage',
      'Limited to 1000 API calls/month'
    ],
    popular: true,
    costPerUser: 0.3,
    targetMargin: 0.7,
    maxProjects: 10,
    maxPages: 200,
    screenshots: true,
    aiAnalysis: true,
    queuePriority: 2,
    support: 'Email'
  },
  {
    id: 'business',
    name: 'Business',
    price: 29,
    interval: 'month',
    description: 'Perfect for teams and growing businesses',
    features: [
      '50 projects',
      '500 pages per project',
      'Everything in Pro',
      'Team collaboration',
      'Advanced analytics',
      'API access',
      'Custom reports',
      'Priority queue (1-3 min)',
      'SLA guarantee (99.9%)',
      'Priority email support',
      'Integrations',
      'Up to 5 team members'
    ],
    limitations: [
      'Limited to 5000 API calls/month'
    ],
    costPerUser: 0.2,
    targetMargin: 0.8,
    maxProjects: 50,
    maxPages: 500,
    screenshots: true,
    aiAnalysis: true,
    queuePriority: 1,
    support: 'Priority Email',
    sla: '99.9%'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited projects',
      'Unlimited pages',
      'Everything in Business',
      'Dedicated support',
      'Custom integrations',
      'On-premise options',
      'VPC deployment',
      'Volume discounts',
      'White-label options',
      'Custom SLA',
      'Immediate processing',
      'Unlimited team members'
    ],
    limitations: [],
    enterprise: true,
    costPerUser: 0.1,
    targetMargin: 0.9,
    maxProjects: -1,
    maxPages: -1,
    screenshots: true,
    aiAnalysis: true,
    queuePriority: 1,
    support: 'Dedicated',
    sla: '99.99%'
  }
];

export function PricingPlans() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap className="h-6 w-6" />;
      case 'pro': return <Star className="h-6 w-6" />;
      case 'business': return <Building className="h-6 w-6" />;
      case 'enterprise': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'border-gray-200';
      case 'pro': return 'border-blue-500 ring-2 ring-blue-500/20';
      case 'business': return 'border-purple-500';
      case 'enterprise': return 'border-gold-500';
      default: return 'border-gray-200';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Highest Priority';
      case 2: return 'High Priority';
      case 4: return 'Standard Priority';
      default: return 'Standard Priority';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 4: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the perfect plan for your needs. No hidden fees, no surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const displayPrice = billingInterval === 'yearly' && plan.id !== 'enterprise' 
              ? Math.round(plan.price * 10) / 10 // 17% discount
              : plan.price;
            
            const yearlySavings = billingInterval === 'yearly' && plan.id !== 'enterprise'
              ? Math.round(plan.price * 12 * 0.17)
              : 0;

            return (
              <Card 
                key={plan.id} 
                className={`relative ${getPlanColor(plan.id)} ${
                  plan.popular ? 'scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {plan.enterprise && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-3 py-1">
                      Enterprise
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      {getPlanIcon(plan.id)}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        ${displayPrice}
                      </span>
                      <span className="text-gray-600 ml-1">/{plan.interval}</span>
                    </div>
                    {yearlySavings > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${yearlySavings}/year
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Plan Stats */}
                  <div className="mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projects:</span>
                      <span className="font-medium">
                        {plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pages:</span>
                      <span className="font-medium">
                        {plan.maxPages === -1 ? 'Unlimited' : plan.maxPages}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queue Priority:</span>
                      <Badge className={getPriorityColor(plan.queuePriority)}>
                        {getPriorityLabel(plan.queuePriority)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Support:</span>
                      <span className="font-medium">{plan.support}</span>
                    </div>
                    {plan.sla && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">SLA:</span>
                        <span className="font-medium text-green-600">{plan.sla}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-medium text-gray-900">Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h4 className="font-medium text-gray-900">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start">
                            <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : plan.enterprise
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {plan.id === 'free' ? 'Get Started Free' : 
                     plan.enterprise ? 'Contact Sales' : 'Start Free Trial'}
                    {!plan.enterprise && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  {/* Additional Info */}
                  {plan.id === 'free' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      No credit card required
                    </p>
                  )}
                  
                  {plan.id === 'pro' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      14-day free trial, then ${plan.price}/month
                    </p>
                  )}
                  
                  {plan.id === 'business' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      14-day free trial, then ${plan.price}/month
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-2">
                What's included in the free plan?
              </h4>
              <p className="text-gray-600 text-sm">
                The free plan includes 3 projects with up to 50 pages each, basic SEO analysis, 
                and community support. Perfect for trying out our tool.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and we'll prorate any billing differences.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-2">
                What's the difference between Pro and Business?
              </h4>
              <p className="text-gray-600 text-sm">
                Business includes team collaboration, API access, custom reports, SLA guarantee, 
                and priority support. Pro is designed for individual users.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-2">
                Do you offer custom pricing?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes! Our Enterprise plan offers custom pricing, dedicated support, and 
                on-premise deployment options for large organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
