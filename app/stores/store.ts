import { configureStore } from '@reduxjs/toolkit';

// Add your reducers here as you create slices
export const store = configureStore({
  reducer: {
    // example: user: userReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 