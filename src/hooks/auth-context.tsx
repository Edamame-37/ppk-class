/**
 * @file auth-context.tsx
 * @description Lightweight client-side authentication context used to coordinate UI state
 * between the Login screen, the Dashboard screen, and the bottom footer bar (hiding the footer
 * while the user is on the Login page and displaying it once logged into the Dashboard).
 */

import { createContext, PropsWithChildren, useContext, useState } from 'react';

/**
 * Shape of the client-side authentication context.
 */
export interface AuthContextValue {
  /** Whether the user has completed the login flow and is viewing the Dashboard */
  isLoggedIn: boolean;
  /** Updates the login state */
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});

/**
 * Provides authentication state to the application tree.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to read and update the current authentication state.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
