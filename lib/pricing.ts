export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  auditLimit: number | 'unlimited';
  pageLimit: number;
  cta: string;
  href: string;
}

export interface PricingConfig {
  currency: string;
  locale: string;
  billingPeriod: string;
  plans: PricingPlan[];
}

// Function to get billing period text (exported version)
export function getBillingPeriodText(period: string): string {
  switch (period.toLowerCase()) {
    case 'month':
    case 'monthly':
      return 'per month';
    case 'year':
    case 'yearly':
    case 'annual':
      return 'per year';
    case 'week':
    case 'weekly':
      return 'per week';
    case 'day':
    case 'daily':
      return 'per day';
    default:
      return 'per month';
  }
}

// Helper function to get audit limit text
function getAuditLimitText(limit: number | 'unlimited'): string {
  if (limit === 'unlimited') {
    return 'Unlimited website audits';
  }
  return `Up to ${limit} website audits per month`;
}

// Helper function to get page limit text
function getPageLimitText(limit: number): string {
  if (limit >= 100) {
    return `Full website crawling (up to ${limit} pages)`;
  }
  return `Up to ${limit} pages per audit`;
}

// Default pricing configuration with environment variable support
const defaultPricing: PricingConfig = {
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'USD',
  locale: process.env.NEXT_PUBLIC_LOCALE || 'en-US',
  billingPeriod: process.env.NEXT_PUBLIC_BILLING_PERIOD || 'month',
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      price: parseInt(process.env.NEXT_PUBLIC_STARTER_PRICE || '29'),
      period: getBillingPeriodText(process.env.NEXT_PUBLIC_BILLING_PERIOD || 'month'),
      description: 'Perfect for small businesses and personal websites',
      features: [
        getAuditLimitText(parseInt(process.env.NEXT_PUBLIC_STARTER_AUDIT_LIMIT || '10')),
        'Basic SEO analysis',
        'Mobile responsiveness check',
        'Page speed insights',
        'Content quality analysis',
        'Basic reporting',
        'Email support'
      ],
      popular: false,
      auditLimit: parseInt(process.env.NEXT_PUBLIC_STARTER_AUDIT_LIMIT || '10'),
      pageLimit: parseInt(process.env.NEXT_PUBLIC_STARTER_PAGE_LIMIT || '5'),
      cta: 'Start Free Trial',
      href: '/auth/sign-up'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: parseInt(process.env.NEXT_PUBLIC_PROFESSIONAL_PRICE || '79'),
      period: getBillingPeriodText(process.env.NEXT_PUBLIC_BILLING_PERIOD || 'month'),
      description: 'Ideal for growing businesses and agencies',
      features: [
        getAuditLimitText(parseInt(process.env.NEXT_PUBLIC_PROFESSIONAL_AUDIT_LIMIT || '50')),
        'Advanced SEO analysis',
        'Multi-device testing',
        'Image optimization analysis',
        'Link analysis & broken link detection',
        'Social media preview analysis',
        'Custom instructions support',
        'Priority email support',
        'API access'
      ],
      popular: true,
      auditLimit: parseInt(process.env.NEXT_PUBLIC_PROFESSIONAL_AUDIT_LIMIT || '50'),
      pageLimit: parseInt(process.env.NEXT_PUBLIC_PROFESSIONAL_PAGE_LIMIT || '20'),
      cta: 'Start Free Trial',
      href: '/auth/sign-up'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: parseInt(process.env.NEXT_PUBLIC_ENTERPRISE_PRICE || '199'),
      period: getBillingPeriodText(process.env.NEXT_PUBLIC_BILLING_PERIOD || 'month'),
      description: 'For large organizations and enterprise clients',
      features: [
        getAuditLimitText(process.env.NEXT_PUBLIC_ENTERPRISE_AUDIT_LIMIT === 'unlimited' ? 'unlimited' : parseInt(process.env.NEXT_PUBLIC_ENTERPRISE_AUDIT_LIMIT || '100')),
        getPageLimitText(parseInt(process.env.NEXT_PUBLIC_ENTERPRISE_PAGE_LIMIT || '100')),
        'Advanced security analysis',
        'Brand consistency verification',
        'Custom reporting templates',
        'White-label reports',
        'Dedicated account manager',
        'Phone & priority support',
        'Custom integrations',
        'Team collaboration tools'
      ],
      popular: false,
      auditLimit: process.env.NEXT_PUBLIC_ENTERPRISE_AUDIT_LIMIT === 'unlimited' ? 'unlimited' : parseInt(process.env.NEXT_PUBLIC_ENTERPRISE_AUDIT_LIMIT || '100'),
      pageLimit: parseInt(process.env.NEXT_PUBLIC_ENTERPRISE_PAGE_LIMIT || '100'),
      cta: 'Contact Sales',
      href: '/auth/sign-up'
    }
  ]
};

// Function to get pricing configuration
export function getPricingConfig(): PricingConfig {
  return defaultPricing;
}

// Function to get a specific plan by ID
export function getPlanById(planId: string): PricingPlan | undefined {
  return defaultPricing.plans.find(plan => plan.id === planId);
}

// Function to get plan display price with currency formatting
export function getPlanDisplayPrice(plan: PricingPlan): string {
  const formatter = new Intl.NumberFormat(defaultPricing.locale, {
    style: 'currency',
    currency: defaultPricing.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(plan.price);
}

// Function to get plan by name (case-insensitive)
export function getPlanByName(planName: string): PricingPlan | undefined {
  return defaultPricing.plans.find(plan => 
    plan.name.toLowerCase() === planName.toLowerCase()
  );
}

// Function to get current user's plan (for profile page)
export function getCurrentUserPlan(): PricingPlan {
  // This would typically fetch from user's subscription data
  // For now, return Professional as default
  return getPlanById('professional') || defaultPricing.plans[1];
}
