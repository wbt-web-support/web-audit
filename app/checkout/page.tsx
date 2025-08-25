'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, CreditCard, Shield } from 'lucide-react';
import { getPlanById, getPlanDisplayPrice } from '@/lib/pricing';
import { toast } from 'react-toastify';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [canPurchase, setCanPurchase] = useState(true);
  
  const planId = searchParams.get('plan');
  const billingPeriod = searchParams.get('period') || 'month';
  
  const plan = planId ? getPlanById(planId) : null;

  // Calculate price based on billing period
  const yearlyDiscountPercent = parseInt(process.env.NEXT_PUBLIC_YEARLY_DISCOUNT_PERCENT || '20');
  const getPlanPrice = (basePrice: number, period: string) => {
    if (period === 'year' || period === 'yearly' || period === 'annual') {
      const discountMultiplier = (100 - yearlyDiscountPercent) / 100;
      return Math.round(basePrice * 12 * discountMultiplier);
    }
    return basePrice;
  };

  const finalPrice = plan ? getPlanPrice(plan.price, billingPeriod) : 0;
  const isYearly = billingPeriod === 'year' || billingPeriod === 'yearly' || billingPeriod === 'annual';

  // Check if user already owns this plan
  useEffect(() => {
    const checkPlanOwnership = async () => {
      if (!planId) return;
      
      try {
        const response = await fetch('/api/profile/user-plans');
        if (response.ok) {
          const userPlans = await response.json();
          const userOwnsPlan = userPlans.some((userPlan: any) => userPlan.planId === planId);
          
          if (userOwnsPlan) {
            setCanPurchase(false);
            setError(`You already own the ${plan?.name} plan. You can activate it from your profile instead of purchasing it again.`);
            toast.error(`You already own the ${plan?.name} plan. You can activate it from your profile instead of purchasing it again.`);
          }
        }
      } catch (error) {
        console.error('Error checking plan ownership:', error);
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkPlanOwnership();
  }, [planId, plan?.name]);

  const handleCheckout = async () => {
    if (!plan || !canPurchase) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          billingPeriod: billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Plan</h2>
            <p className="text-muted-foreground mb-4">
              The selected plan could not be found.
            </p>
            <Button onClick={() => router.push('/profile')}>
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingOwnership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Checking Plan Status</h2>
            <p className="text-muted-foreground">
              Verifying your current plan status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Purchase</CardTitle>
            <CardDescription>
              Upgrade to the {plan.name} plan and unlock premium features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{plan.name} Plan</h3>
                <Badge variant="secondary">
                  {isYearly ? 'Yearly' : 'Monthly'} Billing
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Plan Price</span>
                  <span>{getPlanDisplayPrice({ ...plan, price: plan.price })}/{isYearly ? 'year' : 'month'}</span>
                </div>
                
                {isYearly && (
                  <div className="flex justify-between text-green-600">
                    <span>Yearly Discount ({yearlyDiscountPercent}%)</span>
                    <span>-{getPlanDisplayPrice({ ...plan, price: Math.round(plan.price * 12 * (yearlyDiscountPercent / 100)) })}</span>
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{getPlanDisplayPrice({ ...plan, price: finalPrice })}/{isYearly ? 'year' : 'month'}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-3">What's included:</h4>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    +{plan.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Secure Payment</p>
                <p className="text-muted-foreground">
                  Your payment is processed securely by Stripe. We never store your card details.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleCheckout}
                disabled={loading || !canPurchase}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By proceeding, you agree to our Terms of Service and Privacy Policy. 
              You can cancel your subscription at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
