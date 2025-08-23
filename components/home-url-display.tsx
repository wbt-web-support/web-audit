'use client';

import { useAppSelector } from '../app/stores/hooks';
import { Badge } from './ui/badge';

export function HomeUrlDisplay() {
  const websiteUrl = useAppSelector((state) => state.home.websiteUrl);

  if (!websiteUrl) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stored URL:</div>
        <Badge variant="secondary" className="text-xs">
          {websiteUrl}
        </Badge>
      </div>
    </div>
  );
}
