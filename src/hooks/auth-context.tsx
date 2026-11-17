/**
 * @file auth-context.tsx
 * @description Firebase email/password and Google authentication with active-session storage.
 * Each fresh app launch starts on the Login screen.
 */

import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Persistence,
  User,
  UserCredential,
} from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { firebaseAuth } from '@/config/firebase';
import { signInWithGoogle } from '@/services/google-auth';
import { isSuperAdminEmail, syncAndReadUserRole } from '@/services/role-service';
import {
  clearUserSession,
  getUserSession,
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
  const role = await syncAndReadUserRole(fbUser);
  const isGoogle =
    methodOverride === 'google' ||
    fbUser.providerData.some((p) => p?.providerId === 'google.com');

  const newSession: UserSession = {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? undefined,
    loginMethod: isGoogle ? 'google' : 'email',
    providers: fbUser.providerData
      .map((provider) => provider.providerId)
      .filter(Boolean),
    role,
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
      return 'Email ini sudah terdaftar. Verifikasi dengan Google untuk menghubungkan kata sandi ke akun yang sama.';
    case 'auth/provider-already-linked':
      return 'Akun ini sudah memiliki metode Email/Password. Silakan gunakan mode Masuk.';
    case 'auth/credential-already-in-use':
      return 'Credential tersebut sudah terhubung ke akun Firebase lain.';
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
  /** Sends a Firebase password-reset email. */
  resetPassword: (email: string) => Promise<void>;
  /** Links an Email/Password credential to the active verified Super Admin account. */
  linkAdminPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  session: null,
  isHydrating: false,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => false,
  logout: async () => {},
  resetPassword: async () => {},
  linkAdminPassword: async () => {},
});

export function canConfigureAdminPassword(
  user: Pick<User, 'email' | 'emailVerified'> | null
): boolean {
  return isSuperAdminEmail(user?.email);
}

export function getWebPersistence(
  rememberMe: boolean,
  platform: typeof Platform.OS = Platform.OS
): Persistence | null {
  if (platform !== 'web') return null;
  return rememberMe ? browserLocalPersistence : browserSessionPersistence;
}

/**
 * Provides real Firebase Authentication while ensuring every app launch starts on the Login screen.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  /**
   * Mounting lifecycle:
   * Every time the app is opened from scratch, reset any leftover session so the user
   * is always presented with the Login screen first before entering the Dashboard.
   */
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      await firebaseAuth.authStateReady();
      const firebaseUser = firebaseAuth.currentUser;
      const savedSession = await getUserSession();
      if (!active) return;

      if (firebaseUser && savedSession?.rememberMe) {
        const restoredSession = await persistFirebaseUser(
          firebaseUser,
          true,
          savedSession.loginMethod
        );
        if (!active) return;
        setSession(restoredSession);
        setIsLoggedIn(true);
      } else {
        if (firebaseUser) await signOut(firebaseAuth);
        await clearUserSession();
        if (!active) return;
        setSession(null);
        setIsLoggedIn(false);
      }
      setIsHydrating(false);
    }

    restoreSession().catch(async () => {
      await clearUserSession();
      if (active) {
        setSession(null);
        setIsLoggedIn(false);
        setIsHydrating(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const configureWebPersistence = async (rememberMe: boolean) => {
    const persistence = getWebPersistence(rememberMe);
    if (persistence) await setPersistence(firebaseAuth, persistence);
  };

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

    await configureWebPersistence(rememberMe);
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

    await configureWebPersistence(rememberMe);
    let cred: UserCredential;
    try {
      cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/email-already-in-use') {
        throw error;
      }

      const googleResult = await signInWithGoogle();
      if (!googleResult) {
        throw new Error('Verifikasi Google dibatalkan. Akun belum dihubungkan.');
      }
      if (googleResult.user.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
        await signOut(firebaseAuth);
        throw new Error(
          'Akun Google yang dipilih berbeda dari email formulir. Pilih akun Google dengan email yang sama.'
        );
      }

      cred = await linkWithCredential(
        googleResult.user,
        EmailAuthProvider.credential(cleanEmail, password)
      );
    }
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
    const rememberMe = params?.rememberMe ?? true;
    await configureWebPersistence(rememberMe);
    const result = await signInWithGoogle();
    if (!result) {
      return false;
    }

    const newSession = await persistFirebaseUser(
      result.user,
      rememberMe,
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

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error('Masukkan alamat email terlebih dahulu.');
    await sendPasswordResetEmail(firebaseAuth, cleanEmail);
  };

  const linkAdminPassword = async (password: string) => {
    const user = firebaseAuth.currentUser;
    if (!user || !canConfigureAdminPassword(user)) {
      throw new Error('Setup password hanya tersedia untuk akun Super Admin terverifikasi.');
    }
    if (password.length < 6) {
      throw new Error('Kata sandi wajib minimal 6 karakter.');
    }
    if (user.providerData.some((provider) => provider.providerId === 'password')) {
      throw new Error('Login Email & Password sudah aktif untuk akun ini.');
    }

    const result = await linkWithCredential(
      user,
      EmailAuthProvider.credential(user.email!, password)
    );
    const updatedSession = await persistFirebaseUser(
      result.user,
      session?.rememberMe ?? true,
      session?.loginMethod ?? 'google'
    );
    setSession(updatedSession);
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
        resetPassword,
        linkAdminPassword,
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
