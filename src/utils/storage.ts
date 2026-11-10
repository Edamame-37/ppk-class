/**
 * @file storage.ts
 * @description Local Key-Value Persistent Storage module (`AsyncStorage`) without any hardcoded data:
 * 1. Persists authenticated Firebase user session & JWT token (`@ppk_class:auth_session`)
 *    so the Login page is bypassed automatically while an active token exists.
 * 2. Caches the student list fetched from Cloud Firestore (`@ppk_class:students_list`) for offline reading.
 * 3. Saves the login form draft when `AppState` moves to `background` (`@ppk_class:login_draft`).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Student } from '@/constants/students';

/**
 * Storage keys used across the application.
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: '@ppk_class:auth_session',
  STUDENTS_LIST: '@ppk_class:students_list',
  LOGIN_DRAFT: '@ppk_class:login_draft',
} as const;

/**
 * Represents a persisted Firebase user authentication session stored in Local Storage.
 */
export interface UserSession {
  /** Firebase Auth UID */
  uid: string;
  /** Authenticated user email address */
  email: string;
  /** Optional display name from Google Sign-In or profile */
  displayName?: string;
  /** Active Firebase ID token (JWT) used to bypass the Login page on subsequent app opens */
  token: string;
  /** Authentication provider method (`'email'` | `'google'`) */
  loginMethod: 'email' | 'google';
  /** Whether the user checked Remember Me */
  rememberMe: boolean;
  /** ISO timestamp when the session was saved */
  loggedInAt: string;
}

/**
 * Represents a saved login form draft when the app transitions to background.
 */
export interface LoginDraft {
  email: string;
  rememberMe: boolean;
  savedAt: string;
}

/**
 * In-memory synchronous cache layer paired with AsyncStorage disk persistence.
 */
const memoryCache = new Map<string, string>();

/**
 * Saves the authenticated Firebase user's login information and token to Local Storage (`JSON.stringify`).
 *
 * @param session - The user session object to persist
 */
export async function saveUserSession(session: UserSession): Promise<void> {
  try {
    const serialized = JSON.stringify(session);
    memoryCache.set(STORAGE_KEYS.AUTH_SESSION, serialized);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, serialized);
  } catch (error) {
    console.error('Failed to save user session:', error);
  }
}

/**
 * Reads the persisted user login session and active token from Local Storage (`JSON.parse`).
 * Used on app launch to bypass the Login screen if an active token is present.
 *
 * @returns The parsed `UserSession` if present, or `null` otherwise
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cached = memoryCache.get(STORAGE_KEYS.AUTH_SESSION);
    if (cached) {
      return JSON.parse(cached) as UserSession;
    }
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (raw) {
      memoryCache.set(STORAGE_KEYS.AUTH_SESSION, raw);
      return JSON.parse(raw) as UserSession;
    }
    return null;
  } catch (error) {
    console.error('Failed to read user session:', error);
    return null;
  }
}

/**
 * Clears the persisted user session and token from Local Storage on logout.
 */
export async function clearUserSession(): Promise<void> {
  try {
    memoryCache.delete(STORAGE_KEYS.AUTH_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}

/**
 * Caches the student list fetched from Cloud Firestore into Local Storage (`JSON.stringify`).
 *
 * @param students - Array of Student records from Cloud Firestore
 */
export async function saveStudentsData(students: readonly Student[]): Promise<void> {
  try {
    const serialized = JSON.stringify(students);
    memoryCache.set(STORAGE_KEYS.STUDENTS_LIST, serialized);
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, serialized);
  } catch (error) {
    console.error('Failed to save students cache:', error);
  }
}

/**
 * Reads the cached student list from Local Storage (`JSON.parse`).
 * Returns an empty array `[]` if no data has been cached from Firestore yet.
 *
 * @returns Array of cached Student records
 */
export async function getStudentsData(): Promise<Student[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS_LIST);
    if (raw) {
      memoryCache.set(STORAGE_KEYS.STUDENTS_LIST, raw);
      const parsed = JSON.parse(raw) as Student[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (error) {
    console.error('Failed to read students cache:', error);
    return [];
  }
}

/**
 * Saves the login form draft when `AppState` moves to `background`.
 *
 * @param draft - Draft containing current email and rememberMe state
 */
export async function saveLoginDraft(draft: LoginDraft): Promise<void> {
  try {
    const serialized = JSON.stringify(draft);
    memoryCache.set(STORAGE_KEYS.LOGIN_DRAFT, serialized);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_DRAFT, serialized);
  } catch (error) {
    console.error('Failed to save login draft:', error);
  }
}

/**
 * Reads any previously saved login draft when the Login screen mounts.
 *
 * @returns The parsed `LoginDraft` or `null`
 */
export async function getLoginDraft(): Promise<LoginDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_DRAFT);
    return raw ? (JSON.parse(raw) as LoginDraft) : null;
  } catch (error) {
    console.error('Failed to read login draft:', error);
    return null;
  }
}
