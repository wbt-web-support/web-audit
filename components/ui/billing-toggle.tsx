'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
           
interface BillingToggleProps {
  billingPeriod: string;
  onBillingPeriodChange: (period: string) => void;
  showYearlyDiscount?: boolean;
  yearlyDiscountPercent?: number;
  className?: string;
}

export function BillingToggle({
  billingPeriod,
  onBillingPeriodChange,
  showYearlyDiscount = true,
  yearlyDiscountPercent = parseInt(process.env.NEXT_PUBLIC_YEARLY_DISCOUNT_PERCENT || '20'),
  className = ''
}: BillingToggleProps) {
  const isYearly = billingPeriod === 'year' || billingPeriod === 'yearly' || billingPeriod === 'annual';

  const handleToggle = () => {
    const newPeriod = isYearly ? 'month' : 'year';
    onBillingPeriodChange(newPeriod);
  };

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Button
          variant={!isYearly ? "default" : "outline"}
          size="sm"
          onClick={() => onBillingPeriodChange('month')}
          className="px-4 py-2"
        >
          Monthly
        </Button>
        <Button
          variant={isYearly ? "default" : "outline"}
          size="sm"
          onClick={() => onBillingPeriodChange('year')}
          className="px-4 py-2"
        >
          Yearly
        </Button>
      </div>
      
      {showYearlyDiscount && isYearly && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Save {yearlyDiscountPercent}%
        </Badge>
      )}
    </div>
  );
}

