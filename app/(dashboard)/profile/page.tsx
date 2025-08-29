'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Calendar, 
  Mail, 
  Globe, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  CreditCard,
  Shield,
  HelpCircle,
  Settings,
  Crown,
  Zap,
  Star,
  Lock,
  Key,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      <div className="w-full px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, plans, billing, and get support</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Stats */}
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

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    defaultValue={profile?.full_name || ''} 
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    defaultValue={profile?.email || ''} 
                    placeholder="Enter your email"
                    disabled
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your latest web audit projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((project) => (
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-gray-400" />
                  Free
                </CardTitle>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5 projects per month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    100 pages per project
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Basic analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email support
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Current Plan</Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-blue-200 bg-blue-50/50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Pro
                </CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    1000 pages per project
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Custom reports
                  </li>
                </ul>
                <Button className="w-full">Upgrade to Pro</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Enterprise
                </CardTitle>
                <div className="text-3xl font-bold">Custom</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Everything in Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited pages
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    API access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Dedicated support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Custom integrations
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Free Plan</div>
                    <div className="text-sm text-muted-foreground">$0/month</div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projects used:</span>
                    <span>{stats?.totalProjects || 0}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((stats?.totalProjects || 0) / 5 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Upgrade Plan</Button>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <div className="font-medium">No payment method</div>
                      <div className="text-sm text-muted-foreground">Add a payment method to upgrade</div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Add Payment Method</Button>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Your recent invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No billing history available</p>
                <p className="text-sm">Billing history will appear here once you upgrade to a paid plan</p>
              </div>
            </CardContent>
          </Card>
                 </TabsContent>

         {/* Security Tab */}
         <TabsContent value="security" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Password Management */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Lock className="h-5 w-5" />
                   Password Management
                 </CardTitle>
                 <CardDescription>
                   Update your password to keep your account secure
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="currentPassword">Current Password</Label>
                   <div className="relative">
                     <Input 
                       id="currentPassword" 
                       type={showPassword ? "text" : "password"}
                       placeholder="Enter current password"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? (
                         <EyeOff className="h-4 w-4" />
                       ) : (
                         <Eye className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="newPassword">New Password</Label>
                   <div className="relative">
                     <Input 
                       id="newPassword" 
                       type={showNewPassword ? "text" : "password"}
                       placeholder="Enter new password"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                       onClick={() => setShowNewPassword(!showNewPassword)}
                     >
                       {showNewPassword ? (
                         <EyeOff className="h-4 w-4" />
                       ) : (
                         <Eye className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="confirmPassword">Confirm New Password</Label>
                   <div className="relative">
                     <Input 
                       id="confirmPassword" 
                       type={showConfirmPassword ? "text" : "password"}
                       placeholder="Confirm new password"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     >
                       {showConfirmPassword ? (
                         <EyeOff className="h-4 w-4" />
                       ) : (
                         <Eye className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                 </div>
                 
                 <div className="flex gap-4">
                   <Button>Update Password</Button>
                   <Button variant="outline">Cancel</Button>
                 </div>
               </CardContent>
             </Card>

             {/* Two-Factor Authentication */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Smartphone className="h-5 w-5" />
                   Two-Factor Authentication
                 </CardTitle>
                 <CardDescription>
                   Add an extra layer of security to your account
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <Smartphone className="h-6 w-6 text-muted-foreground" />
                     <div>
                       <div className="font-medium">Authenticator App</div>
                       <div className="text-sm text-muted-foreground">Use Google Authenticator or similar</div>
                     </div>
                   </div>
                   <Badge variant="secondary">Not Enabled</Badge>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <Mail className="h-6 w-6 text-muted-foreground" />
                     <div>
                       <div className="font-medium">Email Verification</div>
                       <div className="text-sm text-muted-foreground">Receive codes via email</div>
                     </div>
                   </div>
                   <Badge variant="secondary">Not Enabled</Badge>
                 </div>
                 
                 <Button variant="outline" className="w-full">Enable 2FA</Button>
               </CardContent>
             </Card>
           </div>

           {/* Security Settings */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Settings className="h-5 w-5" />
                 Security Settings
               </CardTitle>
               <CardDescription>
                 Manage your account security preferences
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <div className="font-medium">Login Notifications</div>
                     <div className="text-sm text-muted-foreground">Get notified of new login attempts</div>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="loginNotifications"
                       className="rounded border-gray-300"
                       defaultChecked
                     />
                     <Label htmlFor="loginNotifications" className="sr-only">Enable login notifications</Label>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <div className="font-medium">Session Timeout</div>
                     <div className="text-sm text-muted-foreground">Automatically log out after inactivity</div>
                   </div>
                                       <select className="rounded border border-gray-300 px-3 py-2 text-sm" defaultValue="60">
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="240">4 hours</option>
                    </select>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <div className="font-medium">Device Management</div>
                     <div className="text-sm text-muted-foreground">View and manage active sessions</div>
                   </div>
                   <Button variant="outline" size="sm">Manage Devices</Button>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Recent Activity */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Clock className="h-5 w-5" />
                 Recent Login Activity
               </CardTitle>
               <CardDescription>
                 Monitor your account access and detect suspicious activity
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <div>
                       <div className="font-medium">Current Session</div>
                       <div className="text-sm text-muted-foreground">Windows • Chrome • 192.168.1.100</div>
                       <div className="text-xs text-muted-foreground">Active now</div>
                     </div>
                   </div>
                   <Badge className="bg-green-100 text-green-800">Active</Badge>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                     <div>
                       <div className="font-medium">Previous Session</div>
                       <div className="text-sm text-muted-foreground">MacOS • Safari • 192.168.1.101</div>
                       <div className="text-xs text-muted-foreground">2 hours ago</div>
                     </div>
                   </div>
                   <Badge variant="secondary">Ended</Badge>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                     <div>
                       <div className="font-medium">Mobile Session</div>
                       <div className="text-sm text-muted-foreground">iOS • Safari • 203.0.113.45</div>
                       <div className="text-xs text-muted-foreground">Yesterday</div>
                     </div>
                   </div>
                   <Badge variant="secondary">Ended</Badge>
                 </div>
               </div>
               
               <div className="mt-4 pt-4 border-t">
                 <Button variant="outline" className="w-full">View All Activity</Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         {/* Help & Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">How to create a new project?</div>
                    <div className="text-sm text-muted-foreground">Learn how to start your first web audit</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Understanding audit results</div>
                    <div className="text-sm text-muted-foreground">Learn how to interpret your audit findings</div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Upgrading your plan</div>
                    <div className="text-sm text-muted-foreground">Learn about our different plan options</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-muted-foreground">support@webaudit.com</div>
                    <div className="text-xs text-muted-foreground mt-1">Response within 24 hours</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Live Chat</div>
                    <div className="text-sm text-muted-foreground">Available during business hours</div>
                    <div className="text-xs text-muted-foreground mt-1">Mon-Fri, 9AM-6PM EST</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Documentation</div>
                    <div className="text-sm text-muted-foreground">Comprehensive guides and tutorials</div>
                    <div className="text-xs text-muted-foreground mt-1">Always available</div>
                  </div>
                </div>
                <Button className="w-full">Contact Support</Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="font-medium mb-2">What is a web audit?</div>
                  <div className="text-sm text-muted-foreground">
                    A web audit is a comprehensive analysis of your website's performance, SEO, accessibility, and user experience to identify areas for improvement.
                  </div>
                </div>
                <div className="border-b pb-4">
                  <div className="font-medium mb-2">How long does an audit take?</div>
                  <div className="text-sm text-muted-foreground">
                    The duration depends on the size of your website. Small sites (under 50 pages) typically complete within 10-15 minutes, while larger sites may take 30-60 minutes.
                  </div>
                </div>
                <div className="border-b pb-4">
                  <div className="font-medium mb-2">Can I export my audit results?</div>
                  <div className="text-sm text-muted-foreground">
                    Yes, all audit results can be exported as PDF reports. Pro and Enterprise users can also export data in CSV format for further analysis.
                  </div>
                </div>
                <div className="pb-4">
                  <div className="font-medium mb-2">Is my data secure?</div>
                  <div className="text-sm text-muted-foreground">
                    Absolutely. We use industry-standard encryption and security measures to protect your data. We never share your information with third parties.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
