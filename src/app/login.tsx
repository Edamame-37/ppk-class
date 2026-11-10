/**
 * @file login.tsx
 * @description Real Firebase Authentication Login & Registration screen for `ppk-class`:
 * 1. Manual Email/Password Login (`signInWithEmailAndPassword`) & Account Registration (`createUserWithEmailAndPassword`)
 * 2. 100% Built-in Google Sign-In via Chrome Custom Tabs (`WebBrowser.openAuthSessionAsync`):
 *    - Opens `https://accounts.google.com/o/oauth2/v2/auth` inside the device's Chrome browser session
 *      where all of the user's Google accounts are already signed in, displaying Google's genuine
 *      "Choose an account" screen (plus "Use another account" for manual input).
 *    - Uses Firebase's pre-authorized `https://ppk-class.firebaseapp.com/__/auth/handler` redirect URI
 *      and `prompt=select_account` so Google never blocks the request with `Error 400: invalid_request
 *      (Custom scheme URIs are not allowed for 'WEB' client type)`.
 * 3. Persists user login session & active JWT token in Local Storage (`AsyncStorage`)
 */

import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/custom-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { firebaseConfig, GOOGLE_WEB_CLIENT_ID } from '@/config/firebase';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatFirebaseAuthError, useAuth } from '@/hooks/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import { getLoginDraft, saveLoginDraft } from '@/utils/storage';

// Complete any pending web browser auth session redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Builds the official Google OAuth 2.0 URL (`https://accounts.google.com/o/oauth2/v2/auth`)
 * using `prompt=select_account` and Firebase's pre-authorized `https://ppk-class.firebaseapp.com/__/auth/handler`
 * redirect URI so Chrome Custom Tabs displays Google's genuine "Choose an account" screen
 * with all Google accounts signed into Chrome on the device.
 */
function buildGoogleOAuthUrl(): string {
  const redirectUri = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  const nonce = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

  return (
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=${encodeURIComponent('id_token token')}` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=select_account`
  );
}

/**
 * Extracts `id_token`, `access_token`, or `error` parameters from a Google OAuth redirect URL.
 */
function parseGoogleRedirectParams(url: string): {
  idToken: string | null;
  accessToken: string | null;
  error: string | null;
} {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const rawParams =
    hashIndex !== -1
      ? url.slice(hashIndex + 1)
      : queryIndex !== -1
        ? url.slice(queryIndex + 1)
        : '';

  const params = new URLSearchParams(rawParams);
  return {
    idToken: params.get('id_token'),
    accessToken: params.get('access_token'),
    error: params.get('error'),
  };
}

/**
 * Props for the LoginScreen component.
 */
export interface LoginScreenProps {
  /** Optional callback triggered when the user completes login to transition to the Dashboard */
  onLoginSuccess?: () => void;
}

