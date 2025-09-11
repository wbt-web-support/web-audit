'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_subscription_id: string;
  status: string;
  current_start: string;
  current_end: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user_profiles: {
    email: string;
    full_name: string | null;
  };
  plans: {
    name: string;
    amount: number;
    interval: string;
  };
}

interface PlanStats {
  plan_name: string;
  name?: string; // Fallback field from database
  user_count: number;
  active_users: number;
  free_users: number;
  expired_users: number;
  cancelled_users: number;
  total_revenue: number;
  average_revenue: number;
  new_subscriptions_30d: number;
  new_subscriptions_7d: number;
}

export function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscriptions and plan stats in parallel
      const [subscriptionsResponse, planStatsResponse] = await Promise.all([
        fetch('/api/admin/subscriptions'),
        fetch('/api/admin/plan-statistics')
      ]);

      if (subscriptionsResponse.ok && planStatsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        const planStatsData = await planStatsResponse.json();
        
        console.log('Plan stats data received:', planStatsData.planStats);
        setSubscriptions(subscriptionsData.subscriptions || []);
        setPlanStats(planStatsData.planStats || []);
      } else {
        const errorData = await subscriptionsResponse.json();
        setError(errorData.error || 'Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const monthlyRecurringRevenue = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.user_profiles.full_name && sub.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || sub.plans.name === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const exportSubscriptionData = () => {
    const csvContent = [
      ['User', 'Plan', 'Status', 'Amount', 'Start Date', 'End Date', 'Currency', 'Razorpay ID'],
      ...filteredSubscriptions.map(sub => [
        sub.user_profiles.email,
        sub.plans.name,
        sub.status,
        (sub.amount / 100).toString(), // Convert from paise to rupees
        new Date(sub.current_start).toLocaleDateString(),
        new Date(sub.current_end).toLocaleDateString(),
        sub.currency,
        sub.razorpay_subscription_id
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriptions-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatAmount = (amount: number) => {
    return `₹${(amount / 100).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSubscriptionData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
            <div className="text-xs text-muted-foreground">
              All plans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((activeSubscriptions / totalSubscriptions) * 100)}% active rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(monthlyRecurringRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              Recurring monthly
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planStats.map((plan, index) => (
          <Card key={`plan-card-${index}-${plan.plan_name || plan.name || 'unknown'}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.plan_name || plan.name || 'Unknown Plan'}</span>
                <Badge variant={(plan.plan_name || plan.name) === 'Free Plan' ? 'secondary' : 'default'}>
                  {plan.user_count} users
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Users:</span>
                  <span className="font-medium">{plan.user_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users:</span>
                  <span className="font-medium text-green-600">{plan.active_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue:</span>
                  <span className="font-medium">{formatAmount(plan.total_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New (30d):</span>
                  <span className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    {plan.new_subscriptions_30d}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions by user email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Plans</option>
            {planStats.map((plan, index) => (
              <option key={`plan-${index}-${plan.plan_name}`} value={plan.plan_name}>{plan.plan_name}</option>
            ))}
          </select>
          
          <Button onClick={fetchSubscriptionData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button onClick={exportSubscriptionData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Manage user subscriptions and billing. Found {filteredSubscriptions.length} subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription, index) => (
              <div key={`subscription-${subscription.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{subscription.user_profiles.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.user_profiles.full_name || 'No name'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started {new Date(subscription.current_start).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{subscription.plans.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatAmount(subscription.amount)}/{subscription.plans.interval}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {subscription.razorpay_subscription_id}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                    {subscription.status === 'active' && (
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No subscriptions found</p>
                {(searchTerm || filterStatus !== 'all' || filterPlan !== 'all') && (
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
