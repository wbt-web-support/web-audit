'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: string;
  amount_numeric: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  plan_name: string;
  billing_period: string;
  invoice_url?: string;
  payment_method?: string;
}

interface BillingTabProps {
  billingHistory: BillingHistoryItem[];
  billingHistoryLoading: boolean;
  billingStats: { totalSpent: number; totalPayments: number; lastPaymentDate: string };
  onRefresh: () => void;
}

export function BillingTab({ 
  billingHistory, 
  billingHistoryLoading, 
  billingStats, 
  onRefresh 
}: BillingTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              View your past invoices and payments
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={billingHistoryLoading}
          >
            {billingHistoryLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {billingHistoryLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading billing history...</span>
          </div>
        ) : billingHistory.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No billing history</h3>
            <p className="text-sm text-muted-foreground">
              Your billing history will appear here once you make your first payment.
            </p>
          </div>
        ) : (
          <>
            {/* Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  ${billingStats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total Payments</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {billingStats.totalPayments}
                </p>
              </div>
                                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Last Payment</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">
                        {billingStats.lastPaymentDate === 'Never' 
                          ? 'Never' 
                          : new Date(billingStats.lastPaymentDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                        }
                      </p>
                    </div>
            </div>

            {/* Billing History List */}
            <div className="space-y-4">
              {billingHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                      {item.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {item.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                      {item.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      {item.status === 'refunded' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.plan_name}</span>
                        <span>•</span>
                        <span className="capitalize">{item.billing_period}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-semibold">{item.amount}</span>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'pending' ? 'secondary' :
                            item.status === 'failed' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    {item.invoice_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Invoice
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
