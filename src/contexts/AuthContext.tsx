
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, authService } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data } = await authService.getCurrentSession();
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // Subscribe to auth changes
    const { data: authListener } = authService.onAuthStateChange((session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user } = await authService.signIn(email, password);
      setUser(user);
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.signUp(email, password);
      toast.success('Check your email to verify your account');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
