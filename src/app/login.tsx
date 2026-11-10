/**
 * @file login.tsx
 * @description Login screen for the PPK Class application applying Week 9 & Week 10 concepts:
 * - Week 9 Slide 8–9: Uses the modular `<CustomButton>` component with props (`title`, `onPress`, `variant`, `leftIcon`)
 * - Week 9 Slide 11–13: Mounting `useEffect` restores saved login draft with `active` cleanup flag
 * - Week 9 Slide 22–24: `useAppState` auto-saves email draft to `AsyncStorage` when app moves to `background`
 * - Week 10 Slide 8 & 20: Persists session token and draft via `AsyncStorage` (`JSON.stringify` / `JSON.parse`)
 */

import { Image } from 'expo-image';
import { router } from 'expo-router';
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
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import { getLoginDraft, saveLoginDraft } from '@/utils/storage';

/**
 * Props for the LoginScreen component.
 */
export interface LoginScreenProps {
  /** Optional callback triggered when the user completes login to transition to the Dashboard */
  onLoginSuccess?: () => void;
}

/**
 * LoginScreen component providing declarative form state, password eye icon toggle,
 * reusable `<CustomButton>` actions, and automatic background draft persistence.
 */
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const theme = useTheme();
  const { login } = useAuth();

  // Declarative state for login form fields (Week 9 Slide 3)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Refs to hold latest form values for the AppState background listener
  const emailRef = useRef(email);
  emailRef.current = email;
  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  // Mounting lifecycle: restore any previously saved email draft from AsyncStorage (Week 9 Slide 13)
  useEffect(() => {
    let active = true;

    async function loadSavedDraft() {
      const draft = await getLoginDraft();
      if (active && draft) {
        if (draft.email) setEmail(draft.email);
        setRememberMe(Boolean(draft.rememberMe));
      }
    }

    loadSavedDraft();

    return () => {
      active = false;
    };
  }, []);

  // AppState lifecycle: auto-save login draft when app moves to background (Week 9 Slide 23)
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
   * Handles standard email/password login button press.
   * Saves draft & session token to AsyncStorage and transitions to the Dashboard.
   */
  const handleSignIn = async () => {
    await saveLoginDraft({
      email,
      rememberMe,
      savedAt: new Date().toISOString(),
    });
    await login({ email, loginMethod: 'email', rememberMe });
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      router.replace('/');
    }
  };

  /**
   * Handles "Sign in with Google" button press (UI + local session caching).
   */
  const handleGoogleSignIn = async () => {
    await login({
      email: email || 'google.user@students.undip.ac.id',
      loginMethod: 'google',
      rememberMe,
    });
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      router.replace('/');
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
            {/* Header Section: Only "Selamat Datang Kembali" */}
            <View style={styles.headerSection}>
              <ThemedText type="subtitle" style={styles.title}>
                Selamat Datang Kembali
              </ThemedText>
            </View>

            {/* Login Card Form */}
            <ThemedView
              type="backgroundElement"
              style={[styles.formCard, { borderColor: theme.backgroundSelected }]}>
              {/* Email Input Field (Email only, no NIM) */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold">Email</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Masukkan email Anda"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                    onChangeText={setPassword}
                    placeholder="Masukkan kata sandi Anda"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
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

              {/* Reusable CustomButton: Primary Login Button (Week 9 Slide 9) */}
              <CustomButton
                title="Masuk"
                backgroundColor="#2563EB"
                onPress={handleSignIn}
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

              {/* Reusable CustomButton: Sign in with Google with Official Google Logo */}
              <CustomButton
                title="Sign in with Google"
                variant="outline"
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

            {/* Footer Registration Link */}
            <View style={styles.footerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Belum memiliki akun?{' '}
              </ThemedText>
              <Pressable>
                <ThemedText type="smallBold" style={styles.linkText}>
                  Daftar Sekarang
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
