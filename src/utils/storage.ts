/**
 * @file storage.ts
 * @description Local Key-Value Persistent Storage module (`AsyncStorage`):
 * 1. Persists authenticated Firebase user session & JWT token (`@ppk_class:auth_session`).
 * 2. Deletes any legacy student inputs (`@ppk_class:students_list`) and persists the clean
 *    5-student dataset (`@ppk_class:students_list_v2`) synced with Cloud Firestore.
 * 3. Saves the login form draft when `AppState` moves to `background` (`@ppk_class:login_draft`).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { INITIAL_STUDENTS_SEED, Student } from '@/constants/students';

/**
 * Storage keys used across the application.
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: '@ppk_class:auth_session',
  LEGACY_STUDENTS_LIST: '@ppk_class:students_list',
  STUDENTS_LIST: '@ppk_class:students_list_v2',
  STUDENTS_SEEDED_FLAG: '@ppk_class:students_seeded_v2',
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
  /** Active Firebase ID token (JWT) */
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
 * Deletes any previously inputted student records in the legacy Local Storage key (`@ppk_class:students_list`)
 * and initializes the fresh `@ppk_class:students_list_v2` storage with the 5 initial students
 * (`Asep`, `Mamat`, `Yanto`, `Udin`, `Rahmat`).
 *
 * @returns The active array of Student records in Local Storage
 */
export async function initializeFreshStudentsStorage(): Promise<Student[]> {
  try {
    // 1. Always delete legacy key so previous manual test inputs are wiped
    memoryCache.delete(STORAGE_KEYS.LEGACY_STUDENTS_LIST);
    await AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_STUDENTS_LIST);

    // 2. Check if v2 has already been initialized with the clean 5-student dataset
    const alreadySeeded = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS_SEEDED_FLAG);
    if (!alreadySeeded) {
      const freshSeed = [...INITIAL_STUDENTS_SEED];
      const serialized = JSON.stringify(freshSeed);
      memoryCache.set(STORAGE_KEYS.STUDENTS_LIST, serialized);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, serialized);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_SEEDED_FLAG, 'true');
      return freshSeed;
    }

    return await getStudentsData();
  } catch (error) {
    console.error('Failed to initialize fresh students storage:', error);
    return [...INITIAL_STUDENTS_SEED];
  }
}

/**
 * Caches the student list into Local Storage (`JSON.stringify`).
 *
 * @param students - Array of Student records
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
 * If not yet initialized, initializes with the 5 seed students (`INITIAL_STUDENTS_SEED`).
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
    const seed = [...INITIAL_STUDENTS_SEED];
    await saveStudentsData(seed);
    return seed;
  } catch (error) {
    console.error('Failed to read students cache:', error);
    return [...INITIAL_STUDENTS_SEED];
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
