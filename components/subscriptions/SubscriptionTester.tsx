'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptions } from '@/lib/hooks/useSubscriptions';
import { PlanName, BillingCycle } from '@/lib/types/database';
import { toast } from 'react-toastify';
import { Crown, TestTube, RefreshCw, CheckCircle } from 'lucide-react';

export function SubscriptionTester() {
  const {
    subscriptions,
    activeSubscription,
    isLoading,
    error,
    createSubscription,
    switchActivePlan,
    refreshSubscriptions
  } = useSubscriptions();

  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const plans: Array<{ name: PlanName; cycle: BillingCycle }> = [
    { name: 'Starter', cycle: 'monthly' },
    { name: 'Starter', cycle: 'yearly' },
    { name: 'Professional', cycle: 'monthly' },
    { name: 'Professional', cycle: 'yearly' },
    { name: 'Enterprise', cycle: 'monthly' },
    { name: 'Enterprise', cycle: 'yearly' },
  ];

  const handleCreateTestSubscription = async (planName: PlanName, billingCycle: BillingCycle) => {
    const testId = `${planName}-${billingCycle}`;
    setIsCreating(testId);
    
    try {
      await createSubscription({
        plan_name: planName,
        billing_cycle: billingCycle,
        activate_immediately: false
      });

      toast.success(`${planName} ${billingCycle} subscription created!`);
      await refreshSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsCreating(null);
    }
  };

  const handleSwitchPlan = async (subscriptionId: string) => {
    setIsSwitching(subscriptionId);
    
    try {
      await switchActivePlan({ subscription_id: subscriptionId });
      toast.success('Plan switched successfully!');
      await refreshSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to switch plan');
    } finally {
      setIsSwitching(null);
    }
  };

  const runSystemTest = async () => {
    try {
      const response = await fetch('/api/subscriptions/test');
      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.data);
        toast.success('System test completed successfully!');
      } else {
        toast.error('System test failed');
      }
    } catch (error) {
      toast.error('Failed to run system test');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Subscription Tester
          </CardTitle>
          <CardDescription>Loading subscription data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Subscription Tester
        </CardTitle>
        <CardDescription>
          Test the subscription system functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Total Subscriptions</h3>
            <p className="text-2xl font-bold text-blue-600">{subscriptions.length}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Active Plan</h3>
            <p className="text-lg font-semibold">
              {activeSubscription ? activeSubscription.plan_name : 'None'}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">System Status</h3>
            <Badge className={error ? 'bg-red-500' : 'bg-green-500'}>
              {error ? 'Error' : 'Healthy'}
            </Badge>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runSystemTest} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run System Test
            </Button>
            <Button onClick={refreshSubscriptions} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {testResults && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2">Test Results</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Create Test Subscriptions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Create Test Subscriptions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {plans.map((plan) => {
              const testId = `${plan.name}-${plan.cycle}`;
              const userOwnsPlan = subscriptions.some(
                sub => sub.plan_name === plan.name && sub.billing_cycle === plan.cycle
              );
              
              return (
                <Button
                  key={testId}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateTestSubscription(plan.name, plan.cycle)}
                  disabled={isCreating === testId || userOwnsPlan}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  {isCreating === testId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  ) : userOwnsPlan ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Crown className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">{plan.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{plan.cycle}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Subscriptions */}
        {subscriptions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Subscriptions</h3>
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className={`p-4 border rounded-lg ${
                    subscription.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-500 text-white">
                        {subscription.plan_name}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {subscription.billing_cycle}
                      </Badge>
                      {subscription.is_active && (
                        <Badge className="bg-green-500 text-white">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(subscription.created_at)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Start:</span> {formatDate(subscription.start_date)}
                    </div>
                    <div>
                      <span className="font-medium">End:</span> {formatDate(subscription.end_date)}
                    </div>
                  </div>

                  {!subscription.is_active && (
                    <Button
                      size="sm"
                      onClick={() => handleSwitchPlan(subscription.id)}
                      disabled={isSwitching === subscription.id}
                    >
                      {isSwitching === subscription.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Activate Plan'
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
