/**
 * @file auth-context.tsx
 * @description Firebase email/password and Google authentication with active-session storage.
 * Each fresh app launch starts on the Login screen.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { firebaseAuth } from '@/config/firebase';
import { signInWithGoogle } from '@/services/google-auth';
import {
  clearUserSession,
  saveUserSession,
  UserSession,
} from '@/utils/storage';

/**
 * Converts a Firebase Auth `User` into our persisted `UserSession` object and saves it to Local Storage.
 *
 * @param fbUser - Authenticated Firebase User instance
 * @param rememberMe - Whether to remember the user's login preference
 * @param methodOverride - Optional explicit login method (`'email' | 'google'`)
 */
async function persistFirebaseUser(
  fbUser: User,
  rememberMe: boolean = true,
  methodOverride?: 'email' | 'google'
): Promise<UserSession> {
  const token = await fbUser.getIdToken();
  const isGoogle =
    methodOverride === 'google' ||
    fbUser.providerData.some((p) => p?.providerId === 'google.com');

  const newSession: UserSession = {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? undefined,
    token,
    loginMethod: isGoogle ? 'google' : 'email',
    rememberMe,
    loggedInAt: new Date().toISOString(),
  };

  await saveUserSession(newSession);
  return newSession;
}

/**
 * Translates Firebase Auth error codes into clear Indonesian error messages.
 */
export function formatFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email atau kata sandi salah (atau akun belum terdaftar). Silakan klik "Daftar Sekarang" jika belum memiliki akun.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah (minimal 6 karakter).';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase Console (Authentication -> Sign-in method).';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.';
    default:
      return (error as Error)?.message || 'Terjadi kesalahan saat autentikasi ke Firebase.';
  }
}

/**
 * Shape of the authentication context.
 */
export interface AuthContextValue {
  /** Whether the user has completed login during the current app session */
  isLoggedIn: boolean;
  /** Currently active user session metadata stored in Local Storage */
  session: UserSession | null;
  /** Whether initial startup reset is in progress */
  isHydrating: boolean;
  /** Signs the user in with Email & Password via Firebase Auth (`signInWithEmailAndPassword`) */
  loginWithEmail: (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  /** Registers a new user account with Email & Password via Firebase Auth (`createUserWithEmailAndPassword`) */
  registerWithEmail: (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  /** Signs in with Google; returns false when the user cancels. */
  loginWithGoogle: (params?: {
    rememberMe?: boolean;
  }) => Promise<boolean>;
  /** Signs out of Firebase Auth, clears the active token from Local Storage, and returns to Login */
  logout: () => Promise<void>;
  /** Direct setter for login state */
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  session: null,
  isHydrating: false,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => false,
  logout: async () => {},
  setIsLoggedIn: () => {},
});

/**
 * Provides real Firebase Authentication while ensuring every app launch starts on the Login screen.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrating] = useState(false);

  /**
   * Mounting lifecycle:
   * Every time the app is opened from scratch, reset any leftover session so the user
   * is always presented with the Login screen first before entering the Dashboard.
   */
  useEffect(() => {
    clearUserSession();
    signOut(firebaseAuth).catch(() => {});
  }, []);

  /**
   * Authenticates an existing user with Email & Password via Firebase Auth (`signInWithEmailAndPassword`).
   */
  const loginWithEmail = async ({
    email,
    password,
    rememberMe,
  }: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Silakan masukkan alamat email Anda.');
    }
    if (!password) {
      throw new Error('Silakan masukkan kata sandi Anda.');
    }

    const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    const newSession = await persistFirebaseUser(cred.user, rememberMe, 'email');
    setSession(newSession);
    setIsLoggedIn(true);
  };

  /**
   * Registers a new user account with Email & Password via Firebase Auth (`createUserWithEmailAndPassword`)
   * and immediately signs them in.
   */
  const registerWithEmail = async ({
    email,
    password,
    rememberMe,
  }: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Silakan masukkan alamat email untuk mendaftar.');
    }
    if (!password || password.length < 6) {
      throw new Error('Kata sandi wajib diisi minimal 6 karakter.');
    }

    const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    const newSession = await persistFirebaseUser(cred.user, rememberMe, 'email');
    setSession(newSession);
    setIsLoggedIn(true);
  };

  /**
   * Saves a verified Firebase Google sign-in result. Cancellation leaves session state unchanged.
   */
  const loginWithGoogle = async (params?: {
    rememberMe?: boolean;
  }): Promise<boolean> => {
    const result = await signInWithGoogle();
    if (!result) {
      return false;
    }

    const newSession = await persistFirebaseUser(
      result.user,
      params?.rememberMe ?? true,
      'google'
    );
    setSession(newSession);
    setIsLoggedIn(true);
    return true;
  };

  /**
   * Signs out of Firebase Authentication and deletes the cached token from Local Storage.
   */
  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.warn('Firebase signOut warning:', error);
    }
    await clearUserSession();
    setSession(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        session,
        isHydrating,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
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
