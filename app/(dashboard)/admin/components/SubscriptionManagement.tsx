'use client';

import { useState } from 'react';
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
  Settings
} from 'lucide-react';

// Mock subscription data
const subscriptionData = [
  { id: '1', user: 'john@example.com', plan: 'Pro', status: 'active', amount: 29, startDate: '2024-01-15', endDate: '2024-02-15', autoRenew: true },
  { id: '2', user: 'sarah@test.com', plan: 'Enterprise', status: 'active', amount: 99, startDate: '2024-01-10', endDate: '2024-02-10', autoRenew: true },
  { id: '3', user: 'mike@demo.org', plan: 'Free', status: 'active', amount: 0, startDate: '2024-01-20', endDate: null, autoRenew: false },
  { id: '4', user: 'lisa@sample.net', plan: 'Pro', status: 'cancelled', amount: 29, startDate: '2024-01-05', endDate: '2024-02-05', autoRenew: false },
  { id: '5', user: 'alex@website.io', plan: 'Enterprise', status: 'active', amount: 99, startDate: '2024-01-12', endDate: '2024-02-12', autoRenew: true }
];

const planStats = [
  { plan: 'Free', users: 234, revenue: 0, growth: 12 },
  { plan: 'Pro', users: 156, revenue: 4524, growth: 8 },
  { plan: 'Enterprise', users: 45, revenue: 4455, growth: 15 }
];

export function SubscriptionManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const totalSubscriptions = subscriptionData.length;
  const activeSubscriptions = subscriptionData.filter(s => s.status === 'active').length;
  const totalRevenue = subscriptionData.reduce((sum, s) => sum + s.amount, 0);
  const monthlyRecurringRevenue = subscriptionData.filter(s => s.autoRenew).reduce((sum, s) => sum + s.amount, 0);

  const filteredSubscriptions = subscriptionData.filter(sub => {
    const matchesSearch = sub.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const exportSubscriptionData = () => {
    const csvContent = [
      ['User', 'Plan', 'Status', 'Amount', 'Start Date', 'End Date', 'Auto Renew'],
      ...filteredSubscriptions.map(sub => [
        sub.user,
        sub.plan,
        sub.status,
        sub.amount.toString(),
        sub.startDate,
        sub.endDate || 'N/A',
        sub.autoRenew ? 'Yes' : 'No'
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${monthlyRecurringRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Recurring monthly
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planStats.map((plan, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.plan} Plan</span>
                <Badge variant={plan.plan === 'Free' ? 'secondary' : 'default'}>
                  {plan.users} users
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Users:</span>
                  <span className="font-medium">{plan.users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue:</span>
                  <span className="font-medium">${plan.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Growth:</span>
                  <span className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    +{plan.growth}%
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
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          
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
            {filteredSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{subscription.user}</div>
                    <div className="text-sm text-muted-foreground">
                      Started {new Date(subscription.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{subscription.plan}</div>
                    <div className="text-sm text-muted-foreground">
                      ${subscription.amount}/month
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                    {subscription.autoRenew && (
                      <Badge className="bg-green-100 text-green-800">
                        Auto-renew
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
