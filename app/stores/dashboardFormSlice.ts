import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompanyDetails {
  companyName: string;
  phoneNumber: string;
  email: string;
  address: string;
  customInfo: string;
}

interface DashboardFormState {
  selectedServices: string[];
  crawlType: "full" | "single";
  inputUrl: string;
  companyDetails: CompanyDetails;
  instructions: string[]; // Added for custom instructions
  urls: string[]; // Added for custom URLs
  stripeKeyUrls: string[]; // Stripe key check URLs
}

const initialState: DashboardFormState = {
  selectedServices: [],
  crawlType: "full",
  inputUrl: "",
  companyDetails: {
    companyName: '',
    phoneNumber: '',
    email: '',
    address: '',
    customInfo: '',
  },
  instructions: [''], // Default to one empty instruction
  urls: [], // Default to empty array for custom URLs
  stripeKeyUrls: [], // Default to empty
};

export const dashboardFormSlice = createSlice({
  name: 'dashboardForm',
  initialState,
  reducers: {
    setSelectedServices: (state, action: PayloadAction<string[]>) => {
      state.selectedServices = action.payload;
    },
    addService: (state, action: PayloadAction<string>) => {
      if (!state.selectedServices.includes(action.payload)) {
        state.selectedServices.push(action.payload);
      }
    },
    removeService: (state, action: PayloadAction<string>) => {
      state.selectedServices = state.selectedServices.filter(service => service !== action.payload);
    },
    setCrawlType: (state, action: PayloadAction<"full" | "single">) => {
      state.crawlType = action.payload;
    },
    setInputUrl: (state, action: PayloadAction<string>) => {
      state.inputUrl = action.payload;
    },
    setCompanyDetails: (state, action: PayloadAction<CompanyDetails>) => {
      state.companyDetails = action.payload;
    },
    setInstructions: (state, action: PayloadAction<string[]>) => {
      state.instructions = action.payload;
    },
    setUrls: (state, action: PayloadAction<string[]>) => {
      // Only for custom_urls (not for stripe_key_urls)
      state.urls = action.payload;
    },
    addUrl: (state, action: PayloadAction<string>) => {
      // Only for custom_urls (not for stripe_key_urls)
      if (action.payload && !state.urls.includes(action.payload)) {
        state.urls.push(action.payload);
      }
    },
    deleteUrl: (state, action: PayloadAction<string>) => {
      // Only for custom_urls (not for stripe_key_urls)
      state.urls = state.urls.filter(url => url !== action.payload);
    },
    setStripeKeyUrls: (state, action: PayloadAction<string[]>) => {
      // Only for stripe_key_urls (not for custom_urls)
      state.stripeKeyUrls = action.payload;
    },
    clearForm: (state) => {
      state.selectedServices = [];
      state.crawlType = "full";
      state.inputUrl = "";
      state.companyDetails = {
        companyName: '',
        phoneNumber: '',
        email: '',
        address: '',
        customInfo: '',
      };
      state.instructions = [''];
      state.urls = [];
      state.stripeKeyUrls = []; // Clear stripeKeyUrls on form clear
    },
    clearServices: (state) => {
      state.selectedServices = [];
    },
  },
});

export const { 
  setSelectedServices, 
  addService, 
  removeService, 
  setCrawlType, 
  setInputUrl, 
  setCompanyDetails,
  setInstructions, // Export setInstructions
  setUrls, // Export setUrls
  addUrl, // Export addUrl
  deleteUrl, // Export deleteUrl
  setStripeKeyUrls, // Export setStripeKeyUrls
  clearForm, 
  clearServices 
} = dashboardFormSlice.actions;
export default dashboardFormSlice.reducer;
