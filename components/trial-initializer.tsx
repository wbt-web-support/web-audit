"use client";

import { useEffect, useState } from 'react';

interface TrialInitializerProps {
  children: React.ReactNode;
}

export function TrialInitializer({ children }: TrialInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start as false to not block render

  useEffect(() => {
    const initializeTrial = async () => {
      try {
        setIsLoading(true);
        // Use API endpoint to initialize trial
        const response = await fetch('/api/profile/initialize-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Trial initialized successfully');
        } else {
          const errorData = await response.json();
          console.error('Error initializing trial:', errorData.error);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error in trial initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize in background without blocking render
    initializeTrial();
  }, []);

  // Show children immediately, only show loading if explicitly loading
  if (isLoading && !isInitialized) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-sm text-blue-800">Setting up account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
