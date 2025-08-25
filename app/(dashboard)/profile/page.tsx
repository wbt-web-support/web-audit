'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditProject } from '@/lib/types/database';
import { getPricingConfig, PricingPlan } from '@/lib/pricing';
import {
  ProfileHeader,
  ProfileStats,
  RecentProjects,
  SubscriptionTab,
  SecurityTab,
  BillingTab,
  HelpTab,
  StatusMessage
} from '@/components/profile';


interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  provider?: string | null;
}

interface ProfileStats {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
}

interface SubscriptionPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  current: boolean;
  popular?: boolean;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: string;
  amount_numeric: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  plan_name: string;
  billing_period: string;
  invoice_url?: string;
  payment_method?: string;
}

interface BillingHistoryResponse {
  billingHistory: BillingHistoryItem[];
  totalSpent: number;
  totalPayments: number;
}

interface UserPlan {
  id: string;
  planId: string;
  planName: string;
  isActive: boolean;
  purchasedAt: string;
  expiresAt?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [billingPeriod, setBillingPeriod] = useState('month');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [billingHistoryLoading, setBillingHistoryLoading] = useState(false);
  const [billingStats, setBillingStats] = useState({ totalSpent: 0, totalPayments: 0, lastPaymentDate: 'Never' });
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const { plans: basePlans } = getPricingConfig();

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

  useEffect(() => {
    fetchProfileData();
    
    // Check for success/cancel messages in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh subscription data after successful payment
      setTimeout(() => {
        fetchProfileData();
      }, 1000);
    } else if (urlParams.get('canceled') === 'true') {
      setShowCancelMessage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch billing history when billing tab is selected
  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBillingHistory();
    }
  }, [activeTab]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile data
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch projects data
      const projectsResponse = await fetch('/api/profile/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Fetch stats data
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch subscription data
      const subscriptionResponse = await fetch('/api/profile/subscription');
      console.log('Subscription response status:', subscriptionResponse.status);
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        console.log('Subscription data:', subscriptionData);
        setSubscription(subscriptionData);
        // Set selected plan based on current subscription
        if (subscriptionData.name && subscriptionData.name !== 'Free') {
          setSelectedPlan(subscriptionData.name.toLowerCase());
        }
      } else {
        console.error('Failed to fetch subscription:', await subscriptionResponse.text());
      }

      // Fetch user plans data
      const userPlansResponse = await fetch('/api/profile/user-plans');
      if (userPlansResponse.ok) {
        const userPlansData = await userPlansResponse.json();
        setUserPlans(userPlansData);
      } else {
        console.error('Failed to fetch user plans:', await userPlansResponse.text());
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    setBillingHistoryLoading(true);
    try {
      const response = await fetch('/api/profile/billing-history');
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.billingHistory || data);
        
        // Calculate stats if not provided by API
        if (data.totalSpent !== undefined && data.totalPayments !== undefined) {
          setBillingStats({ 
            totalSpent: data.totalSpent, 
            totalPayments: data.totalPayments,
            lastPaymentDate: data.lastPaymentDate || 'Never'
          });
        } else {
          // Fallback calculation
          const completedPayments = (data.billingHistory || data).filter((item: BillingHistoryItem) => item.status === 'completed');
          const totalSpent = completedPayments.reduce((sum: number, item: BillingHistoryItem) => sum + item.amount_numeric, 0);
          const totalPayments = completedPayments.length;
          
          // Calculate last payment date for fallback
          const lastPayment = completedPayments.length > 0 
            ? completedPayments.sort((a: BillingHistoryItem, b: BillingHistoryItem) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;
          const lastPaymentDate = lastPayment 
            ? new Date(lastPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Never';
          
          setBillingStats({ totalSpent, totalPayments, lastPaymentDate });
        }
      } else {
        console.error('Failed to fetch billing history');
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setBillingHistoryLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Password updated successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (error) {
      alert('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };





  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      {/* Status Messages */}
      {showSuccessMessage && (
        <StatusMessage
          type="success"
          message="Payment Successful!"
          description="Your subscription has been updated successfully. You now have access to all premium features."
          onClose={() => setShowSuccessMessage(false)}
        />
      )}

      {showCancelMessage && (
        <StatusMessage
          type="cancel"
          message="Payment Cancelled"
          description="Your payment was cancelled. You can try again anytime."
          onClose={() => setShowCancelMessage(false)}
        />
      )}

      {/* Profile Header */}
      <ProfileHeader profile={profile} subscription={subscription} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ProfileStats stats={stats} />
          <RecentProjects projects={projects} />
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionTab
            plans={plans}
            billingPeriod={billingPeriod}
            onBillingPeriodChange={setBillingPeriod}
          />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SecurityTab
            onPasswordChange={handlePasswordChange}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            passwordLoading={passwordLoading}
          />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <BillingTab
            billingHistory={billingHistory}
            billingHistoryLoading={billingHistoryLoading}
            billingStats={billingStats}
            onRefresh={fetchBillingHistory}
          />
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <HelpTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
