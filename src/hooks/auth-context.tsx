/**
 * @file auth-context.tsx
 * @description Real Firebase Authentication and Session Caching context for `ppk-class`:
 * 1. Manual Email/Password Sign-In (`signInWithEmailAndPassword`) & Registration (`createUserWithEmailAndPassword`)
 * 2. Google Sign-In via Firebase Authentication (`GoogleAuthProvider.credential` + `signInWithCredential` / `signInWithPopup`)
 * 3. Persists authenticated user info & real Firebase JWT token in Local Storage (`AsyncStorage`)
 * 4. Automatically bypasses the Login page on app launch when an active token is present in Local Storage
 */

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { firebaseAuth } from '@/config/firebase';
import {
  clearUserSession,
  getUserSession,
  saveUserSession,
  UserSession,
} from '@/utils/storage';

/**
 * Converts a Firebase Auth `User` into our persisted `UserSession` object and saves it to Local Storage.
 */
async function persistFirebaseUser(
  fbUser: User,
  rememberMe: boolean = true
): Promise<UserSession> {
  const token = await fbUser.getIdToken();
  const isGoogle = fbUser.providerData.some((p) => p?.providerId === 'google.com');

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
  /** Whether the user has an active Firebase session token and is viewing the Home/Dashboard */
  isLoggedIn: boolean;
  /** Currently active user session metadata stored in Local Storage */
  session: UserSession | null;
  /** Whether initial token check from Local Storage is still in progress */
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
  /** Signs the user in with Google via Firebase Auth (`GoogleAuthProvider`) */
  loginWithGoogle: (params?: {
    idToken?: string | null;
    accessToken?: string | null;
    rememberMe?: boolean;
  }) => Promise<void>;
  /** Signs out of Firebase Auth, clears the active token from Local Storage, and returns to Login */
  logout: () => Promise<void>;
  /** Direct setter for login state */
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  session: null,
  isHydrating: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  setIsLoggedIn: () => {},
});

/**
 * Provides real Firebase Authentication + Local Storage token caching and automatic Login bypass.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  /**
   * Mounting lifecycle:
   * 1. Reads cached session token from Local Storage (`AsyncStorage`). If an active token exists,
   *    bypasses the Login page immediately (`setIsLoggedIn(true)`).
   * 2. Subscribes to Firebase `onAuthStateChanged` to keep the token in Local Storage fresh.
   */
  useEffect(() => {
    let active = true;

    async function checkActiveTokenOnMount() {
      const savedSession = await getUserSession();
      if (active) {
        if (savedSession && Boolean(savedSession.token) && Boolean(savedSession.uid)) {
          setSession(savedSession);
          setIsLoggedIn(true);
        }
        setIsHydrating(false);
      }
    }

    checkActiveTokenOnMount();

    const unsubscribeFirebaseAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!active) return;
      if (fbUser) {
        const syncedSession = await persistFirebaseUser(fbUser, true);
        if (active) {
          setSession(syncedSession);
          setIsLoggedIn(true);
        }
      }
    });

    return () => {
      active = false;
      unsubscribeFirebaseAuth();
    };
  }, []);

  /**
   * Authenticates an existing user with Email & Password via Firebase Auth (`signInWithEmailAndPassword`).
   * Throws an error if credentials are invalid so the Login UI displays the error message.
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
    const newSession = await persistFirebaseUser(cred.user, rememberMe);
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
    const newSession = await persistFirebaseUser(cred.user, rememberMe);
    setSession(newSession);
    setIsLoggedIn(true);
  };

  /**
   * Authenticates with Google via Firebase Authentication (`GoogleAuthProvider`)
   * and saves the resulting user info & active JWT token into Local Storage (`AsyncStorage`).
   */
  const loginWithGoogle = async (params?: {
    idToken?: string | null;
    accessToken?: string | null;
    rememberMe?: boolean;
  }) => {
    if (params?.idToken || params?.accessToken) {
      const credential = GoogleAuthProvider.credential(
        params.idToken ?? null,
        params.accessToken ?? undefined
      );
      const result = await signInWithCredential(firebaseAuth, credential);
      const newSession = await persistFirebaseUser(result.user, params.rememberMe ?? true);
      setSession(newSession);
      setIsLoggedIn(true);
      return;
    }

    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const newSession = await persistFirebaseUser(result.user, params?.rememberMe ?? true);
      setSession(newSession);
      setIsLoggedIn(true);
      return;
    }

    throw new Error('Token Google OAuth tidak ditemukan. Pastikan login Google diselesaikan.');
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
