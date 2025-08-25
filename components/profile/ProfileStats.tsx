'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, BarChart3 } from 'lucide-react';

interface ProfileStats {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
}

interface ProfileStatsProps {
  stats: ProfileStats | null;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.activeProjects || 0} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pages Analyzed</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPagesAnalyzed || 0}</div>
          <p className="text-xs text-muted-foreground">
            Across all projects
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Overall performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
