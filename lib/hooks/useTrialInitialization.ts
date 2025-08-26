import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/stores/hooks';
import { setProfile } from '@/app/stores/userProfileSlice';

export function useTrialInitialization() {
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeTrial = async () => {
      try {
        setIsInitializing(true);
        
        // Initialize trial for new user
        const response = await fetch('/api/profile/initialize-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Update the profile in Redux store
            dispatch(setProfile(data.data));
            console.log('Trial initialized:', data.message);
          }
        } else {
          console.error('Failed to initialize trial:', response.status);
        }
      } catch (error) {
        console.error('Error initializing trial:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    // Initialize trial when component mounts
    initializeTrial();
  }, [dispatch]);

  return { isInitializing };
}
