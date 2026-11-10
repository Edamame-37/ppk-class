import { isRunningInExpoGo } from 'expo';
import { GoogleAuthProvider, signInWithCredential, type UserCredential } from 'firebase/auth';
import { Platform } from 'react-native';

import { firebaseAuth, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/config/firebase';

/** Exchange a real Google ID token for a Firebase session without browser redirects. */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  if (isRunningInExpoGo()) {
    throw new Error('Login Google memerlukan development build. Gunakan login email di Expo Go.');
  }
  if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.startsWith('your-')) {
    throw new Error('Isi EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dengan Web Client ID proyek Firebase.');
  }
  if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) {
    throw new Error('Isi EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, lalu build ulang aplikasi iOS.');
  }

  // Load only after the Expo Go guard so the email login screen still works there.
  const { GoogleSignin, isSuccessResponse, statusCodes } = await import(
    '@react-native-google-signin/google-signin'
  );

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    // Clear the SDK's previous selection so another account can be chosen after logout.
    if (GoogleSignin.getCurrentUser()) {
      await GoogleSignin.signOut();
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }
    if (!response.data.idToken) {
      throw new Error('Google tidak mengembalikan ID token. Periksa Web Client ID OAuth.');
    }

    return await signInWithCredential(
      firebaseAuth,
      GoogleAuthProvider.credential(response.data.idToken)
    );
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    if (code === 'DEVELOPER_ERROR' || code === '10') {
      throw new Error('Konfigurasi Google belum cocok. Daftarkan package Android dan SHA-1 build di Firebase/Google Cloud.');
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services tidak tersedia atau perlu diperbarui.');
    }
    throw error;
  }
}
