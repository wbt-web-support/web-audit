import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart3, Globe, Clock, CheckCircle, TrendingUp } from "lucide-react";

// Optimized skeleton components with better performance
const StatCardSkeleton = React.memo(() => (
  <Card className="border-0 shadow-sm bg-white">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-8 bg-slate-200 rounded w-16 mb-1 animate-pulse"></div>
          <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="w-12 h-12 bg-slate-200 rounded-lg ml-4 animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
));

StatCardSkeleton.displayName = 'StatCardSkeleton';

const ProjectCardSkeleton = React.memo(() => (
  <div className="p-4 border border-slate-200 rounded-lg bg-white animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="h-8 bg-slate-200 rounded flex-1"></div>
      <div className="w-8 h-8 bg-slate-200 rounded"></div>
    </div>
  </div>
));

ProjectCardSkeleton.displayName = 'ProjectCardSkeleton';

const FormSkeleton = React.memo(() => (
  <Card className="h-full">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
        <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
));

FormSkeleton.displayName = 'FormSkeleton';

const ProjectsListSkeleton = React.memo(() => (
  <Card className="h-full">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </CardContent>
  </Card>
));

ProjectsListSkeleton.displayName = 'ProjectsListSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-200 rounded-xl w-14 h-14 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-9 bg-slate-200 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-slate-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Main Content Grid Skeleton */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <FormSkeleton />
          <ProjectsListSkeleton />
        </div>
        
      </div>
    </div>
  );
} 