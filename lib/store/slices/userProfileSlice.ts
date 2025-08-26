import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active: boolean;
  trial_days_remaining: number;
}

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateTrialStatus: (state, action: PayloadAction<{ 
      trial_start_date?: string; 
      trial_end_date?: string; 
      is_trial_active: boolean;
      trial_days_remaining: number;
    }>) => {
      if (state.profile) {
        state.profile = {
          ...state.profile,
          ...action.payload
        };
      }
    },
  },
});

export const { 
  setProfile,
  setLoading, 
  setError,
  clearError,
  updateTrialStatus
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
