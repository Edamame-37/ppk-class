/**
 * @file firebase.ts
 * @description Firebase SDK configuration for React Native (Expo SDK 58).
 * Initializes Firebase App, Firebase Authentication (`auth`), and Cloud Firestore (`db`)
 * per Week 10 Slides 17–20. Supports environment variables (`EXPO_PUBLIC_FIREBASE_*`)
 * and gracefully falls back to local offline-first storage if Firebase credentials
 * have not yet been populated in `.env`.
 */

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * Firebase configuration read from Expo public environment variables.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/**
 * Indicates whether valid Firebase project credentials are configured.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your_firebase_api_key'
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (error) {
    console.warn('Firebase initialization warning (falling back to local storage):', error);
  }
}

/** Initialized Firebase App instance (or null if `.env` is not configured yet) */
export const firebaseApp = appInstance;

/** Initialized Firebase Authentication instance */
export const firebaseAuth = authInstance;

/** Initialized Cloud Firestore database instance */
export const firestoreDb = dbInstance;

