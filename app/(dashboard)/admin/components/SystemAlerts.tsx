'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

interface SystemAlertsProps {
  alerts: SystemAlert[];
}

export function SystemAlerts({ alerts }: SystemAlertsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    expires_at: '',
    is_active: true
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && alert.is_active) || 
      (filterStatus === 'inactive' && !alert.is_active);
    return matchesType && matchesStatus;
  });

  const activeAlerts = alerts.filter(alert => alert.is_active);
  const expiredAlerts = alerts.filter(alert => 
    alert.expires_at && new Date(alert.expires_at) < new Date()
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800'
    };
    return variants[type as keyof typeof variants] || 'bg-blue-100 text-blue-800';
  };

  const handleCreateAlert = () => {
    // Here you would typically make an API call to create the alert
    console.log('Creating alert:', formData);
    setShowCreateForm(false);
    setFormData({ title: '', message: '', type: 'info', expires_at: '', is_active: true });
  };

  const handleEditAlert = (alert: SystemAlert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      expires_at: alert.expires_at || '',
      is_active: alert.is_active
    });
    setShowCreateForm(true);
  };

  const handleUpdateAlert = () => {
    // Here you would typically make an API call to update the alert
    console.log('Updating alert:', editingAlert?.id, formData);
    setShowCreateForm(false);
    setEditingAlert(null);
    setFormData({ title: '', message: '', type: 'info', expires_at: '', is_active: true });
  };

  const handleToggleAlert = (alertId: string) => {
    // Here you would typically make an API call to toggle the alert status
    console.log('Toggling alert:', alertId);
  };

  const handleDeleteAlert = (alertId: string) => {
    // Here you would typically make an API call to delete the alert
    console.log('Deleting alert:', alertId);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="text-xs text-muted-foreground">
              All alerts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <div className="text-xs text-muted-foreground">
              Currently visible
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Alerts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredAlerts.length}</div>
            <div className="text-xs text-muted-foreground">
              Past expiration
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Types</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <div className="text-xs text-muted-foreground">
              Info, Warning, Error, Success
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </CardTitle>
            <CardDescription>
              {editingAlert ? 'Update the alert details' : 'Create a new system-wide alert'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Alert title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Alert message content"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Expires At (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active (Visible to users)
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={editingAlert ? handleUpdateAlert : handleCreateAlert}
                  className="flex items-center gap-2"
                >
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAlert(null);
                    setFormData({ title: '', message: '', type: 'info', expires_at: '', is_active: true });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>
            Manage system-wide alerts and notifications. Found {filteredAlerts.length} alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(alert.type)}
                  </div>
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground max-w-md truncate">
                      {alert.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                      {alert.expires_at && (
                        <span> • Expires {new Date(alert.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getTypeBadge(alert.type)}>
                    {alert.type}
                  </Badge>
                  <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                    {alert.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAlert(alert.id)}
                    >
                      {alert.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAlert(alert)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts found</p>
                {(filterType !== 'all' || filterStatus !== 'all') && (
                  <p className="text-sm">Try adjusting your filter criteria</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
