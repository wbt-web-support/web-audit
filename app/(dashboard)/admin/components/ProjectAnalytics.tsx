'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Filter
} from 'lucide-react';

// Mock data for charts
const monthlyProjectData = [
  { month: 'Jan', projects: 120, growth: 15 },
  { month: 'Feb', projects: 145, growth: 21 },
  { month: 'Mar', projects: 180, growth: 24 },
  { month: 'Apr', projects: 220, growth: 22 },
  { month: 'May', projects: 280, growth: 27 },
  { month: 'Jun', projects: 320, growth: 14 },
  { month: 'Jul', projects: 380, growth: 19 },
  { month: 'Aug', projects: 420, growth: 11 },
  { month: 'Sep', projects: 480, growth: 14 },
  { month: 'Oct', projects: 520, growth: 8 },
  { month: 'Nov', projects: 580, growth: 12 },
  { month: 'Dec', projects: 650, growth: 12 }
];

const projectStatusData = [
  { status: 'Completed', count: 2340, percentage: 65, color: 'bg-green-500' },
  { status: 'In Progress', count: 890, percentage: 25, color: 'bg-blue-500' },
  { status: 'Failed', count: 220, percentage: 6, color: 'bg-red-500' },
  { status: 'Pending', count: 120, percentage: 4, color: 'bg-yellow-500' }
];

const topDomains = [
  { domain: 'example.com', projects: 45, avgScore: 87 },
  { domain: 'test.com', projects: 38, avgScore: 92 },
  { domain: 'demo.org', projects: 32, avgScore: 78 },
  { domain: 'sample.net', projects: 28, avgScore: 85 },
  { domain: 'website.io', projects: 25, avgScore: 91 }
];

export function ProjectAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  const [loading, setLoading] = useState(false);

  const totalProjects = monthlyProjectData[monthlyProjectData.length - 1].projects;
  const growthRate = monthlyProjectData[monthlyProjectData.length - 1].growth;
  const completedProjects = projectStatusData.find(p => p.status === 'Completed')?.count || 0;
  const activeProjects = projectStatusData.find(p => p.status === 'In Progress')?.count || 0;

  const exportProjectData = () => {
    const csvContent = [
      ['Month', 'Projects', 'Growth %'],
      ...monthlyProjectData.map(item => [
        item.month,
        item.projects.toString(),
        item.growth.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{growthRate}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((completedProjects / totalProjects) * 100)}% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Currently running
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground">
              Across all projects
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Project Growth</CardTitle>
                <CardDescription>Project creation trends over time</CardDescription>
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
                <Button onClick={exportProjectData} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyProjectData.slice(-6).map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.growth > 0 ? '+' : ''}{item.growth}%
                  </div>
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${(item.projects / Math.max(...monthlyProjectData.map(d => d.projects))) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs text-muted-foreground mt-2">{item.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Domains and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Domains */}
        <Card>
          <CardHeader>
            <CardTitle>Top Domains by Projects</CardTitle>
            <CardDescription>Most audited domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDomains.map((domain, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{domain.domain}</div>
                    <div className="text-sm text-muted-foreground">
                      {domain.projects} projects
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{domain.avgScore}%</div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Processing Time</span>
                <Badge variant="secondary">2.3 min</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <Badge className="bg-green-100 text-green-800">94.2%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <Badge className="bg-red-100 text-red-800">5.8%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Pages per Project</span>
                <Badge variant="secondary">24.5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Peak Usage Time</span>
                <Badge variant="secondary">2-4 PM EST</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Project Activity</CardTitle>
          <CardDescription>Latest project updates and status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Project completed', domain: 'example.com', time: '2 minutes ago', status: 'success' },
              { action: 'New project started', domain: 'test.org', time: '5 minutes ago', status: 'info' },
              { action: 'Project failed', domain: 'demo.net', time: '12 minutes ago', status: 'error' },
              { action: 'Project completed', domain: 'sample.io', time: '15 minutes ago', status: 'success' },
              { action: 'New project started', domain: 'website.com', time: '22 minutes ago', status: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">{activity.domain}</div>
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
