/**
 * @file firebase.ts
 * @description Real Firebase SDK configuration for the `ppk-class` project.
 * Initializes Firebase App, Firebase Authentication (`firebaseAuth`), and Cloud Firestore (`firestoreDb`)
 * connected directly to the live `ppk-class` Firebase project.
 */

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * Firebase configuration for the `ppk-class` project.
 * Reads from `EXPO_PUBLIC_FIREBASE_*` environment variables with the project's default config values.
 */
export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyC-_-ejKfB2QnZGbavZwo_otQ8zAQXvsag',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ppk-class.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ppk-class',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'ppk-class.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '505993093899',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:505993093899:web:919943c9f2779108be780e',
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-9KDNKQE1PY',
};

/**
 * Google OAuth Web Client ID from Firebase Console -> Authentication -> Sign-in method -> Google.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '505993093899-eb47b19ilpqn80hq5i3u4dvb5p9ob0q8.apps.googleusercontent.com';

export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** Initialized Firebase App instance */
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Initialized Firebase Authentication instance */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Initialized Cloud Firestore database instance */
export const firestoreDb: Firestore = getFirestore(firebaseApp);
