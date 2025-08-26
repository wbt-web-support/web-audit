'use client';

import { Provider } from 'react-redux';
import { getStore } from './stores/store';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create store immediately - this works on both server and client
  const store = getStore();

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
} 