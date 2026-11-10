/**
 * @file storage.ts
 * @description Local Key-Value Persistent Storage module applying Week 10 concepts:
 * - Persistent vs Non-Persistent storage (survives app kill & device restart)
 * - AsyncStorage serialization (`JSON.stringify` on write, `JSON.parse` on read)
 * - Synchronous in-memory cache layer (MMKV-inspired instant read access after hydration)
 * - Auth session token caching (`APP OPEN -> READ TOKEN -> HOME instan / LOGIN`)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { STUDENTS_DATA, Student } from '@/constants/students';

/**
 * Storage keys used across the application.
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: '@ppk_class:auth_session',
  STUDENTS_LIST: '@ppk_class:students_list',
  LOGIN_DRAFT: '@ppk_class:login_draft',
} as const;

/**
 * Represents a persisted user authentication session (Week 10 Slide 8 & 20).
 */
export interface UserSession {
  email: string;
  token: string;
  loginMethod: 'email' | 'google';
  rememberMe: boolean;
  loggedInAt: string;
}

/**
 * Represents a saved login form draft when the app transitions to background (Week 9 Slide 23).
 */
export interface LoginDraft {
  email: string;
  rememberMe: boolean;
  savedAt: string;
}

/**
 * In-memory synchronous cache (mirrors MMKV synchronous `getString`/`set` semantics
 * while delegating disk persistence to Expo Go's bundled AsyncStorage).
 */
const memoryCache = new Map<string, string>();

/**
 * Saves the authenticated user session to persistent storage (`JSON.stringify`).
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
 * Reads the persisted user session from storage (`JSON.parse`).
 * Implements the `READ TOKEN` step in the Week 10 Slide 20 Auth-Sync diagram.
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
 * Clears the persisted user session on logout.
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
 * Saves the student list to persistent storage (`JSON.stringify`).
 * Converts the non-persistent RAM array (Week 10 Slide 5) into persistent disk data (Week 10 Slide 8).
 *
 * @param students - Array of Student records to persist
 */
export async function saveStudentsData(students: readonly Student[]): Promise<void> {
  try {
    const serialized = JSON.stringify(students);
    memoryCache.set(STORAGE_KEYS.STUDENTS_LIST, serialized);
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, serialized);
  } catch (error) {
    console.error('Failed to save students data:', error);
  }
}

/**
 * Loads the persisted student list from storage (`JSON.parse`).
 * Seeds storage with the 5 initial hardcoded students (`STUDENTS_DATA`) if none exist yet.
 *
 * @returns Array of Student records
 */
export async function getStudentsData(): Promise<Student[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS_LIST);
    if (raw) {
      memoryCache.set(STORAGE_KEYS.STUDENTS_LIST, raw);
      const parsed = JSON.parse(raw) as Student[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed initial 5 hardcoded students (Asep, Mamat, Yanto, Udin, Rahmat) into persistent storage
    const initial = [...STUDENTS_DATA];
    await saveStudentsData(initial);
    return initial;
  } catch (error) {
    console.error('Failed to load students data:', error);
    return [...STUDENTS_DATA];
  }
}

/**
 * Resets the persisted student list back to the 5 initial hardcoded students.
 *
 * @returns The default 5 Student records
 */
export async function resetStudentsData(): Promise<Student[]> {
  const initial = [...STUDENTS_DATA];
  await saveStudentsData(initial);
  return initial;
}

/**
 * Saves the login form draft when `AppState` moves to `background` (Week 9 Slide 23).
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
