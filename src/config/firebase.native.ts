import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import {
  firebaseConfig,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from './firebase-config';

export { firebaseConfig, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID };

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createNativeAuth(): Auth {
  try {
    // Firebase expects a persistence class here. Browser persistence values are invalid on native.
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const firebaseAuth = createNativeAuth();
export const firestoreDb: Firestore = getFirestore(firebaseApp);
