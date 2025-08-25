import { configureStore } from '@reduxjs/toolkit';
import subscriptionReducer from '@/lib/store/slices/subscriptionSlice';

// Create store only on client side to prevent SSR issues
let store: ReturnType<typeof configureStore> | undefined;

export const getStore = () => {
  if (typeof window === 'undefined') {
    // Server-side: return undefined to prevent SSR issues
    return undefined;
  }

  if (!store) {
    store = configureStore({
      reducer: {
        subscription: subscriptionReducer,
      },
    });
  }

  return store;
};

// Simple type definitions
export type RootState = {
  subscription: {
    subscriptions: any[];
    activeSubscription: any | null;
    isLoading: boolean;
    error: string | null;
  };
};

export type AppDispatch = any;
