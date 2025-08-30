'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Clock,
  Eye,
  Download,
  Filter
} from 'lucide-react';

// Mock data for daily users
const dailyUserData = [
  { day: 'Mon', users: 234, sessions: 456, pageViews: 1234 },
  { day: 'Tue', users: 267, sessions: 523, pageViews: 1456 },
  { day: 'Wed', users: 289, sessions: 567, pageViews: 1678 },
  { day: 'Thu', users: 312, sessions: 612, pageViews: 1890 },
  { day: 'Fri', users: 298, sessions: 589, pageViews: 1723 },
  { day: 'Sat', users: 245, sessions: 478, pageViews: 1345 },
  { day: 'Sun', users: 223, sessions: 445, pageViews: 1234 }
];

const userGrowthData = [
  { month: 'Jan', users: 1200, growth: 15 },
  { month: 'Feb', users: 1380, growth: 15 },
  { month: 'Mar', users: 1587, growth: 15 },
  { month: 'Apr', users: 1825, growth: 15 },
  { month: 'May', users: 2099, growth: 15 },
  { month: 'Jun', users: 2414, growth: 15 },
  { month: 'Jul', users: 2776, growth: 15 },
  { month: 'Aug', users: 3192, growth: 15 },
  { month: 'Sep', users: 3671, growth: 15 },
  { month: 'Oct', users: 4222, growth: 15 },
  { month: 'Nov', users: 4855, growth: 15 },
  { month: 'Dec', users: 5583, growth: 15 }
];

const topPages = [
  { page: '/dashboard', views: 1234, users: 567, avgTime: '2:34' },
  { page: '/projects', views: 987, users: 432, avgTime: '1:45' },
  { page: '/audit', views: 876, users: 345, avgTime: '3:12' },
  { page: '/profile', views: 654, users: 234, avgTime: '0:45' },
  { page: '/settings', views: 543, users: 123, avgTime: '1:23' }
];

const userSegments = [
  { segment: 'New Users', count: 234, percentage: 45, color: 'bg-blue-500' },
  { segment: 'Returning Users', count: 156, percentage: 30, color: 'bg-green-500' },
  { segment: 'Active Users', count: 89, percentage: 17, color: 'bg-yellow-500' },
  { segment: 'Inactive Users', count: 45, percentage: 8, color: 'bg-red-500' }
];

interface AnalyticsDashboardProps {
  analytics: any;
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  const totalDailyUsers = dailyUserData.reduce((sum, day) => sum + day.users, 0);
  const avgDailyUsers = Math.round(totalDailyUsers / dailyUserData.length);
  const totalSessions = dailyUserData.reduce((sum, day) => sum + day.sessions, 0);
  const totalPageViews = dailyUserData.reduce((sum, day) => sum + day.pageViews, 0);

  const exportAnalyticsData = () => {
    const csvContent = [
      ['Day', 'Users', 'Sessions', 'Page Views'],
      ...dailyUserData.map(item => [
        item.day,
        item.users.toString(),
        item.sessions.toString(),
        item.pageViews.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{analytics.monthlyGrowth}% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              This week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              This week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2:34</div>
            <div className="text-xs text-muted-foreground">
              Minutes per session
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Users Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily User Activity</CardTitle>
                <CardDescription>User engagement over the past week</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="users">Users</option>
                  <option value="sessions">Sessions</option>
                  <option value="pageViews">Page Views</option>
                </select>
                <Button onClick={exportAnalyticsData} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {dailyUserData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    {selectedMetric === 'users' ? item.users :
                     selectedMetric === 'sessions' ? item.sessions : item.pageViews}
                  </div>
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${(selectedMetric === 'users' ? item.users :
                                selectedMetric === 'sessions' ? item.sessions : item.pageViews) / 
                               Math.max(...dailyUserData.map(d => 
                                 selectedMetric === 'users' ? d.users :
                                 selectedMetric === 'sessions' ? d.sessions : d.pageViews
                               )) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs text-muted-foreground mt-2">{item.day}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly User Growth</CardTitle>
            <CardDescription>User acquisition trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-1">
              {userGrowthData.slice(-6).map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    +{item.growth}%
                  </div>
                  <div 
                    className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                    style={{ 
                      height: `${(item.users / Math.max(...userGrowthData.map(d => d.users))) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs text-muted-foreground mt-2">{item.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Segments and Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle>User Segments</CardTitle>
            <CardDescription>Breakdown of user types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                    <span className="text-sm font-medium">{segment.segment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{segment.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">({segment.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{page.page}</div>
                    <div className="text-sm text-muted-foreground">
                      {page.users} users
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{page.views.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{page.avgTime} avg</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>Live user activity feed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: 'john@example.com', action: 'Started new project', time: '2 minutes ago', type: 'project' },
              { user: 'sarah@test.com', action: 'Completed audit', time: '4 minutes ago', type: 'audit' },
              { user: 'mike@demo.org', action: 'Updated profile', time: '7 minutes ago', type: 'profile' },
              { user: 'lisa@sample.net', action: 'Viewed dashboard', time: '9 minutes ago', type: 'view' },
              { user: 'alex@website.io', action: 'Created project', time: '12 minutes ago', type: 'project' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'project' ? 'bg-blue-500' :
                  activity.type === 'audit' ? 'bg-green-500' :
                  activity.type === 'profile' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">{activity.user}</div>
                </div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
