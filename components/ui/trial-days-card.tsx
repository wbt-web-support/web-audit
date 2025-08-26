'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrialData {
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_active: boolean | null;
}

export function TrialDaysCard() {
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile');
        
        if (response.ok) {
          const data = await response.json();
          const profile = data.data || data;
          
          if (profile) {
            setTrialData({
              trial_start_date: profile.trial_start_date,
              trial_end_date: profile.trial_end_date,
              is_trial_active: profile.is_trial_active
            });
          }
        }
      } catch (err) {
        console.error('Error fetching trial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialData();
  }, []);

  const calculateDaysRemaining = () => {
    if (!trialData?.trial_end_date) return 0;
    
    const now = new Date();
    const trialEndDate = new Date(trialData.trial_end_date);
    const timeDiff = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysRemaining);
  };

  const getTrialStatus = () => {
    if (!trialData?.trial_end_date) return 'No trial data';
    
    const now = new Date();
    const trialEndDate = new Date(trialData.trial_end_date);
    const isExpired = now > trialEndDate;
    
    if (isExpired) return 'Trial expired';
    if (trialData.is_trial_active) return 'Trial active';
    return 'Trial inactive';
  };

  if (loading || !trialData) {
    return null;
  }

  const daysRemaining = calculateDaysRemaining();
  const status = getTrialStatus();

  // Don't show if trial is expired or no trial data
  if (status === 'Trial expired' || status === 'No trial data') {
    return null;
  }

  // Get status configuration
  let statusConfig;
  if (daysRemaining <= 3) {
    statusConfig = {
      icon: <AlertTriangle className="h-4 w-4" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600'
    };
  } else {
    statusConfig = {
      icon: <CheckCircle className="h-4 w-4" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    };
  }

  return (
    <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-4 flex items-center gap-3`}>
      <div className={`${statusConfig.iconColor} flex-shrink-0`}>
        {statusConfig.icon}
      </div>
      <div className="flex-1">
        <div className={`${statusConfig.textColor} font-medium`}>
          {daysRemaining === 0 ? 'Last day of trial' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left in trial`}
        </div>
      </div>
      <div className="flex-shrink-0">
        <Clock className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
