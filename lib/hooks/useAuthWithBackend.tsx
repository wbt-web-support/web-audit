import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  userTier: string | null;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
    burstRemaining: number;
    burstResetTime: number;
  } | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: number;
    burstRemaining: number;
    burstResetTime: number;
  } | null>(null);

  const supabase = createClient();

  // Fetch user tier and rate limit info from backend
  const refreshUserInfo = async () => {
    if (!user) {
      setUserTier(null);
      setRateLimitInfo(null);
      return;
    }

    try {
      // Fetch user tier and rate limit info in parallel
      const [tierResponse, rateLimitResponse] = await Promise.allSettled([
        apiClient.getUserTier(),
        apiClient.getRateLimitInfo()
      ]);

      if (tierResponse.status === 'fulfilled') {
        setUserTier(tierResponse.value.tier || 'BASIC');
      }

      if (rateLimitResponse.status === 'fulfilled') {
        setRateLimitInfo(rateLimitResponse.value.rateLimitInfo);
      }
    } catch (error) {
      console.error('Failed to fetch user info from backend:', error);
      // Set defaults if backend is not available
      setUserTier('BASIC');
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await refreshUserInfo();
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await refreshUserInfo();
        } else {
          setUserTier(null);
          setRateLimitInfo(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data.user) {
        // Refresh user info after successful sign in
        await refreshUserInfo();
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear user info
      setUserTier(null);
      setRateLimitInfo(null);
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userTier,
    rateLimitInfo,
    signIn,
    signUp,
    signOut,
    refreshUserInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthWithBackend(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthWithBackend must be used within AuthProvider');
  }
  return context;
}

// Export the original useAuth hook for backward compatibility
export { useAuth } from './useAuth';
