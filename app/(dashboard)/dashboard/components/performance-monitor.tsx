'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMonitorProps {
  loading: boolean;
  error: string | null;
  onLoadComplete?: () => void;
}

export function PerformanceMonitor({ loading, error, onLoadComplete }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<{
    loadTime: number;
    renderTime: number;
    memoryUsage?: number;
  } | null>(null);
  
  const startTime = useRef<number>(performance.now());
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    // Start measuring render time
    renderStartTime.current = performance.now();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      const renderTime = performance.now() - renderStartTime.current;
      const loadTime = performance.now() - startTime.current;
      
      const newMetrics = {
        loadTime: Math.round(loadTime),
        renderTime: Math.round(renderTime),
        memoryUsage: (performance as any).memory ? 
          Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 
          undefined
      };
      
      setMetrics(newMetrics);
      
      // Log performance metrics for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Dashboard Performance:', {
          'Total Load Time': `${newMetrics.loadTime}ms`,
          'Render Time': `${newMetrics.renderTime}ms`,
          'Memory Usage': newMetrics.memoryUsage ? `${newMetrics.memoryUsage}MB` : 'N/A'
        });
      }
      
      onLoadComplete?.();
    }
  }, [loading, error, onLoadComplete]);

  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_SHOW_PERFORMANCE) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Performance</span>
        </div>
        {metrics && (
          <div className="space-y-1 text-slate-300">
            <div>Load: {metrics.loadTime}ms</div>
            <div>Render: {metrics.renderTime}ms</div>
            {metrics.memoryUsage && (
              <div>Memory: {metrics.memoryUsage}MB</div>
            )}
          </div>
        )}
        {loading && (
          <div className="text-yellow-400">Loading...</div>
        )}
        {error && (
          <div className="text-red-400">Error</div>
        )}
      </div>
    </div>
  );
}
