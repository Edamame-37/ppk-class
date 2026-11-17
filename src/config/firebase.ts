/**
 * @file firebase.ts
 * @description Real Firebase SDK configuration for the `ppk-class` project.
 * Initializes Firebase App, Firebase Authentication (`firebaseAuth`), and Cloud Firestore (`firestoreDb`)
 * connected directly to the live `ppk-class` Firebase project.
 */

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './firebase-config';

export { firebaseConfig, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './firebase-config';

/** Initialized Firebase App instance */
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Initialized Firebase Authentication instance */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Initialized Cloud Firestore database instance */
export const firestoreDb: Firestore = getFirestore(firebaseApp);
