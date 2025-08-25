'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'cancel';
  message: string;
  description: string;
  onClose: () => void;
}

export function StatusMessage({ type, message, description, onClose }: StatusMessageProps) {
  const isSuccess = type === 'success';
  
  return (
    <Card className={`mb-6 ${
      isSuccess 
        ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
        : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          <div>
            <h3 className={`font-medium ${
              isSuccess 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {message}
            </h3>
            <p className={`text-sm ${
              isSuccess 
                ? 'text-green-600 dark:text-green-300' 
                : 'text-yellow-600 dark:text-yellow-300'
            }`}>
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`ml-auto ${
              isSuccess 
                ? 'text-green-600 hover:text-green-800' 
                : 'text-yellow-600 hover:text-yellow-800'
            }`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
