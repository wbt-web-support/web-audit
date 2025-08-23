'use client';

import { useEffect, useState } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  initialLoadTime: number;
  lastLoadTime: number;
  averageLoadTime: number;
  loadCount: number;
  errors: number;
}

interface PerformanceMonitorProps {
  loading: boolean;
  error: string | null;
  onLoadComplete: () => void;
}

export function PerformanceMonitor({ loading, error, onLoadComplete }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    initialLoadTime: 0,
    lastLoadTime: 0,
    averageLoadTime: 0,
    loadCount: 0,
    errors: 0
  });
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (loading && startTime === 0) {
      setStartTime(performance.now());
    } else if (!loading && startTime > 0) {
      const loadTime = performance.now() - startTime;
      const newLoadCount = metrics.loadCount + 1;
      const newAverageLoadTime = (metrics.averageLoadTime * metrics.loadCount + loadTime) / newLoadCount;
      
      setMetrics(prev => ({
        ...prev,
        lastLoadTime: loadTime,
        averageLoadTime: newAverageLoadTime,
        loadCount: newLoadCount,
        errors: error ? prev.errors + 1 : prev.errors
      }));
      
      setStartTime(0);
      onLoadComplete();
    }
  }, [loading, startTime, metrics, error, onLoadComplete]);

  // Performance indicators
  const isFast = metrics.lastLoadTime < 1000; // < 1 second
  const isSlow = metrics.lastLoadTime > 3000; // > 3 seconds
  const isOptimal = metrics.averageLoadTime < 1500; // < 1.5 seconds average

  if (metrics.loadCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs z-50">
      <div className="flex items-center gap-2 mb-2">
        <Zap className={`h-4 w-4 ${isOptimal ? 'text-green-500' : 'text-amber-500'}`} />
        <span className="font-medium">Performance</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>Last: {metrics.lastLoadTime.toFixed(0)}ms</span>
          {isFast && <span className="text-green-500">✓</span>}
          {isSlow && <span className="text-red-500">⚠</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Avg:</span>
          <span>{metrics.averageLoadTime.toFixed(0)}ms</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Loads:</span>
          <span>{metrics.loadCount}</span>
        </div>
        
        {metrics.errors > 0 && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Errors: {metrics.errors}</span>
          </div>
        )}
      </div>
    </div>
  );
}
