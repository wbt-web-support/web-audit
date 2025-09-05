"use client";

import { AuthDemo } from '@/components/auth/auth-demo';
import { ProjectDemo } from '@/components/projects/project-demo';
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DemoPage() {
  const { isAuthenticated, user, userTier, rateLimitInfo } = useAuthWithBackend();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Web Audit SaaS - Demo</h1>
          <p className="text-xl text-muted-foreground">
            Fastify Backend Integration with Supabase Authentication
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              {user && (
                <p className="text-sm text-muted-foreground mt-2">
                  {user.email}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">User Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">
                {userTier || "Unknown"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rate Limit</CardTitle>
            </CardHeader>
            <CardContent>
              {rateLimitInfo ? (
                <div className="text-sm space-y-1">
                  <p>Remaining: {rateLimitInfo.remaining}</p>
                  <p>Burst: {rateLimitInfo.burstRemaining}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Demo */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Authentication Demo</h2>
            <AuthDemo />
          </div>

          {/* Project Management Demo */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Project Management Demo</h2>
            <ProjectDemo />
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              How to configure and use this integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Environment Variables</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Set up your environment variables in <code>.env.local</code>:
              </p>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Backend Setup</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your Fastify backend is running on the configured URL and is set up to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                <li>Accept JWT tokens from Supabase in the Authorization header</li>
                <li>Validate tokens with Supabase</li>
                <li>Provide the required API endpoints (/projects, /auth, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Features</h3>
              <ul className="text-sm text-muted-foreground ml-4 list-disc">
                <li>Supabase authentication (sign up, sign in, sign out)</li>
                <li>JWT token management and automatic inclusion in API calls</li>
                <li>Project creation, management, and deletion</li>
                <li>Audit starting and status tracking</li>
                <li>User tier and rate limit information</li>
                <li>Error handling and user feedback</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
