import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuditSession {
  id: string;
  base_url: string;
  status: string;
  pages_crawled?: number;
  pages_analyzed?: number;
  created_at: string;
}

interface RecentSessionsProps {
  sessions: AuditSession[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case 'crawling':
        return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-pulse" />;
      case 'analyzing':
        return <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Your latest audit sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sessions yet</p>
            <Link href="/sessions">
              <Button className="mt-4">Create Your First Session</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className={cn(
                "flex items-center justify-between p-4 border rounded-lg transition-colors",
                "hover:bg-muted/50"
              )}>
                <div className="flex items-center gap-4">
                  {getStatusIcon(session.status)}
                  <div>
                    <p className="font-medium">{session.base_url}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.pages_crawled || 0} pages crawled • {session.pages_analyzed || 0} analyzed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/audit?session=${session.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <Link href="/sessions">
                <Button variant="outline">View All Sessions</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 