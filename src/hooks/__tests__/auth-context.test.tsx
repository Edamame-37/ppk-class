/* eslint-disable import/first */
jest.mock('@/config/firebase', () => ({
  firebaseAuth: {},
}));
jest.mock('@/services/google-auth', () => ({
  signInWithGoogle: jest.fn(),
}));
jest.mock('@/services/role-service', () => ({
  syncAndReadUserRole: jest.fn().mockResolvedValue('user'),
  isSuperAdminEmail: (email: string | null | undefined) =>
    email?.trim().toLowerCase() === 'asephijau12@gmail.com',
}));

import {
  canConfigureAdminPassword,
  formatFirebaseAuthError,
  getWebPersistence,
} from '@/hooks/auth-context';
import {
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

describe('formatFirebaseAuthError', () => {
  it('translates known Firebase error codes', () => {
    expect(formatFirebaseAuthError({ code: 'auth/invalid-email' })).toBe(
      'Format alamat email tidak valid.'
    );
  });

  it('keeps a useful message for unknown errors', () => {
    expect(formatFirebaseAuthError(new Error('Layanan tidak tersedia'))).toBe(
      'Layanan tidak tersedia'
    );
  });
});

describe('getWebPersistence', () => {
  it('never returns browser persistence on native platforms', () => {
    expect(getWebPersistence(true, 'android')).toBeNull();
    expect(getWebPersistence(false, 'ios')).toBeNull();
  });

  it('uses the requested persistence on web', () => {
    expect(getWebPersistence(true, 'web')).toBe(browserLocalPersistence);
    expect(getWebPersistence(false, 'web')).toBe(browserSessionPersistence);
  });
});

describe('canConfigureAdminPassword', () => {
  it('allows only the Super Admin email regardless of provider verification state', () => {
    expect(
      canConfigureAdminPassword({
        email: 'ASEPHIJAU12@gmail.com',
        emailVerified: true,
      })
    ).toBe(true);
    expect(
      canConfigureAdminPassword({
        email: 'asephijau12@gmail.com',
        emailVerified: false,
      })
    ).toBe(true);
    expect(
      canConfigureAdminPassword({ email: 'student@example.com', emailVerified: true })
    ).toBe(false);
  });
});
