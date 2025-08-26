import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlanName, BillingCycle } from '@/lib/types/database';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: PlanName;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  subscriptions: UserSubscription[];
  activeSubscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  subscriptions: [],
  activeSubscription: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    // Set all subscriptions
    setSubscriptions: (state, action: PayloadAction<UserSubscription[]>) => {
      state.subscriptions = action.payload;
      state.activeSubscription = action.payload.find(sub => sub.is_active) || null;
    },
    
    // Set active subscription
    setActiveSubscription: (state, action: PayloadAction<UserSubscription>) => {
      state.activeSubscription = action.payload;
      // Update all subscriptions to reflect the new active one
      state.subscriptions = state.subscriptions.map(sub => ({
        ...sub,
        is_active: sub.id === action.payload.id
      }));
    },
    
    // Add new subscription
    addSubscription: (state, action: PayloadAction<UserSubscription>) => {
      state.subscriptions.unshift(action.payload);
      if (action.payload.is_active) {
        state.activeSubscription = action.payload;
        // Deactivate other subscriptions
        state.subscriptions = state.subscriptions.map(sub => 
          sub.id !== action.payload.id 
            ? { ...sub, is_active: false }
            : sub
        );
      }
    },
    
    // Update subscription
    updateSubscription: (state, action: PayloadAction<UserSubscription>) => {
      const index = state.subscriptions.findIndex(sub => sub.id === action.payload.id);
      if (index !== -1) {
        state.subscriptions[index] = action.payload;
      }
      if (action.payload.is_active) {
        state.activeSubscription = action.payload;
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setSubscriptions,
  setActiveSubscription, 
  addSubscription, 
  updateSubscription, 
  setLoading,
  setError,
  clearError 
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
