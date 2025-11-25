import authService from '@/services/auth.service';
import { AuthContextType, Session, User } from '@/types/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionData = await authService.getSession();
        if (sessionData) {
          setUser(sessionData.user);
          setSession(sessionData.session);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = async (email: string, password: string, name?: string, rememberMe?: boolean) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, name, rememberMe);
      await refreshSession();
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    callbackURL?: string,
    rememberMe?: boolean,
  ) => {
    setLoading(true);
    try {
      await authService.signIn(email, password, callbackURL, rememberMe);
      await refreshSession();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const sessionData = await authService.getSession();
      if (sessionData) {
        setUser(sessionData.user);
        setSession(sessionData.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const authValue: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
