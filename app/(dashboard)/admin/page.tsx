'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Calendar,
  Search,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Bell,
  Settings,
  Globe,
  Activity,
  DollarSign,
  Ticket,
  Database,
  Server,
  Zap,
  Target,
  PieChart,
  LineChart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowLeft,
  HelpCircle,
  FolderOpen,
  Banknote
} from 'lucide-react';

import { UserManagement } from './components/UserManagement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { RevenueAnalytics } from './components/RevenueAnalytics';
import { SystemAlerts } from './components/SystemAlerts';
import { SupportTickets } from './components/SupportTickets';
import { ProjectAnalytics } from './components/ProjectAnalytics';
import { PlanManagement } from './components/PlanManagement';
import { PlanEditor } from './components/PlanEditor';
import { UserPlanManagement } from './components/UserPlanManagement';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}



export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'user' | 'admin' | null>(null);
  
  // Get active tab from URL or default to overview
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Function to change tabs and update URL
  const changeTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.push(`/admin?${params.toString()}`);
  };

  // Mock data for charts and analytics
  const [analytics] = useState({
    totalUsers: 1247,
    totalProjects: 3456,
    totalRevenue: 45678,
    dailyActiveUsers: 234,
    monthlyGrowth: 12.5,
    subscriptionCount: 892,
    supportTickets: 45
  });

  const [systemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2-4 AM EST',
      type: 'info',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'New Feature Alert',
      message: 'Advanced analytics dashboard now available!',
      type: 'success',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]);



  useEffect(() => {
    checkAccessAndFetchUsers();
  }, []);

  const checkAccessAndFetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if current user is admin
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUserRole(profileData.role || 'user');
        
        if (profileData.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }
      } else {
        setError('Failed to verify admin access.');
        setLoading(false);
        return;
      }

      // Fetch all users
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data.users || []);
      } else {
        const errorData = await usersResponse.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const adminUsers = users.filter(user => user.role === 'admin');
  const regularUsers = users.filter(user => user.role === 'user');

  // Show access denied message
  if (currentUserRole && currentUserRole !== 'admin') {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl">Error</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={checkAccessAndFetchUsers} className="mr-2">
                Retry
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'plans', label: 'Plans', icon: CreditCard },
                { id: 'plan-editor', label: 'Plan Editor', icon: Settings },
                { id: 'user-plans', label: 'User Plans', icon: UserCheck },
                { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
                { id: 'projects', label: 'Projects', icon: FolderOpen },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'revenue', label: 'Revenue', icon: Banknote },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { id: 'support', label: 'Support', icon: HelpCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => changeTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {activeTab !== 'overview' && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => changeTab('overview')}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              >
                ← Back to Overview
              </Button>
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'overview' && 'Admin Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'plans' && 'Plans Management'}
            {activeTab === 'plan-editor' && 'Plan Editor'}
            {activeTab === 'user-plans' && 'User Plan Management'}
            {activeTab === 'projects' && 'Project Analytics'}
            {activeTab === 'analytics' && 'System Analytics'}
            {activeTab === 'subscriptions' && 'Subscription Management'}
            {activeTab === 'revenue' && 'Revenue Analytics'}
            {activeTab === 'alerts' && 'System Alerts'}
            {activeTab === 'support' && 'Support Tickets'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {activeTab === 'overview' && 'Monitor system performance and key metrics'}
            {activeTab === 'users' && 'Manage user accounts and permissions'}
            {activeTab === 'plans' && 'Manage subscription plans and pricing'}
            {activeTab === 'plan-editor' && 'Edit plan features, limits, and configurations'}
            {activeTab === 'user-plans' && 'Assign and manage user plan subscriptions'}
            {activeTab === 'projects' && 'Track project performance and analytics'}
            {activeTab === 'analytics' && 'View detailed system analytics and reports'}
            {activeTab === 'subscriptions' && 'Manage user subscriptions and billing'}
            {activeTab === 'revenue' && 'Track revenue metrics and financial data'}
            {activeTab === 'alerts' && 'Monitor system alerts and notifications'}
            {activeTab === 'support' && 'Handle support tickets and user requests'}
          </p>
        </div>

        {/* Content based on active tab */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab analytics={analytics} users={users} />
          )}
          
          {activeTab === 'users' && (
            <UserManagement 
              users={users}
              adminUsers={adminUsers}
              regularUsers={regularUsers}
              onRefresh={checkAccessAndFetchUsers}
            />
          )}
          
          {activeTab === 'plans' && (
            <PlanManagement onRefresh={checkAccessAndFetchUsers} />
          )}
          
          {activeTab === 'plan-editor' && (
            <PlanEditor onRefresh={checkAccessAndFetchUsers} />
          )}
          
          {activeTab === 'user-plans' && (
            <UserPlanManagement onRefresh={checkAccessAndFetchUsers} />
          )}
          
          {activeTab === 'projects' && (
            <ProjectAnalytics />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsDashboard analytics={analytics} />
          )}
          
          {activeTab === 'subscriptions' && (
            <SubscriptionManagement />
          )}
          
          {activeTab === 'revenue' && (
            <RevenueAnalytics />
          )}
          
          {activeTab === 'alerts' && (
            <SystemAlerts alerts={systemAlerts} />
          )}
          
          {activeTab === 'support' && (
            <SupportTickets />
          )}
        </div>
      </div>
    
  );
}

// Overview Tab Component
function OverviewTab({ analytics, users }: { analytics: any; users: UserProfile[] }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subscriptionCount}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm">System maintenance scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">New feature deployed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Open Tickets</span>
                <Badge variant="secondary">{analytics.supportTickets}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High Priority</span>
                <Badge className="bg-red-100 text-red-800">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Resolved Today</span>
                <Badge className="bg-green-100 text-green-800">12</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
