import { GoogleAuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth';

import { firebaseAuth } from '@/config/firebase';

/** Web authentication stays inside Firebase's supported popup flow. */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    return await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    if ((error as { code?: string })?.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw error;
  }
}
