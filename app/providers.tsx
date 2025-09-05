"use client"

import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";
import { Provider } from 'react-redux';
import { store } from './stores/store';
import { AuthProvider } from '@/lib/hooks/useAuthWithBackend';
import { UserProvider } from '@/lib/contexts/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </UserProvider>
      </AuthProvider>
    </Provider>
  );
} 