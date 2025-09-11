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

interface PlatformFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
}

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: PlatformFeature[];
}

interface PlanEditorProps {
  onRefresh?: () => void;
}

// Predefined Platform Features
const PLATFORM_FEATURES: FeatureCategory[] = [
  {
    id: 'website_crawling',
    name: 'Website Crawling',
    description: 'Advanced website analysis and crawling capabilities',
    icon: '🔍',
    features: [
      {
        id: 'single_page_crawl',
        name: 'Single Page Crawl',
        description: 'Analyze one specific page',
        category: 'website_crawling',
        icon: '📄',
        enabled: false
      },
      {
        id: 'full_site_crawl',
        name: 'Full Site Crawl',
        description: 'Scan and audit all accessible pages',
        category: 'website_crawling',
        icon: '🌐',
        enabled: false
      },
      {
        id: 'hidden_urls_detection',
        name: 'Hidden URLs Detection',
        description: 'Identify unlinked or orphan pages',
        category: 'website_crawling',
        icon: '🔍',
        enabled: false
      }
    ]
  },
  {
    id: 'content_brand_insights',
    name: 'Content & Brand Insights',
    description: 'Content analysis and brand consistency checks',
    icon: '📑',
    features: [
      {
        id: 'brand_consistency_check',
        name: 'Brand Consistency Check',
        description: 'Ensure colors, fonts, and messaging align with brand guidelines',
        category: 'content_brand_insights',
        icon: '🎨',
        enabled: false
      },
      {
        id: 'grammar_content_analysis',
        name: 'Grammar & Content Analysis',
        description: 'Check for spelling, grammar, readability, and tone',
        category: 'content_brand_insights',
        icon: '📝',
        enabled: false
      },
      {
        id: 'seo_structure',
        name: 'SEO & Structure',
        description: 'Validate meta tags, heading hierarchy, schema markup, and keyword usage',
        category: 'content_brand_insights',
        icon: '🔍',
        enabled: false
      }
    ]
  },
  {
    id: 'security_compliance',
    name: 'Security & Compliance',
    description: 'Security audits and compliance checks',
    icon: '💳',
    features: [
      {
        id: 'stripe_public_key_detection',
        name: 'Stripe Public Key Detection',
        description: 'Identify exposed API keys',
        category: 'security_compliance',
        icon: '🔑',
        enabled: false
      },
      {
        id: 'google_tags_tracking_audit',
        name: 'Google Tags & Tracking Audit',
        description: 'Detect Google Analytics, Tag Manager, and third-party scripts',
        category: 'security_compliance',
        icon: '📊',
        enabled: false
      }
    ]
  },
  {
    id: 'media_asset_analysis',
    name: 'Media & Asset Analysis',
    description: 'Media optimization and asset management',
    icon: '🖼️',
    features: [
      {
        id: 'on_site_image_scan',
        name: 'On-Site Image Scan',
        description: 'Check alt tags, resolution, compression, and broken images',
        category: 'media_asset_analysis',
        icon: '🖼️',
        enabled: false
      },
      {
        id: 'link_scanner',
        name: 'Link Scanner',
        description: 'Validate internal/external links and detect broken redirects',
        category: 'media_asset_analysis',
        icon: '🔗',
        enabled: false
      },
      {
        id: 'social_share_preview',
        name: 'Social Share Preview',
        description: 'Generate how the site appears on platforms like Twitter, LinkedIn, and Facebook',
        category: 'media_asset_analysis',
        icon: '📱',
        enabled: false
      }
    ]
  },
  {
    id: 'technical_performance',
    name: 'Technical & Performance',
    description: 'Performance optimization and technical analysis',
    icon: '⚙️',
    features: [
      {
        id: 'performance_metrics',
        name: 'Performance Metrics',
        description: 'Page load time, Core Web Vitals, resource optimization',
        category: 'technical_performance',
        icon: '⚡',
        enabled: false
      },
      {
        id: 'ui_ux_quality_check',
        name: 'UI/UX Quality Check',
        description: 'Detect layout issues, responsiveness, and accessibility gaps',
        category: 'technical_performance',
        icon: '🎯',
        enabled: false
      },
      {
        id: 'technical_fix_recommendations',
        name: 'Technical Fix Recommendations',
        description: 'Actionable suggestions for speed, accessibility, and SEO',
        category: 'technical_performance',
        icon: '🔧',
        enabled: false
      }
    ]
  }
];

