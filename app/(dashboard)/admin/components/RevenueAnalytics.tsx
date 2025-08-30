'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter
} from 'lucide-react';

// Mock revenue data
const monthlyRevenueData = [
  { month: 'Jan', revenue: 12500, growth: 15, subscriptions: 45 },
  { month: 'Feb', revenue: 13800, growth: 10, subscriptions: 52 },
  { month: 'Mar', revenue: 15200, growth: 10, subscriptions: 58 },
  { month: 'Apr', revenue: 16700, growth: 10, subscriptions: 64 },
  { month: 'May', revenue: 18300, growth: 10, subscriptions: 70 },
  { month: 'Jun', revenue: 20100, growth: 10, subscriptions: 77 },
  { month: 'Jul', revenue: 22100, growth: 10, subscriptions: 85 },
  { month: 'Aug', revenue: 24300, growth: 10, subscriptions: 93 },
  { month: 'Sep', revenue: 26700, growth: 10, subscriptions: 102 },
  { month: 'Oct', revenue: 29400, growth: 10, subscriptions: 112 },
  { month: 'Nov', revenue: 32300, growth: 10, subscriptions: 123 },
  { month: 'Dec', revenue: 35500, growth: 10, subscriptions: 135 }
];

const revenueByPlan = [
  { plan: 'Pro Plan', revenue: 23400, percentage: 65, color: 'bg-blue-500' },
  { plan: 'Enterprise', revenue: 8900, percentage: 25, color: 'bg-green-500' },
  { plan: 'Add-ons', revenue: 3200, percentage: 9, color: 'bg-yellow-500' },
  { plan: 'Other', revenue: 1000, percentage: 1, color: 'bg-red-500' }
];

const topRevenueUsers = [
  { user: 'enterprise@company.com', plan: 'Enterprise', revenue: 9900, projects: 45 },
  { user: 'pro@business.com', plan: 'Pro', revenue: 2900, projects: 23 },
  { user: 'startup@tech.com', plan: 'Pro', revenue: 2900, projects: 18 },
  { user: 'agency@creative.com', plan: 'Pro', revenue: 2900, projects: 31 },
  { user: 'consultant@expert.com', plan: 'Pro', revenue: 2900, projects: 12 }
];

export function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const totalRevenue = monthlyRevenueData[monthlyRevenueData.length - 1].revenue;
  const growthRate = monthlyRevenueData[monthlyRevenueData.length - 1].growth;
  const totalSubscriptions = monthlyRevenueData[monthlyRevenueData.length - 1].subscriptions;
  const avgRevenuePerUser = Math.round(totalRevenue / totalSubscriptions);

  const exportRevenueData = () => {
    const csvContent = [
      ['Month', 'Revenue', 'Growth %', 'Subscriptions'],
      ...monthlyRevenueData.map(item => [
        item.month,
        item.revenue.toString(),
        item.growth.toString(),
        item.subscriptions.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{growthRate}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 12).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Average monthly
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
            <div className="text-xs text-muted-foreground">
              Paying customers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/User</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgRevenuePerUser}</div>
            <div className="text-xs text-muted-foreground">
              Per subscription
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Revenue Growth</CardTitle>
                <CardDescription>Revenue trends over time</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="6m">6 Months</option>
                  <option value="12m">12 Months</option>
                  <option value="2y">2 Years</option>
                </select>
                <Button onClick={exportRevenueData} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyRevenueData.slice(-6).map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    ${(item.revenue / 1000).toFixed(0)}k
                  </div>
                  <div 
                    className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                    style={{ 
                      height: `${(item.revenue / Math.max(...monthlyRevenueData.map(d => d.revenue))) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs text-muted-foreground mt-2">{item.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Revenue distribution across plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByPlan.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`}></div>
                    <span className="text-sm font-medium">{plan.plan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">${plan.revenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">({plan.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Revenue Users and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Revenue Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Users</CardTitle>
            <CardDescription>Highest revenue generating customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRevenueUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.user}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.plan} • {user.projects} projects
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${user.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
            <CardDescription>Key financial indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Customer Lifetime Value</span>
                <Badge variant="secondary">$2,450</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Churn Rate</span>
                <Badge className="bg-red-100 text-red-800">3.2%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversion Rate</span>
                <Badge className="bg-green-100 text-green-800">8.5%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Order Value</span>
                <Badge variant="secondary">$89</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Revenue Growth Rate</span>
                <Badge className="bg-green-100 text-green-800">+12.5%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Projected revenue for the next 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { month: 'Jan 2025', projected: 39000, confidence: 'high' },
              { month: 'Feb 2025', projected: 42900, confidence: 'high' },
              { month: 'Mar 2025', projected: 47200, confidence: 'medium' },
              { month: 'Apr 2025', projected: 51900, confidence: 'medium' },
              { month: 'May 2025', projected: 57100, confidence: 'low' },
              { month: 'Jun 2025', projected: 62800, confidence: 'low' }
            ].map((forecast, index) => (
              <div key={index} className="text-center p-3 border rounded-lg">
                <div className="text-sm font-medium">{forecast.month}</div>
                <div className="text-lg font-bold text-green-600">
                  ${(forecast.projected / 1000).toFixed(0)}k
                </div>
                <Badge 
                  variant={forecast.confidence === 'high' ? 'default' : 
                          forecast.confidence === 'medium' ? 'secondary' : 'outline'}
                  className="text-xs mt-1"
                >
                  {forecast.confidence}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
