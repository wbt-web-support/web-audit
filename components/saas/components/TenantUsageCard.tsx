'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Globe, 
  Users, 
  Zap, 
  HardDrive, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: {
    name: string;
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    limits: {
      maxProjects: number;
      maxPagesPerProject: number;
      maxConcurrentCrawls: number;
      maxWorkers: number;
      rateLimitPerMinute: number;
      storageGB: number;
    };
  };
  usage: {
    currentProjects: number;
    currentPages: number;
    currentCrawls: number;
    currentWorkers: number;
    currentStorageGB: number;
    monthlyCrawls: number;
  };
  status: 'active' | 'suspended' | 'cancelled';
}

interface TenantUsageCardProps {
  tenant: TenantInfo;
}

export function TenantUsageCard({ tenant }: TenantUsageCardProps) {
  const usageItems = [
    {
      label: 'Projects',
      current: tenant.usage.currentProjects,
      limit: tenant.plan.limits.maxProjects,
      icon: Globe,
      color: 'blue',
      percentage: Math.round((tenant.usage.currentProjects / tenant.plan.limits.maxProjects) * 100),
    },
    {
      label: 'Pages',
      current: tenant.usage.currentPages,
      limit: tenant.plan.limits.maxPagesPerProject,
      icon: BarChart3,
      color: 'green',
      percentage: Math.round((tenant.usage.currentPages / tenant.plan.limits.maxPagesPerProject) * 100),
    },
    {
      label: 'Active Crawls',
      current: tenant.usage.currentCrawls,
      limit: tenant.plan.limits.maxConcurrentCrawls,
      icon: Zap,
      color: 'purple',
      percentage: Math.round((tenant.usage.currentCrawls / tenant.plan.limits.maxConcurrentCrawls) * 100),
    },
    {
      label: 'Workers',
      current: tenant.usage.currentWorkers,
      limit: tenant.plan.limits.maxWorkers,
      icon: Users,
      color: 'orange',
      percentage: Math.round((tenant.usage.currentWorkers / tenant.plan.limits.maxWorkers) * 100),
    },
    {
      label: 'Storage',
      current: tenant.usage.currentStorageGB,
      limit: tenant.plan.limits.storageGB,
      icon: HardDrive,
      color: 'indigo',
      percentage: Math.round((tenant.usage.currentStorageGB / tenant.plan.limits.storageGB) * 100),
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (percentage >= 75) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Warning</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Good</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Usage Overview
            </CardTitle>
            <CardDescription>
              Current resource utilization
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(usageItems.reduce((sum, item) => sum + item.percentage, 0) / usageItems.length)}%
            </div>
            <div className="text-xs text-gray-500">Average Usage</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const isOverLimit = item.percentage >= 100;
          const isNearLimit = item.percentage >= 90;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${item.color}-600`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  {isOverLimit && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {item.current}/{item.limit}
                  </span>
                  {getStatusBadge(item.percentage)}
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={Math.min(item.percentage, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.percentage}% used</span>
                  {isNearLimit && (
                    <span className="text-red-600 font-medium">
                      {isOverLimit ? 'Over limit!' : 'Near limit'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Monthly Crawls */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Monthly Crawls</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {tenant.usage.monthlyCrawls} this month
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Resets on the 1st of each month
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
