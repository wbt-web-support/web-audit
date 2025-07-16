import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, BarChart3, FileSearch, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DashboardStatsCardsProps {
  totalSessions: number;
  activeSessions: number;
  totalPagesAnalyzed: number;
  averageScore: number;
}

export function DashboardStatsCards({
  totalSessions,
  activeSessions,
  totalPagesAnalyzed,
  averageScore,
}: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            {activeSessions} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pages Analyzed</CardTitle>
          <FileSearch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPagesAnalyzed}</div>
          <p className="text-xs text-muted-foreground">
            Across all sessions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageScore}%</div>
          <p className="text-xs text-muted-foreground">
            Overall quality score
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/sessions">
              <Button size="sm">New Session</Button>
            </Link>
            <Link href="/audit">
              <Button size="sm" variant="outline">View Audits</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 