export function PlanEditor({ onRefresh }: PlanEditorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showFeatures, setShowFeatures] = useState<{ [key: string]: boolean }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ planId: string; planName: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlatformFeature[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Initialize plan features when editing plan changes
  useEffect(() => {
    if (editingPlan) {
      const initializedFeatures = initializePlanFeatures(editingPlan);
      console.log('Initializing plan features from useEffect:', initializedFeatures);
      setPlanFeatures(initializedFeatures);
    }
  }, [editingPlan]);

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

  // Helper function to get all features from all categories
  const getAllFeatures = (): PlatformFeature[] => {
    return PLATFORM_FEATURES.flatMap(category => category.features);
  };

  // Helper function to initialize plan features based on current plan features
  const initializePlanFeatures = (plan: Plan): PlatformFeature[] => {
    const allFeatures = getAllFeatures();
    return allFeatures.map(feature => ({
      ...feature,
      enabled: plan.features?.[feature.id] === true || false
    }));
  };

  // Helper function to toggle feature enabled state
  const toggleFeature = (featureId: string) => {
    console.log('Toggling feature:', featureId);
    setPlanFeatures(prev => {
      const updated = prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      );
      console.log('Updated features:', updated);
      return updated;
    });
  };

  // Helper function to get enabled features as object
  const getEnabledFeatures = (): Record<string, boolean> => {
    const enabledFeatures: Record<string, boolean> = {};
    planFeatures.forEach(feature => {
      if (feature.enabled) {
        enabledFeatures[feature.id] = true;
      }
    });
    return enabledFeatures;
  };

  const updatePlan = async (planId: string, updatedData: any) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      // Include enabled features in the update
      const enabledFeatures = getEnabledFeatures();
      const finalUpdateData = {
        ...updatedData,
        features: enabledFeatures
      };

      console.log('Updating plan with data:', finalUpdateData);
      console.log('Features being saved:', enabledFeatures);

      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalUpdateData)
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

  // Initialize plan features when editing starts
  const startEditing = (plan: Plan) => {
    setEditingPlan(plan);
    const initializedFeatures = initializePlanFeatures(plan);
    console.log('Initializing plan features:', initializedFeatures);
    setPlanFeatures(initializedFeatures);
    setUpdateError(null);
    setUpdateSuccess(null);
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
                    Platform Features ({Object.entries(plan.features || {}).filter(([_, enabled]) => enabled).length})
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
                    {PLATFORM_FEATURES.map(category => 
                      category.features.map(feature => {
                        const isEnabled = plan.features?.[feature.id] === true;
                        return (
                          <div key={feature.id} className={`flex items-center justify-between text-xs p-2 rounded ${
                            isEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{feature.icon}</span>
                              <span className={`font-medium ${isEnabled ? 'text-green-800' : 'text-gray-500'}`}>
                                {feature.name}
                        </span>
                      </div>
                            <span className={`text-xs ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                              {isEnabled ? '✓ Enabled' : '✗ Disabled'}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {Object.entries(plan.features || {}).filter(([_, enabled]) => enabled).length === 0 && (
                      <div className="text-center py-2 text-gray-500 text-xs">
                        No features enabled
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
                  onClick={() => startEditing(plan)}
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
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  is_active: (formData.get('is_active') as string) === 'on'
                };
                
                await updatePlan(editingPlan.id, updatedData);
              }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Basic Information</h4>
                    
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

                  {/* Platform Features */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-lg">Platform Features</h4>
                      <div className="text-sm text-gray-600">
                        {planFeatures.filter(f => f.enabled).length} of {planFeatures.length} enabled
                      </div>
                    </div>
                    
                    {/* Debug info - remove this later */}
                    <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded">
                      Debug: planFeatures.length = {planFeatures.length}, 
                      enabled = {planFeatures.filter(f => f.enabled).map(f => f.id).join(', ')}
                    </div>

                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {PLATFORM_FEATURES.map(category => (
                        <div key={category.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">{category.icon}</span>
                            <div>
                              <h5 className="font-medium text-lg">{category.name}</h5>
                              <p className="text-sm text-gray-600">{category.description}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.features.map(feature => {
                              const planFeature = planFeatures.find(f => f.id === feature.id);
                              const isEnabled = planFeature?.enabled || false;
                              console.log(`Feature ${feature.id}: planFeature=${planFeature}, isEnabled=${isEnabled}`);
                              
                              return (
                                <div
                                  key={feature.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    isEnabled 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => toggleFeature(feature.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleFeature(feature.id);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{feature.icon}</span>
                                        <h6 className="font-medium text-sm">{feature.name}</h6>
                                      </div>
                                      <p className="text-xs text-gray-600">{feature.description}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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