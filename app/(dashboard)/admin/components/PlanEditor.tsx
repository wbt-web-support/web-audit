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
  AlertTriangle,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  razorpay_plan_id: string;
  amount: number;
  interval: string;
  description: string;
  features: any;
  limitations: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  active_users: number;
  free_users: number;
  expired_users: number;
  cancelled_users: number;
}

interface PlanEditorProps {
  onRefresh?: () => void;
}

export function PlanEditor({ onRefresh }: PlanEditorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showFeatures, setShowFeatures] = useState<{ [key: string]: boolean }>({});
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureValue, setNewFeatureValue] = useState('');
  const [isAddingLimit, setIsAddingLimit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ planId: string; planName: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

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
        console.log('Fetched plans data:', data.plans);
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

  const updatePlan = async (planId: string, updatedData: any) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      console.log('Updating plan with data:', updatedData);
      console.log('Features being saved:', updatedData.features);

      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      const responseData = await response.json();

      if (response.ok) {
        setUpdateSuccess(`Plan "${updatedData.name}" updated successfully!`);
        setEditingPlan(null);
        await fetchPlans();
        onRefresh?.();
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(null), 3000);
      } else {
        console.error('Update failed:', responseData);
        setUpdateError(responseData.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      setUpdateError('An unexpected error occurred while updating the plan');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeletePlan = (planId: string, planName: string) => {
    setShowDeleteConfirm({ planId, planName });
  };

  const deletePlan = async () => {
    if (!showDeleteConfirm) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/plans/${showDeleteConfirm.planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPlans();
        onRefresh?.();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
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

  const isLimitKey = (key: string) => {
    const limitKeywords = [
      'max_', 'min_', 'limit', 'quota', 'threshold', 'capacity', 
      'rate', 'per_', 'allowed', 'restricted', 'constraint',
      'queue_priority', 'wait_time', 'api_calls', 'storage',
      'concurrent', 'timeout', 'retry', 'backoff'
    ];
    return limitKeywords.some(keyword => key.toLowerCase().includes(keyword));
  };

  const handleFeatureChange = (planId: string, featureKey: string, value: any, isLimit: boolean = false) => {
    setEditingPlan(prev => {
      if (!prev) return null;
      
      if (isLimit) {
        return {
          ...prev,
          limitations: {
            ...prev.limitations,
            [featureKey]: value
          }
        };
      } else {
        return {
          ...prev,
          features: {
            ...prev.features,
            [featureKey]: value
          }
        };
      }
    });
  };

  const addFeature = () => {
    if (!newFeatureKey.trim() || !editingPlan) return;
    
    let processedValue: any = newFeatureValue;
    
    // Smart parsing: try JSON first, then number, then boolean, then string
    try {
      processedValue = JSON.parse(newFeatureValue);
    } catch {
      if (!isNaN(Number(newFeatureValue)) && newFeatureValue !== '') {
        processedValue = Number(newFeatureValue);
      } else if (newFeatureValue.toLowerCase() === 'true') {
        processedValue = true;
      } else if (newFeatureValue.toLowerCase() === 'false') {
        processedValue = false;
      } else {
        processedValue = newFeatureValue;
      }
    }
    
    setEditingPlan(prev => {
      if (!prev) return null;
      
      if (isAddingLimit) {
        return {
          ...prev,
          limitations: {
            ...prev.limitations,
            [newFeatureKey]: processedValue
          }
        };
      } else {
        return {
          ...prev,
          features: {
            ...prev.features,
            [newFeatureKey]: processedValue
          }
        };
      }
    });
    
    // Reset form
    setNewFeatureKey('');
    setNewFeatureValue('');
    setIsAddingLimit(false);
    setShowAddFeatureModal(false);
  };

  const removeFeature = (planId: string, key: string, isLimit: boolean = false) => {
    setEditingPlan(prev => {
      if (!prev) return null;
      
      if (isLimit) {
        const newLimitations = { ...prev.limitations };
        delete newLimitations[key];
        return {
          ...prev,
          limitations: newLimitations
        };
      } else {
        const newFeatures = { ...prev.features };
        delete newFeatures[key];
        return {
          ...prev,
          features: newFeatures
        };
      }
    });
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
      {/* Success/Error Notifications */}
      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">{updateSuccess}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUpdateSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 font-medium">{updateError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUpdateError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Plan Editor</h2>
          <p className="text-gray-600">Edit plan details, features, and limits</p>
        </div>
        <Button onClick={fetchPlans} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getPlanColor(plan.amount)}>
                    {formatAmount(plan.amount)}
                  </Badge>
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Razorpay ID:</span>
                  <span className="font-mono text-xs">{plan.razorpay_plan_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interval:</span>
                  <span className="capitalize">{plan.interval}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Users:</span>
                  <span>{plan.user_count || 0}</span>
                </div>
              </div>

              {/* Features Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">
                    Features ({Object.entries(plan.features || {}).length})
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFeatures(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                  >
                    {showFeatures[plan.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                {showFeatures[plan.id] && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(plan.features || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs p-1 bg-blue-50 rounded">
                        <span className="text-muted-foreground font-medium">{key}:</span>
                        <span className="font-mono text-blue-800">
                          {typeof value === 'boolean' ? (value ? '✓' : '✗') : 
                           typeof value === 'object' ? JSON.stringify(value) : 
                           String(value)}
                        </span>
                      </div>
                    ))}
                    {Object.entries(plan.features || {}).length === 0 && (
                      <div className="text-center py-2 text-gray-500 text-xs">
                        No features added yet
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Limitations Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-600">
                    Limitations ({Object.entries(plan.limitations || {}).length})
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFeatures(prev => ({ ...prev, [`${plan.id}_limits`]: !prev[`${plan.id}_limits`] }))}
                  >
                    {showFeatures[`${plan.id}_limits`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                {showFeatures[`${plan.id}_limits`] && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(plan.limitations || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs p-1 bg-orange-50 rounded">
                        <span className="text-muted-foreground font-medium">{key}:</span>
                        <span className="font-mono text-orange-800">
                          {typeof value === 'boolean' ? (value ? '✓' : '✗') : 
                           typeof value === 'object' ? JSON.stringify(value) : 
                           String(value)}
                        </span>
                      </div>
                    ))}
                    {Object.entries(plan.limitations || {}).length === 0 && (
                      <div className="text-center py-2 text-gray-500 text-xs">
                        No limitations set yet
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPlan(plan);
                    setUpdateError(null);
                    setUpdateSuccess(null);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                  className={plan.is_active ? 'text-orange-600' : 'text-green-600'}
                >
                  {plan.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmDeletePlan(plan.id, plan.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
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

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Edit Plan: {editingPlan.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(null);
                    setUpdateError(null);
                    setUpdateSuccess(null);
                  }}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Error display in modal */}
              {updateError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 text-sm">{updateError}</p>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (isUpdating) return; // Prevent double submission
                
                const formData = new FormData(e.target as HTMLFormElement);
                const updatedData = {
                  name: formData.get('name') as string,
                  razorpay_plan_id: formData.get('razorpay_plan_id') as string,
                  amount: parseInt(formData.get('amount') as string) * 100,
                  interval: formData.get('interval') as string,
                  description: formData.get('description') as string,
                  features: editingPlan.features,
                  limitations: editingPlan.limitations,
                  is_active: (formData.get('is_active') as string) === 'on'
                };
                
                await updatePlan(editingPlan.id, updatedData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Basic Information</h4>
                    
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
                    
                    <div className="flex items-center">
                      <input type="checkbox" name="is_active" defaultChecked={editingPlan.is_active} className="mr-2" />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                  </div>

                  {/* Features Editor */}
                  <div className="space-y-6">
                    {/* Features Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-blue-600">Features</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingLimit(false);
                            setShowAddFeatureModal(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Feature
                        </Button>
                      </div>
                    
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-blue-50">
                        {Object.entries(editingPlan.features || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 p-3 border rounded bg-white">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
                                <Input
                                  value={key}
                                  onChange={(e) => {
                                    const newKey = e.target.value;
                                    const newFeatures = { ...editingPlan.features };
                                    delete newFeatures[key];
                                    newFeatures[newKey] = value;
                                    setEditingPlan(prev => prev ? { ...prev, features: newFeatures } : null);
                                  }}
                                  className="text-sm"
                                  placeholder="Feature key"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                                <Input
                                  value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  onChange={(e) => {
                                    let newValue: any = e.target.value;
                                    // Try to parse as JSON first, then number, then keep as string
                                    try {
                                      newValue = JSON.parse(e.target.value);
                                    } catch {
                                      if (!isNaN(Number(e.target.value)) && e.target.value !== '') {
                                        newValue = Number(e.target.value);
                                      } else if (e.target.value.toLowerCase() === 'true') {
                                        newValue = true;
                                      } else if (e.target.value.toLowerCase() === 'false') {
                                        newValue = false;
                                      } else {
                                        newValue = e.target.value;
                                      }
                                    }
                                    handleFeatureChange(editingPlan.id, key, newValue, false);
                                  }}
                                  className="text-sm"
                                  placeholder="Enter value (string, number, true/false, or JSON)"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFeature(editingPlan.id, key, false)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Remove feature"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        
                        {Object.entries(editingPlan.features || {}).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No features added yet</p>
                            <p className="text-xs">Click "Add Feature" to get started</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Limits Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-orange-600">Limits & Constraints</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingLimit(true);
                            setShowAddFeatureModal(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Limit
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-orange-50">
                        {Object.entries(editingPlan.limitations || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 p-3 border rounded bg-white">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
                                <Input
                                  value={key}
                                  onChange={(e) => {
                                    const newKey = e.target.value;
                                    const newLimitations = { ...editingPlan.limitations };
                                    delete newLimitations[key];
                                    newLimitations[newKey] = value;
                                    setEditingPlan(prev => prev ? { ...prev, limitations: newLimitations } : null);
                                  }}
                                  className="text-sm"
                                  placeholder="Limit key"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                                <Input
                                  value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  onChange={(e) => {
                                    let newValue: any = e.target.value;
                                    // Try to parse as JSON first, then number, then keep as string
                                    try {
                                      newValue = JSON.parse(e.target.value);
                                    } catch {
                                      if (!isNaN(Number(e.target.value)) && e.target.value !== '') {
                                        newValue = Number(e.target.value);
                                      } else if (e.target.value.toLowerCase() === 'true') {
                                        newValue = true;
                                      } else if (e.target.value.toLowerCase() === 'false') {
                                        newValue = false;
                                      } else {
                                        newValue = e.target.value;
                                      }
                                    }
                                    handleFeatureChange(editingPlan.id, key, newValue, true);
                                  }}
                                  className="text-sm"
                                  placeholder="Enter value (string, number, true/false, or JSON)"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFeature(editingPlan.id, key, true)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Remove limit"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        
                        {Object.entries(editingPlan.limitations || {}).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No limits set yet</p>
                            <p className="text-xs">Click "Add Limit" to get started</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingPlan(null)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Feature Modal */}
      {showAddFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isAddingLimit ? 'Add New Limit' : 'Add New Feature'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddFeatureModal(false);
                    setNewFeatureKey('');
                    setNewFeatureValue('');
                    setIsAddingLimit(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isAddingLimit ? 'Limit Key' : 'Feature Key'}
                  </label>
                  <Input
                    placeholder={isAddingLimit 
                      ? "e.g., max_projects, api_calls_per_month, queue_priority" 
                      : "e.g., screenshots, ai_analysis, priority_support"
                    }
                    value={newFeatureKey}
                    onChange={(e) => setNewFeatureKey(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <Input
                    placeholder="Enter value (string, number, true/false, or JSON)"
                    value={newFeatureValue}
                    onChange={(e) => setNewFeatureValue(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: "text", 10, true, false, ["item1", "item2"], {"{"}"key": "value"{"}"}
                  </p>
                </div>

                <div className={`p-3 rounded ${isAddingLimit ? 'bg-orange-50' : 'bg-blue-50'}`}>
                  <h4 className="text-sm font-medium mb-2">
                    {isAddingLimit ? 'Common Limit Examples:' : 'Common Feature Examples:'}
                  </h4>
                  <div className="text-xs space-y-1">
                    {isAddingLimit ? (
                      <>
                        <div><strong>max_projects:</strong> 10 (number)</div>
                        <div><strong>api_calls_per_month:</strong> 1000 (number)</div>
                        <div><strong>queue_priority:</strong> 2 (number)</div>
                        <div><strong>storage_gb:</strong> 10 (number)</div>
                        <div><strong>concurrent_requests:</strong> 5 (number)</div>
                        <div><strong>limits:</strong> {`{"api_calls": 1000, "storage_gb": 10}`} (object)</div>
                      </>
                    ) : (
                      <>
                        <div><strong>screenshots:</strong> true (boolean)</div>
                        <div><strong>ai_analysis:</strong> true (boolean)</div>
                        <div><strong>priority_support:</strong> true (boolean)</div>
                        <div><strong>features:</strong> ["SEO Analysis", "Screenshots"] (array)</div>
                        <div><strong>support_level:</strong> "Email" (string)</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddFeatureModal(false);
                    setNewFeatureKey('');
                    setNewFeatureValue('');
                    setIsAddingLimit(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={addFeature}
                  disabled={!newFeatureKey.trim() || !newFeatureValue.trim()}
                >
                  Add Feature
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Delete Plan</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete <strong>"{showDeleteConfirm.planName}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">This will:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Remove all queue priorities for this plan</li>
                    <li>• Delete all subscriptions for this plan</li>
                    <li>• Reset all users on this plan to free tier</li>
                    <li>• Permanently delete the plan configuration</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={deletePlan}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}