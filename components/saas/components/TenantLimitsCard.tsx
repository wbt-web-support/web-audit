'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Globe, 
  Users, 
  Zap, 
  HardDrive, 
  Clock,
  ArrowUpRight,
  CheckCircle,
  XCircle
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

interface TenantLimitsCardProps {
  tenant: TenantInfo;
}

export function TenantLimitsCard({ tenant }: TenantLimitsCardProps) {
  const limitItems = [
    {
      label: 'Max Projects',
      value: tenant.plan.limits.maxProjects,
      icon: Globe,
      color: 'blue',
      description: 'Total projects allowed',
    },
    {
      label: 'Pages per Project',
      value: tenant.plan.limits.maxPagesPerProject,
      icon: Shield,
      color: 'green',
      description: 'Maximum pages per crawl',
    },
    {
      label: 'Concurrent Crawls',
      value: tenant.plan.limits.maxConcurrentCrawls,
      icon: Zap,
      color: 'purple',
      description: 'Simultaneous crawling jobs',
    },
    {
      label: 'Max Workers',
      value: tenant.plan.limits.maxWorkers,
      icon: Users,
      color: 'orange',
      description: 'Background processing workers',
    },
    {
      label: 'Rate Limit',
      value: `${tenant.plan.limits.rateLimitPerMinute}/min`,
      icon: Clock,
      color: 'indigo',
      description: 'API requests per minute',
    },
    {
      label: 'Storage',
      value: `${tenant.plan.limits.storageGB} GB`,
      icon: HardDrive,
      color: 'pink',
      description: 'Data storage limit',
    },
  ];

  const getPlanFeatures = (tier: string) => {
    const features = {
      free: [
        'Basic web crawling',
        'Standard analysis',
        'Email support',
        'Community forum access'
      ],
      starter: [
        'Everything in Free',
        'Advanced analysis',
        'Priority support',
        'Custom user agents',
        'API access'
      ],
      professional: [
        'Everything in Starter',
        'Unlimited projects',
        'Custom integrations',
        'Advanced reporting',
        'White-label options'
      ],
      enterprise: [
        'Everything in Professional',
        'Dedicated support',
        'Custom limits',
        'SLA guarantee',
        'On-premise deployment'
      ]
    };
    
    return features[tier as keyof typeof features] || features.free;
  };

  const features = getPlanFeatures(tenant.plan.tier);
  const isUpgradeAvailable = tenant.plan.tier !== 'enterprise';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Plan Limits
            </CardTitle>
            <CardDescription>
              {tenant.plan.name} plan restrictions
            </CardDescription>
          </div>
          <Badge 
            variant={tenant.plan.tier === 'enterprise' ? 'default' : 'secondary'}
            className={`
              ${tenant.plan.tier === 'free' ? 'bg-gray-100 text-gray-700' : ''}
              ${tenant.plan.tier === 'starter' ? 'bg-blue-100 text-blue-700' : ''}
              ${tenant.plan.tier === 'professional' ? 'bg-purple-100 text-purple-700' : ''}
              ${tenant.plan.tier === 'enterprise' ? 'bg-gold-100 text-gold-700' : ''}
            `}
          >
            {tenant.plan.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Limits Grid */}
        <div className="grid grid-cols-2 gap-4">
          {limitItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${item.color}-600`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            );
          })}
        </div>

        {/* Plan Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Plan Features
          </h4>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        {isUpgradeAvailable && (
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Need more resources?
                  </h4>
                  <p className="text-xs text-gray-600">
                    Upgrade your plan for higher limits and more features
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tenant.status === 'active' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Account Status
              </span>
            </div>
            <Badge 
              variant={tenant.status === 'active' ? 'default' : 'destructive'}
              className={`
                ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              `}
            >
              {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
