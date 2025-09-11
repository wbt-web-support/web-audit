'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Filter, 
  Edit, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  CreditCard,
  Calendar,
  Settings,
  UserCheck,
  UserX
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'admin';
  plan_status: string;
  plan_start_date: string | null;
  plan_end_date: string | null;
  queue_priority: number;
  created_at: string;
  updated_at: string;
  plans: {
    id: string;
    name: string;
    amount: number;
    interval: string;
    features: any;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  interval: string;
  features: any;
}

interface UserPlanManagementProps {
  onRefresh?: () => void;
}

export function UserPlanManagement({ onRefresh }: UserPlanManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and plans in parallel
      const [usersResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/users/plans'),
        fetch('/api/admin/plans')
      ]);

      if (usersResponse.ok && plansResponse.ok) {
        const usersData = await usersResponse.json();
        const plansData = await plansResponse.json();
        
        setUsers(usersData.users || []);
        setPlans(plansData.plans || []);
      } else {
        const errorData = await usersResponse.json();
        setError(errorData.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, planId: string, planStatus: string = 'active') => {
    try {
      setUpdatingUser(userId);
      
      const response = await fetch('/api/admin/users/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId,
          planStatus
        })
      });

      if (response.ok) {
        fetchData();
        onRefresh?.();
        setShowUpdateModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update user plan');
      }
    } catch (error) {
      console.error('Error updating user plan:', error);
      setError('An unexpected error occurred');
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = filterPlan === 'all' || 
      (user.plans && user.plans.id === filterPlan) ||
      (filterPlan === 'no-plan' && !user.plans);
    
    const matchesStatus = filterStatus === 'all' || user.plan_status === filterStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const formatAmount = (amount: number) => {
    if (amount === 0) return 'Free';
    return `₹${(amount / 100).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-purple-100 text-purple-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Enterprise';
      case 2: return 'Pro';
      case 3: return 'Free';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Plan Management</h2>
          <p className="text-gray-600">Manage user subscriptions and plan assignments</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              With active plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_status === 'free').length}
            </div>
            <p className="text-xs text-muted-foreground">
              On free plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired/Cancelled</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_status === 'expired' || u.plan_status === 'cancelled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Inactive subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Plans</option>
            <option value="no-plan">No Plan</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="free">Free</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>User Plans</CardTitle>
          <CardDescription>
            Manage user subscriptions and plan assignments. Found {filteredUsers.length} users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Plan Info */}
                  <div className="text-right">
                    <div className="font-medium">
                      {user.plans ? user.plans.name : 'No Plan'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.plans ? formatAmount(user.plans.amount) : 'Free'}
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(user.plan_status)}>
                      {user.plan_status}
                    </Badge>
                    <Badge className={getPriorityColor(user.queue_priority)}>
                      {getPriorityLabel(user.queue_priority)}
                    </Badge>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUpdateModal(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Update Plan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                {(searchTerm || filterPlan !== 'all' || filterStatus !== 'all') && (
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Plan Modal */}
      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Update User Plan</CardTitle>
              <CardDescription>
                Update plan for {selectedUser.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Plan</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    onChange={(e) => {
                      const planId = e.target.value;
                      if (planId) {
                        updateUserPlan(selectedUser.id, planId);
                      }
                    }}
                    disabled={updatingUser === selectedUser.id}
                  >
                    <option value="">Select a plan...</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatAmount(plan.amount)}/{plan.interval}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowUpdateModal(false);
                      setSelectedUser(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
