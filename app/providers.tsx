'use client';

import { Provider } from 'react-redux';
import { getStore } from '@/lib/store/store';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [store, setStore] = useState<ReturnType<typeof getStore>>(undefined);

  useEffect(() => {
    setMounted(true);
    setStore(getStore());
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