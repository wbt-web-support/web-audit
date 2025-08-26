"use client";

import { useEffect, useState } from 'react';

interface TrialInitializerProps {
  children: React.ReactNode;
}

export function TrialInitializer({ children }: TrialInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTrial = async () => {
      try {
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

    // Add a small delay to ensure auth is ready
    const timer = setTimeout(() => {
      initializeTrial();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
