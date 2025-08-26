import { configureStore } from '@reduxjs/toolkit';
import dashboardFormReducer from './dashboardFormSlice';
import auditReducer from './auditSlice';
import homeReducer from './homeSlice';
import userProfileReducer from './userProfileSlice';
import subscriptionReducer from './subscriptionSlice';

// Create store only on client side to prevent SSR issues
let store: ReturnType<typeof configureStore> | undefined;

export const getStore = () => {
  if (typeof window === 'undefined') {
    // Server-side: return undefined to prevent SSR issues
    console.log('getStore: Server-side, returning undefined');
    return undefined;
  }

  if (!store) {
    console.log('getStore: Creating new store');
    store = configureStore({
      reducer: {
        dashboardForm: dashboardFormReducer,
        audit: auditReducer,
        home: homeReducer,
        userProfile: userProfileReducer,
        subscription: subscriptionReducer,
      },
    });
    console.log('getStore: Store created with reducers:', Object.keys(store.getState() as any));
  } else {
    console.log('getStore: Returning existing store with reducers:', Object.keys(store.getState() as any));
  }

  return store;
};

// Create a properly typed store for type inference
const createTypedStore = () => configureStore({
  reducer: {
    dashboardForm: dashboardFormReducer,
    audit: auditReducer,
    home: homeReducer,
    userProfile: userProfileReducer,
    subscription: subscriptionReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<ReturnType<typeof createTypedStore>['getState']>;
export type AppDispatch = ReturnType<typeof createTypedStore>['dispatch'];

// Export the store type for use in other files
export type Store = ReturnType<typeof createTypedStore>; 