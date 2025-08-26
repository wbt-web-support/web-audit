import { useEffect } from 'react';
import { useAppDispatch } from '@/app/stores/hooks';
import { setProfile } from '@/app/stores/userProfileSlice';

export function useSubscriptionCheck() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Fetch updated user profile with subscription status
        const response = await fetch('/api/profile/check-subscription', {
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
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    // Check subscription status when component mounts
    checkSubscriptionStatus();

    // Set up interval to check every hour
    const interval = setInterval(checkSubscriptionStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);
}
