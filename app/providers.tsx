'use client';

import { Provider } from 'react-redux';
import { getStore } from './stores/store';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [store, setStore] = useState<ReturnType<typeof getStore>>(undefined);

  useEffect(() => {
    console.log('Providers: useEffect triggered');
    setMounted(true);
    const newStore = getStore();
    console.log('Providers: Store from getStore:', newStore);
    setStore(newStore);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted || !store) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
} 