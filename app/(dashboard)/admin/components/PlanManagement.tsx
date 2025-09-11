'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Users,
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  razorpay_plan_id: string;
  amount: number;
  interval: string;
  description: string;
  features: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  active_users: number;
  free_users: number;
  expired_users: number;
  cancelled_users: number;
}

interface PlanManagementProps {
  onRefresh?: () => void;
}

export function PlanManagement({ onRefresh }: PlanManagementProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPlans();
        onRefresh?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('An unexpected error occurred');
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        fetchPlans();
        onRefresh?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update plan status');
      }
    } catch (error) {
      console.error('Error updating plan status:', error);
      setError('An unexpected error occurred');
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && plan.is_active) ||
      (filterStatus === 'inactive' && !plan.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const formatAmount = (amount: number) => {
    if (amount === 0) return 'Free';
    return `₹${(amount / 100).toLocaleString()}`;
  };

  const getPlanColor = (amount: number) => {
    if (amount === 0) return 'bg-gray-100 text-gray-800';
    if (amount < 100000) return 'bg-blue-100 text-blue-800';
    if (amount < 200000) return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
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
              <Button onClick={fetchPlans}>Try Again</Button>
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
          <h2 className="text-2xl font-bold">Plan Management</h2>
          <p className="text-gray-600">Manage subscription plans and pricing</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              Available plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((sum, plan) => sum + plan.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((sum, plan) => sum + plan.active_users, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              With active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plans by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Plans</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          <Button onClick={fetchPlans} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {plan.description}
                  </CardDescription>
                </div>
                <Badge className={getPlanColor(plan.amount)}>
                  {formatAmount(plan.amount)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Plan Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Interval:</span>
                    <span className="capitalize">{plan.interval}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Razorpay ID:</span>
                    <span className="font-mono text-xs">{plan.razorpay_plan_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* User Statistics */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">User Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{plan.user_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium text-green-600">{plan.active_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free:</span>
                      <span className="font-medium text-gray-600">{plan.free_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expired:</span>
                      <span className="font-medium text-red-600">{plan.expired_users}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {plan.features && Object.keys(plan.features).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Key Features</h4>
                    <div className="space-y-1">
                      {plan.features.features && Array.isArray(plan.features.features) && 
                        plan.features.features.slice(0, 3).map((feature: string, index: number) => (
                          <div key={index} className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            {feature}
                          </div>
                        ))
                      }
                      {plan.features.features && plan.features.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{plan.features.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPlan(plan)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    className="flex-1"
                  >
                    {plan.is_active ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPlans.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No plans found</p>
            {(searchTerm || filterStatus !== 'all') && (
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            )}
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Plan</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const planData = {
                name: formData.get('name') as string,
                razorpay_plan_id: formData.get('razorpay_plan_id') as string,
                amount: parseInt(formData.get('amount') as string) * 100, // Convert to paise
                interval: formData.get('interval') as string,
                description: formData.get('description') as string,
                features: JSON.parse(formData.get('features') as string || '{}'),
                is_active: true
              };

              try {
                const response = await fetch('/api/admin/plans', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(planData)
                });

                if (response.ok) {
                  setShowCreateForm(false);
                  fetchPlans();
                  onRefresh?.();
                } else {
                  const errorData = await response.json();
                  setError(errorData.error || 'Failed to create plan');
                }
              } catch (error) {
                console.error('Error creating plan:', error);
                setError('An unexpected error occurred');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <Input name="name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Razorpay Plan ID</label>
                  <Input name="razorpay_plan_id" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <Input name="amount" type="number" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interval</label>
                  <select name="interval" className="w-full p-2 border rounded" required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" className="w-full p-2 border rounded" rows={3}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Features (JSON)</label>
                  <textarea name="features" className="w-full p-2 border rounded" rows={3} defaultValue='{"max_projects": 1, "screenshots": false}'></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Plan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Plan</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const planData = {
                name: formData.get('name') as string,
                razorpay_plan_id: formData.get('razorpay_plan_id') as string,
                amount: parseInt(formData.get('amount') as string) * 100, // Convert to paise
                interval: formData.get('interval') as string,
                description: formData.get('description') as string,
                features: JSON.parse(formData.get('features') as string || '{}'),
                is_active: formData.get('is_active') === 'on'
              };

              try {
                const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(planData)
                });

                if (response.ok) {
                  setEditingPlan(null);
                  fetchPlans();
                  onRefresh?.();
                } else {
                  const errorData = await response.json();
                  setError(errorData.error || 'Failed to update plan');
                }
              } catch (error) {
                console.error('Error updating plan:', error);
                setError('An unexpected error occurred');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <Input name="name" defaultValue={editingPlan.name} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Razorpay Plan ID</label>
                  <Input name="razorpay_plan_id" defaultValue={editingPlan.razorpay_plan_id} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <Input name="amount" type="number" defaultValue={editingPlan.amount / 100} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interval</label>
                  <select name="interval" className="w-full p-2 border rounded" defaultValue={editingPlan.interval} required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" className="w-full p-2 border rounded" rows={3} defaultValue={editingPlan.description}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Features (JSON)</label>
                  <textarea name="features" className="w-full p-2 border rounded" rows={3} defaultValue={JSON.stringify(editingPlan.features, null, 2)}></textarea>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="is_active" defaultChecked={editingPlan.is_active} className="mr-2" />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Plan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
