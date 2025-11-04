import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-store';
import authService from '@/services/auth.service';
import { AuthContextType, Session, User } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const CACHE_KEY = 'auth.session';

type SessionPayload = Awaited<ReturnType<typeof authService.getSession>>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isValid = (data: SessionPayload | null) => {
    if (!data) return false;
    const expires = Date.parse(data.session.expiresAt);
    return Number.isFinite(expires) && expires > Date.now();
  };

  useEffect(() => {
    const BOOT_WAIT_MS = 1500;

    const initializeAuth = async () => {
      try {
        // 1) Fast-hydrate from cache
        const cached = await getSecureItem<NonNullable<SessionPayload>>(CACHE_KEY);
        if (isValid(cached)) {
          setUser(cached!.user);
          setSession(cached!.session);
          setLoading(false);
          // Revalidate in background
          refreshSession().catch(() => void 0);
          return;
        }

        // 2) Bounded wait for network
        const sessionPromise = authService.getSession();
        const result = await Promise.race([
          sessionPromise,
          new Promise<'timeout'>(res => setTimeout(() => res('timeout'), BOOT_WAIT_MS)),
        ]);

        if (result === 'timeout') {
          // Render immediately; keep revalidating in background
          setLoading(false);
          sessionPromise
            .then(async (sessionData) => {
              if (sessionData) {
                setUser(sessionData.user);
                setSession(sessionData.session);
                await setSecureItem(CACHE_KEY, sessionData);
              } else {
                setUser(null);
                setSession(null);
                await deleteSecureItem(CACHE_KEY);
              }
            })
            .catch(() => void 0);
          return;
        }

        const sessionData = result as NonNullable<SessionPayload> | null;
        if (sessionData) {
          setUser(sessionData.user);
          setSession(sessionData.session);
          await setSecureItem(CACHE_KEY, sessionData);
        } else {
          setUser(null);
          setSession(null);
          await deleteSecureItem(CACHE_KEY);
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

  const signIn = async (email: string, password: string, callbackURL?: string, rememberMe?: boolean) => {
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
      await deleteSecureItem(CACHE_KEY);
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
        await setSecureItem(CACHE_KEY, sessionData);
      } else {
        setUser(null);
        setSession(null);
        await deleteSecureItem(CACHE_KEY);
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

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
