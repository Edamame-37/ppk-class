/**
 * @file login.tsx
 * @description Login screen for the PPK Class application.
 * Features standard login fields (Email/NIM, Password with open/closed eye icon toggle,
 * Remember Me checkbox, Forgot Password link, primary Sign In button, and a UI-only
 * "Sign in with Google" button featuring the official 4-color Google logo).
 */

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Official 4-color Google 'G' SVG data URI rendered via `expo-image`.
 */
const GOOGLE_LOGO_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%23EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="%234285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="%23FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="%2334A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

/**
 * Open eye SVG icon data URI (shown when password is visible).
 */
const EYE_OPEN_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2360646C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

/**
 * Closed eye (eye-off) SVG icon data URI (shown when password is hidden).
 */
const EYE_CLOSED_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2360646C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

/**
 * Props for the LoginScreen component.
 */
export interface LoginScreenProps {
  /** Optional callback triggered when the user completes login to transition to the Dashboard */
  onLoginSuccess?: () => void;
}

/**
 * LoginScreen component providing standard authentication UI controls,
 * an open/closed eye password visibility toggle icon, and a "Sign in with Google" button.
 */
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const theme = useTheme();

  // Local form state for standard login fields (UI-only, not connected to backend yet)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * Handles standard login button press.
   * Transitions to the Dashboard screen without server-side validation.
   */
  const handleSignIn = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      router.replace('/');
    }
  };

  /**
   * Handles "Sign in with Google" button press.
   * Prepared as a UI button only per requirements (server-side OAuth not connected yet).
   */
  const handleGoogleSignIn = () => {
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
            {/* Brand / Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoBadge}>
                <ThemedText style={styles.logoText}>PPK</ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.title}>
                Selamat Datang Kembali
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Masuk ke Portal Akademik PPK Class untuk melihat daftar mahasiswa
              </ThemedText>
            </View>

            {/* Login Card Form */}
            <ThemedView
              type="backgroundElement"
              style={[styles.formCard, { borderColor: theme.backgroundSelected }]}>
              {/* Email or NIM Input Field */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold">Email atau NIM</ThemedText>
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Contoh: 220101001 atau mahasiswa@kampus.ac.id"
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
                      source={{ uri: showPassword ? EYE_OPEN_SVG : EYE_CLOSED_SVG }}
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

              {/* Primary Login Button */}
              <Pressable
                onPress={handleSignIn}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText type="smallBold" style={styles.primaryButtonText}>
                  Masuk
                </ThemedText>
              </Pressable>

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

              {/* Sign in with Google Button with Official Google Logo (UI Only) */}
              <Pressable
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  styles.googleButton,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.backgroundSelected,
                  },
                  pressed && styles.buttonPressed,
                ]}>
                <Image
                  source={{ uri: GOOGLE_LOGO_SVG }}
                  style={styles.googleLogo}
                  contentFit="contain"
                />
                <ThemedText type="smallBold">Sign in with Google</ThemedText>
              </Pressable>
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
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  headerSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 340,
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
    width: 20,
    height: 20,
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
  primaryButton: {
    height: 48,
    borderRadius: Spacing.two,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.8,
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
  googleButton: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
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
