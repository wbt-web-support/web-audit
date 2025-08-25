'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserSubscription, PlanName, BillingCycle } from '@/lib/types/database';
import { PricingPlan, getPlanById } from '@/lib/pricing';
import { toast } from 'react-toastify';
import { Crown, Check, Clock, Calendar, Zap, Star, ArrowRight, CreditCard, Shield, Users, Zap as ZapIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setActiveSubscription, addSubscription, setLoading, setError } from '@/lib/store/slices/subscriptionSlice';

interface SubscriptionManagerProps {
  plans: PricingPlan[];
  billingPeriod: string;
  onBillingPeriodChange: (period: string) => void;
}

export function SubscriptionManager({ 
  plans, 
  billingPeriod, 
  onBillingPeriodChange 
}: SubscriptionManagerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks unconditionally
  const dispatch = useAppDispatch();
  const subscriptionState = useAppSelector(state => state.subscription);
  
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use Redux data after component is mounted to prevent hydration issues
  const subscriptions = mounted ? subscriptionState?.subscriptions || [] : [];
  const activeSubscription = mounted ? subscriptionState?.activeSubscription || null : null;
  const isLoading = mounted ? subscriptionState?.isLoading || false : false;
  const error = mounted ? subscriptionState?.error || null : null;

  const handlePurchaseWithStripe = async (planName: PlanName, billingCycle: BillingCycle) => {
    const planId = planName.toLowerCase();
    setIsCreating(planId);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_name: planName,
          billing_cycle: billingCycle,
          success_url: `${window.location.origin}/profile?success=true`,
          cancel_url: `${window.location.origin}/profile?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = sessionUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate purchase');
      setIsCreating(null);
    }
  };

  const handleSwitchActivePlan = async (subscriptionId: string) => {
    setIsSwitching(subscriptionId);
    
    try {
      const response = await fetch('/api/subscriptions/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch active plan');
      }

      const data = await response.json();
      
      // Update Redux state instantly
      dispatch(setActiveSubscription(data.data));
      
      toast.success('Active plan switched successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to switch active plan');
    } finally {
      setIsSwitching(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = (planName: PlanName) => {
    const plan = getPlanById(planName.toLowerCase());
    return plan?.name || planName;
  };

  const getPlanColor = (planName: PlanName) => {
    switch (planName) {
      case 'Enterprise':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white';
      case 'Professional':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white';
      case 'Starter':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
    }
  };

  const getPlanIcon = (planName: PlanName) => {
    switch (planName) {
      case 'Enterprise':
        return <Crown className="h-5 w-5" />;
      case 'Professional':
        return <Star className="h-5 w-5" />;
      case 'Starter':
        return <ZapIcon className="h-5 w-5" />;
      default:
        return <Crown className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Connection Error</h3>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Active Subscription */}
      {activeSubscription && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-800">
              <Zap className="h-6 w-6" />
              Active Subscription
            </CardTitle>
            <CardDescription className="text-green-700">
              You're currently using the {getPlanDisplayName(activeSubscription.plan_name)} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getPlanColor(activeSubscription.plan_name)}`}>
                  {getPlanIcon(activeSubscription.plan_name)}
                </div>
                <div>
                  <p className="font-semibold">{getPlanDisplayName(activeSubscription.plan_name)}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {activeSubscription.billing_cycle} billing
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Started</p>
                <p className="font-semibold">{formatDate(activeSubscription.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires</p>
                <p className="font-semibold">{formatDate(activeSubscription.end_date)}</p>
              </div>
              <div className="flex items-center">
                <Badge className="bg-green-600 text-white px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600">Select the perfect plan for your needs</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const userOwnsPlan = subscriptions.some(
              (sub: UserSubscription) => sub.plan_name.toLowerCase() === plan.id
            );
            const isUserPlanActive = subscriptions.some(
              (sub: UserSubscription) => sub.plan_name.toLowerCase() === plan.id && sub.is_active
            );

            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
                } ${isUserPlanActive ? 'border-green-500 bg-green-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-xl ${getPlanColor(plan.name as PlanName)}`}>
                      {getPlanIcon(plan.name as PlanName)}
                    </div>
                    {isUserPlanActive && (
                      <Badge className="bg-green-600 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">${plan.price}</div>
                    <div className="text-sm text-muted-foreground">per {plan.period.split(' ')[0]}</div>
                    {billingPeriod === 'year' && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        Save 20% with yearly billing
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {userOwnsPlan ? (
                      isUserPlanActive ? (
                        <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Currently Active
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => {
                            const subscription = subscriptions.find(
                              (sub: UserSubscription) => sub.plan_name.toLowerCase() === plan.id
                            );
                            if (subscription) {
                              handleSwitchActivePlan(subscription.id);
                            }
                          }}
                          disabled={isSwitching !== null}
                        >
                          {isSwitching !== null ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Activate Plan
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        onClick={() => handlePurchaseWithStripe(
                          plan.name as PlanName, 
                          billingPeriod === 'year' ? 'yearly' : 'monthly'
                        )}
                        disabled={isCreating === plan.id}
                      >
                        {isCreating === plan.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Get Started
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* User's Subscriptions */}
      {subscriptions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Subscription History</h3>
          <div className="grid gap-4">
            {subscriptions.map((subscription: UserSubscription) => (
              <Card
                key={subscription.id}
                className={`transition-all ${
                  subscription.is_active
                    ? 'border-green-500 bg-green-50'
                    : 'hover:border-gray-300'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getPlanColor(subscription.plan_name)}`}>
                        {getPlanIcon(subscription.plan_name)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{subscription.plan_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subscription.billing_cycle} billing
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Purchased</p>
                        <p className="font-medium">{formatDate(subscription.created_at)}</p>
                      </div>
                      
                      {subscription.is_active ? (
                        <Badge className="bg-green-600 text-white">
                          <Zap className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSwitchActivePlan(subscription.id)}
                          disabled={isSwitching === subscription.id}
                        >
                          {isSwitching === subscription.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Activate'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