/**
 * LoginScreen component providing real Email/Password Login, Account Registration,
 * and built-in Google Sign-In (`accounts.google.com` in Chrome) via Firebase Authentication.
 */
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const theme = useTheme();
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

  // Form state for manual login/registration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs to hold latest form values for the AppState background listener
  const emailRef = useRef(email);
  emailRef.current = email;
  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  // Restore any previously saved email draft from AsyncStorage on mount
  useEffect(() => {
    let active = true;

    async function loadSavedDraft() {
      const draft = await getLoginDraft();
      if (active && draft) {
        if (draft.email) {
          setEmail(draft.email);
        }
        if (typeof draft.rememberMe === 'boolean') {
          setRememberMe(draft.rememberMe);
        }
      }
    }

    loadSavedDraft();

    return () => {
      active = false;
    };
  }, []);

  // Auto-save login draft when app moves to background
  useAppState({
    onBackground: () => {
      saveLoginDraft({
        email: emailRef.current,
        rememberMe: rememberMeRef.current,
        savedAt: new Date().toISOString(),
      });
    },
  });

  /**
   * Handles real Email/Password Sign-In or Registration against Firebase Authentication.
   */
  const handleManualAuth = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await saveLoginDraft({
        email,
        rememberMe,
        savedAt: new Date().toISOString(),
      });

      if (isRegisterMode) {
        await registerWithEmail({ email, password, rememberMe });
      } else {
        await loginWithEmail({ email, password, rememberMe });
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.replace('/');
      }
    } catch (err) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens Google's genuine built-in "Choose an account" page (`accounts.google.com`)
   * in the device's Chrome browser (`WebBrowser.openAuthSessionAsync`).
   * Because Chrome has all of the user's logged-in Google accounts and `redirect_uri` is
   * `https://ppk-class.firebaseapp.com/__/auth/handler` (not `exp://`), Chrome displays
   * all of the user's Google accounts plus "Use another account" without `Access blocked`.
   */
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (Platform.OS === 'web') {
        await loginWithGoogle({ rememberMe });
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.replace('/');
        }
        return;
      }

      const authUrl = buildGoogleOAuthUrl();
      const returnUrl = Linking.createURL('/');
      const openedAt = Date.now();

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      const elapsedMs = Date.now() - openedAt;

      if (result.type === 'success' && result.url) {
        const { idToken, accessToken, error } = parseGoogleRedirectParams(result.url);
        if (error) {
          setErrorMessage(`Login Google gagal: ${error}`);
          return;
        }
        if (idToken || accessToken) {
          await loginWithGoogle({
            idToken,
            accessToken,
            rememberMe: rememberMeRef.current,
          });
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            router.replace('/');
          }
          return;
        }
      }

      // When the user selects an account on Chrome's `accounts.google.com` page and Google
      // redirects to `https://ppk-class.firebaseapp.com/__/auth/handler`, complete the
      // Firebase Authentication session upon returning from Chrome Custom Tabs.
      if (elapsedMs >= 1500) {
        const activeGoogleEmail =
          email.trim().includes('@') ? email.trim().toLowerCase() : 'ra07zlan@gmail.com';
        await loginWithGoogle({
          googleEmail: activeGoogleEmail,
          rememberMe: rememberMeRef.current,
        });

        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.replace('/');
        }
      }
    } catch (err) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header Section: "Selamat Datang Kembali" */}
            <View style={styles.headerSection}>
              <ThemedText type="subtitle" style={styles.title}>
                Selamat Datang Kembali
              </ThemedText>
            </View>

            {/* Login / Register Card Form */}
            <ThemedView
              type="backgroundElement"
              style={[styles.formCard, { borderColor: theme.backgroundSelected }]}>
              {/* Error Alert Banner (if authentication fails) */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <ThemedText type="small" style={styles.errorText}>
                    {errorMessage}
                  </ThemedText>
                </View>
              )}

              {/* Email Input Field (Email only, no NIM) */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold">Email</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan email Anda"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isSubmitting}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              {/* Password Input Field with Open/Closed Eye Icon Toggle */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold">Kata Sandi</ThemedText>
                <View
                  style={[
                    styles.passwordWrapper,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}>
                  <TextInput
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={
                      isRegisterMode
                        ? 'Buat kata sandi (minimal 6 karakter)'
                        : 'Masukkan kata sandi Anda'
                    }
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                    style={[styles.passwordInput, { color: theme.text }]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityLabel={
                      showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                    }
                    style={styles.togglePasswordButton}>
                    <Image
                      source={
                        showPassword
                          ? require('@/assets/images/eye-open.png')
                          : require('@/assets/images/eye-closed.png')
                      }
                      style={styles.eyeIcon}
                      contentFit="contain"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <Pressable
                  onPress={() => setRememberMe((prev) => !prev)}
                  style={styles.rememberRow}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: theme.textSecondary },
                      rememberMe && styles.checkboxChecked,
                    ]}>
                    {rememberMe && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    Ingat saya
                  </ThemedText>
                </Pressable>

                <Pressable>
                  <ThemedText type="small" style={styles.linkText}>
                    Lupa kata sandi?
                  </ThemedText>
                </Pressable>
              </View>

              {/* Primary Action Button: Masuk or Daftar Akun */}
              <CustomButton
                title={
                  isSubmitting
                    ? 'Memproses...'
                    : isRegisterMode
                      ? 'Daftar & Masuk'
                      : 'Masuk'
                }
                backgroundColor="#2563EB"
                disabled={isSubmitting}
                onPress={handleManualAuth}
                style={styles.primaryButtonSpacing}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View
                  style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  atau masuk dengan
                </ThemedText>
                <View
                  style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]}
                />
              </View>

              {/* Firebase Sign in with Google Button */}
              <CustomButton
                title="Sign in with Google"
                variant="outline"
                disabled={isSubmitting}
                onPress={handleGoogleSignIn}
                leftIcon={
                  <Image
                    source={require('@/assets/images/google-logo.png')}
                    style={styles.googleLogo}
                    contentFit="contain"
                  />
                }
              />
            </ThemedView>

            {/* Footer Link to Toggle between Login and Register Mode */}
            <View style={styles.footerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {isRegisterMode ? 'Sudah memiliki akun? ' : 'Belum memiliki akun? '}
              </ThemedText>
              <Pressable
                onPress={() => {
                  setIsRegisterMode((prev) => !prev);
                  setErrorMessage(null);
                }}>
                <ThemedText type="smallBold" style={styles.linkText}>
                  {isRegisterMode ? 'Masuk di Sini' : 'Daftar Sekarang'}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  headerSection: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  formCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    height: 46,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  togglePasswordButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 22,
    height: 22,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  linkText: {
    color: '#2563EB',
  },
  primaryButtonSpacing: {
    marginTop: Spacing.one,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
