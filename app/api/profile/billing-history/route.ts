import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanById } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's billing history from database
    const { data: billingHistoryData, error: billingHistoryError } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (billingHistoryError) {
      console.error('Error fetching billing history:', billingHistoryError);
      return NextResponse.json({ error: 'Failed to fetch billing history' }, { status: 500 });
    }

    // Format the billing history
    const billingHistory = billingHistoryData?.map((item) => {
      return {
        id: item.id,
        date: item.created_at,
        amount: `$${item.amount.toFixed(2)}`,
        amount_numeric: parseFloat(item.amount), // Add numeric amount for calculations
        status: item.status as 'completed' | 'pending' | 'failed' | 'refunded',
        description: item.description,
        plan_name: item.plan_name,
        billing_period: item.billing_period,
        invoice_url: item.invoice_url,
        payment_method: item.payment_method
      };
    }) || [];

    // Add some mock data for demonstration (remove this in production)
    if (billingHistory.length === 0) {
      billingHistory.push(
        {
          id: 'mock-1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          amount: '$79.00',
          amount_numeric: 79.00,
          status: 'completed',
          description: 'Professional Plan - March 2024',
          plan_name: 'Professional',
          billing_period: 'month',
          invoice_url: 'https://dashboard.stripe.com/invoices/mock-1',
          payment_method: 'Credit Card'
        },
        {
          id: 'mock-2',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          amount: '$79.00',
          amount_numeric: 79.00,
          status: 'completed',
          description: 'Professional Plan - February 2024',
          plan_name: 'Professional',
          billing_period: 'month',
          invoice_url: 'https://dashboard.stripe.com/invoices/mock-2',
          payment_method: 'Credit Card'
        },
        {
          id: 'mock-3',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
          amount: '$29.00',
          amount_numeric: 29.00,
          status: 'completed',
          description: 'Starter Plan - January 2024',
          plan_name: 'Starter',
          billing_period: 'month',
          invoice_url: 'https://dashboard.stripe.com/invoices/mock-3',
          payment_method: 'Credit Card'
        }
      );
    }

    // Calculate totals AFTER adding mock data (if any)
    const completedPayments = billingHistory.filter(item => item.status === 'completed');
    const totalSpent = completedPayments.reduce((sum, item) => sum + item.amount_numeric, 0);
    const totalPayments = completedPayments.length;
    
    // Calculate last payment date
    const lastPayment = completedPayments.length > 0 
      ? completedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    const lastPaymentDate = lastPayment ? new Date(lastPayment.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : 'Never';

    return NextResponse.json({
      billingHistory,
      totalSpent,
      totalPayments,
      lastPaymentDate
    });

  } catch (error) {
    console.error('Billing history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format plan price
function getPlanDisplayPrice(plan: any): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(plan.price);
}
