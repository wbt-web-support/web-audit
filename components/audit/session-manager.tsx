'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AuditSession } from '@/lib/types/database';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Globe, 
  Calendar,
  Play,
  BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SessionManager() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSessionUrl, setNewSessionUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/audit-sessions');
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionUrl.trim()) return;

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/audit-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_url: newSessionUrl.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewSessionUrl('');
        await fetchSessions();
        router.push('/audit');
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (error) {
      setError('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This will remove all crawled data and analysis results.')) {
      return;
    }

    try {
      const response = await fetch(`/api/audit-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSessions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete session');
      }
    } catch (error) {
      setError('Failed to delete session');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-gray-500',
      crawling: 'bg-blue-500',
      completed: 'bg-green-500',
      analyzing: 'bg-yellow-500',
      analyzed: 'bg-purple-500',
      error: 'bg-red-500'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-500'} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const goToAudit = () => {
    router.push('/audit');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">Create and manage your website audit sessions</p>
        </div>
        <Button onClick={goToAudit} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Go to Audit
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Create New Session */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Session</CardTitle>
          <CardDescription>
            Enter a website URL to start a new audit session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createSession} className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={newSessionUrl}
                onChange={(e) => setNewSessionUrl(e.target.value)}
                disabled={creating}
                required
              />
            </div>
            <Button type="submit" disabled={creating || !newSessionUrl.trim()}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Session
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Sessions</h2>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first session to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{session.base_url}</CardTitle>
                        <CardDescription>
                          Created: {new Date(session.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/audit?session=${session.id}`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{session.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pages Crawled</p>
                      <p className="font-medium">{session.pages_crawled || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                      <p className="font-medium">{session.pages_analyzed || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 