'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Clock, CheckCircle, TrendingUp } from "lucide-react";
import React, { useMemo } from 'react';

// Types
interface StatusMetricsProps {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
  loading?: boolean;
}

// Status metrics configuration
const METRICS_CONFIG = [
  {
    title: "Active Projects",
    value: (active: number) => active,
    icon: Clock,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    description: "Currently running projects"
  },
  {
    title: "Total Projects",
    value: (total: number) => total,
    icon: Globe,
    color: "bg-slate-100",
    iconColor: "text-slate-700",
    description: "All time projects"
  },
  {
    title: "Total Pages Analyzed",
    value: (pages: number) => pages,
    icon: CheckCircle,
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
    description: "All pages processed"
  },
  {
    title: "Average Score",
    value: (score: number) => `${score.toFixed(1)}%`,
    icon: TrendingUp,
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    description: "Overall performance"
  }
] as const;

// Individual metric card component
const MetricCard = React.memo(({ 
  config, 
  value, 
  loading 
}: { 
  config: typeof METRICS_CONFIG[number], 
  value: number, 
  loading: boolean 
}) => {
  const IconComponent = config.icon;
  const displayValue = config.value(value);

  return (
    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">
              {config.title}
            </p>
            <div className="mb-1">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900">
                  {displayValue}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {config.description}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${config.color} ml-4`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Main StatusMetrics component
export const StatusMetrics = React.memo(({ 
  totalProjects, 
  activeProjects, 
  totalPagesAnalyzed, 
  averageScore, 
  loading = false 
}: StatusMetricsProps) => {
  // Memoize metrics data to prevent unnecessary re-renders
  const metricsData = useMemo(() => [
    { config: METRICS_CONFIG[0], value: activeProjects },
    { config: METRICS_CONFIG[1], value: totalProjects },
    { config: METRICS_CONFIG[2], value: totalPagesAnalyzed },
    { config: METRICS_CONFIG[3], value: averageScore },
  ], [activeProjects, totalProjects, totalPagesAnalyzed, averageScore]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricCard
          key={index}
          config={metric.config}
          value={metric.value}
          loading={loading}
        />
      ))}
    </div>
  );
});

StatusMetrics.displayName = 'StatusMetrics';
