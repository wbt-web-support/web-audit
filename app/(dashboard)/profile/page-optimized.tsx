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
  CheckCircle, 
  AlertCircle, 
  XCircle,
  CreditCard,
  Shield,
  HelpCircle,
  Crown,
  Zap,
  Star,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons';
import { useProfileData } from '@/lib/hooks';

export default function ProfilePage() {
  const { data, loading, error, refetch } = useProfileData();
  const { profile, projects, stats } = data;
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state for profile updates
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Update fullName when profile data loads
  useEffect(() => {
    if (profile?.full_name && fullName !== profile.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name, fullName]);
  
  // Check if form has been modified
  const isFormDirty = fullName !== (profile?.full_name || '');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'crawling':
      case 'analyzing':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
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

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setSaveMessage({ type: 'error', text: 'Full name is required' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (response.ok) {
        await refetch(); // Refresh data from cache
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setSaveMessage({ type: 'error', text: errorData.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const isOAuthUser = profile?.auth_method === 'google';
    
    // For OAuth users, only validate new password fields
    if (!isOAuthUser) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'All fields are required' });
        return;
      }
    } else {
      if (!newPassword || !confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'New password and confirmation are required' });
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: isOAuthUser ? undefined : currentPassword,
          newPassword,
          confirmPassword,
          isOAuthUser,
        }),
      });
      
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPasswordMessage(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setPasswordMessage({ 
          type: 'error', 
          text: `${errorData.error || 'Failed to update password'}${errorData.details ? `: ${errorData.details}` : ''}` 
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetPasswordForm = () => {
    // Clear password form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(null);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full px-6 py-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={profile?.email || ''} 
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

              {/* Authentication Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Sign-in Method</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {profile?.auth_method === 'google' ? (
                      <>
                        <Globe className="h-4 w-4 text-blue-500" />
                        <span>Google Account</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>Email & Password</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password Status</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {profile?.has_password ? (
                      <>
                        <Lock className="h-4 w-4 text-green-500" />
                        <span>Password Set</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-yellow-500" />
                        <span>No Password</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {saveMessage && (
                <div className={`p-3 rounded-md ${
                  saveMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {saveMessage.text}
                </div>
              )}
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !isFormDirty}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFullName(profile?.full_name || '');
                    setSaveMessage(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
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
                {/* Show current password field only for email/password users */}
                {!profile?.auth_method && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
                )}

                {/* Show OAuth info for Google users */}
                {profile?.auth_method === 'google' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">Google Account</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      You're signed in with Google. You can set a password to also sign in with email and password.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  {newPassword && (
                    <div className="text-xs text-muted-foreground">
                      {newPassword.length < 6 ? (
                        <span className="text-red-500">Password too short (minimum 6 characters)</span>
                      ) : newPassword.length < 8 ? (
                        <span className="text-yellow-500">Password strength: Weak</span>
                      ) : newPassword.length < 12 ? (
                        <span className="text-blue-500">Password strength: Medium</span>
                      ) : (
                        <span className="text-green-500">Password strength: Strong</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {confirmPassword && newPassword && (
                    <div className="text-xs">
                      {confirmPassword === newPassword ? (
                        <span className="text-green-500">✓ Passwords match</span>
                      ) : (
                        <span className="text-red-500">✗ Passwords do not match</span>
                      )}
                    </div>
                  )}
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded-md ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword || 
                      (!profile?.auth_method && !currentPassword) || 
                      !newPassword || 
                      !confirmPassword || 
                      newPassword !== confirmPassword || 
                      newPassword.length < 6
                    }
                  >
                    {isChangingPassword ? 'Updating...' : profile?.auth_method === 'google' ? 'Set Password' : 'Update Password'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResetPasswordForm}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="text-center pt-2 space-y-2">
                  <Button 
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => window.location.href = '/auth/forgot-password'}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
