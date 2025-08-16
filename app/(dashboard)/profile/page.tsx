'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, Mail, Globe, BarChart3, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { AuditProject } from '@/lib/types/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  totalProjects: number;
  activeProjects: number;
  totalPagesAnalyzed: number;
  averageScore: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Fetch profile data
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch projects data
      const projectsResponse = await fetch('/api/profile/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Fetch stats data
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'crawling':
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'crawling':
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your projects</p>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* User Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="font-medium">{profile?.full_name || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Member since:</span>
              <span className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last updated:</span>
              <span className="font-medium">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            View and manage your web audit projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {project.company_name || project.base_url}
                        </CardTitle>
                        {getStatusIcon(project.status)}
                      </div>
                      <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                        {project.base_url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Pages:</span>
                          <span>{project.pages_analyzed}/{project.total_pages}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Project</th>
                      <th className="text-left py-3 px-4 font-medium">URL</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Pages</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {project.company_name || 'Unnamed Project'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-muted-foreground max-w-xs truncate">
                            {project.base_url}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(project.status)}
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {project.pages_analyzed}/{project.total_pages}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/audit/${project.id}`}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
