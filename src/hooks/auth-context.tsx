/**
 * @file auth-context.tsx
 * @description Authentication and Session Caching context applying:
 * - Week 9 Slide 11 & 13: Mounting lifecycle (`useEffect(..., [])` with `let active = true` cleanup)
 * - Week 10 Slide 20: Auth & Session Caching flow (`APP OPEN -> READ TOKEN -> HOME instan / LOGIN`)
 */

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import {
  clearUserSession,
  getUserSession,
  saveUserSession,
  UserSession,
} from '@/utils/storage';

/**
 * Shape of the authentication context.
 */
export interface AuthContextValue {
  /** Whether the user is currently authenticated and viewing the Dashboard */
  isLoggedIn: boolean;
  /** Currently active user session metadata (if logged in) */
  session: UserSession | null;
  /** Whether initial session hydration from AsyncStorage is still in progress */
  isHydrating: boolean;
  /** Signs the user in and persists the session token to AsyncStorage */
  login: (params: {
    email: string;
    loginMethod: 'email' | 'google';
    rememberMe: boolean;
  }) => Promise<void>;
  /** Clears the active session and returns the user to the Login screen */
  logout: () => Promise<void>;
  /** Direct setter for compatibility */
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  session: null,
  isHydrating: true,
  login: async () => {},
  logout: async () => {},
  setIsLoggedIn: () => {},
});

/**
 * Provides authentication state and persistent session caching to the application tree.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Mounting lifecycle: check if a remembered session token exists in AsyncStorage (Week 10 Slide 20)
  useEffect(() => {
    let active = true;

    async function restoreSessionOnMount() {
      const savedSession = await getUserSession();
      if (active) {
        if (savedSession && savedSession.rememberMe) {
          setSession(savedSession);
          setIsLoggedIn(true);
        }
        setIsHydrating(false);
      }
    }

    restoreSessionOnMount();

    // Cleanup flag if component unmounts before async storage read finishes (Week 9 Slide 13)
    return () => {
      active = false;
    };
  }, []);

  /**
   * Authenticates the user and caches the session token in persistent storage.
   */
  const login = async ({
    email,
    loginMethod,
    rememberMe,
  }: {
    email: string;
    loginMethod: 'email' | 'google';
    rememberMe: boolean;
  }) => {
    const newSession: UserSession = {
      email: email.trim() || (loginMethod === 'google' ? 'google.user@students.undip.ac.id' : 'mahasiswa@students.undip.ac.id'),
      token: `tok_${Date.now()}`,
      loginMethod,
      rememberMe,
      loggedInAt: new Date().toISOString(),
    };

    setSession(newSession);
    setIsLoggedIn(true);
    await saveUserSession(newSession);
  };

  /**
   * Logs the user out and removes the cached token from persistent storage.
   */
  const logout = async () => {
    setSession(null);
    setIsLoggedIn(false);
    await clearUserSession();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        session,
        isHydrating,
        login,
        logout,
        setIsLoggedIn,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to read and update the current authentication and session state.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
