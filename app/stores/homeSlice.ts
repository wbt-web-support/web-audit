import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HomeState {
  websiteUrl: string;
}

const initialState: HomeState = {
  websiteUrl: '',
};

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setWebsiteUrl: (state, action: PayloadAction<string>) => {
      state.websiteUrl = action.payload;
    },
    clearWebsiteUrl: (state) => {
      state.websiteUrl = '';
    },
    updateWebsiteUrl: (state, action: PayloadAction<string>) => {
      state.websiteUrl = action.payload;
    },
  },
});

export const { setWebsiteUrl, clearWebsiteUrl, updateWebsiteUrl } = homeSlice.actions;

export default homeSlice.reducer;
