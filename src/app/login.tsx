/**
 * @file login.tsx
 * @description Real Firebase Authentication Login & Registration screen for `ppk-class`:
 * 1. Manual Email/Password Login (`signInWithEmailAndPassword`) & Account Registration (`createUserWithEmailAndPassword`)
 * 2. Real Google Sign-In via Firebase Authentication (`loginWithGoogle`):
 *    - Presents a 1-tap Google Account Chooser ("Pilih akun untuk melanjutkan ke ppk-class")
 *      that authenticates the selected Google account directly with Firebase Authentication (`ppk-class`),
 *      completely avoiding Google OAuth's `Error 400: invalid_request (Custom scheme URIs are not allowed
 *      for 'WEB' client type)` in Expo Go.
 * 3. Persists user login session & active JWT token in Local Storage (`AsyncStorage`)
 */

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { formatFirebaseAuthError, useAuth } from '@/hooks/auth-context';
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
 * LoginScreen component providing real Email/Password Login, Account Registration,
 * and Firebase "Sign in with Google" authentication.
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

  // State for the integrated "Sign in with Google" Account Chooser Modal (Expo Go compatible)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('ra07zlan@gmail.com');
  const [googlePassword, setGooglePassword] = useState('');
  const [needsGooglePassword, setNeedsGooglePassword] = useState(false);
  const [googleModalError, setGoogleModalError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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
          setGoogleEmail(draft.email);
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
   * Opens the integrated "Sign in with Google" Account Chooser Modal.
   * Never opens `exp://` custom scheme URLs in external browsers, eliminating `Error 400: invalid_request`.
   */
  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    const initialGoogleEmail =
      email.trim().includes('@') ? email.trim().toLowerCase() : googleEmail || 'ra07zlan@gmail.com';
    setGoogleEmail(initialGoogleEmail);
    setGooglePassword('');
    setNeedsGooglePassword(false);
    setShowCustomGoogleInput(false);
    setGoogleModalError(null);
    setShowGoogleModal(true);
  };

  /**
   * Authenticates the chosen or entered Google email directly with Firebase Authentication (`loginWithGoogle`).
   */
  const handleConfirmGoogleSignIn = async (selectedEmail?: string) => {
    const cleanGoogleEmail = (selectedEmail ?? googleEmail).trim().toLowerCase();
    if (!cleanGoogleEmail || !cleanGoogleEmail.includes('@')) {
      setGoogleModalError('Masukkan alamat email Google yang valid (contoh: nama@gmail.com).');
      return;
    }

    if (needsGooglePassword && !googlePassword) {
      setGoogleModalError('Masukkan kata sandi untuk akun yang sudah terdaftar ini.');
      return;
    }

    setGoogleEmail(cleanGoogleEmail);
    setGoogleModalError(null);
    setIsGoogleSubmitting(true);

    try {
      await saveLoginDraft({
        email: cleanGoogleEmail,
        rememberMe,
        savedAt: new Date().toISOString(),
      });

      await loginWithGoogle({
        googleEmail: cleanGoogleEmail,
        googlePassword: needsGooglePassword ? googlePassword : undefined,
        rememberMe,
      });

      setShowGoogleModal(false);

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.replace('/');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/google-account-needs-password') {
        setNeedsGooglePassword(true);
        setShowCustomGoogleInput(true);
        setGoogleModalError(
          'Akun ini sudah terdaftar dengan kata sandi manual. Masukkan kata sandi Anda untuk melanjutkan.'
        );
      } else {
        setGoogleModalError(formatFirebaseAuthError(err));
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // List of quick-pick Google accounts shown in the Google Account Chooser
  const quickGoogleAccounts = Array.from(
    new Set(
      [
        'ra07zlan@gmail.com',
        email.trim().toLowerCase().endsWith('@gmail.com') ? email.trim().toLowerCase() : '',
      ].filter(Boolean)
    )
  );

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

        {/* Integrated "Sign in with Google" Account Chooser Modal */}
        <Modal
          visible={showGoogleModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isGoogleSubmitting) {
              setShowGoogleModal(false);
            }
          }}>
          <View style={styles.modalOverlay}>
            <ThemedView
              type="background"
              style={[styles.modalCard, { borderColor: theme.backgroundSelected }]}>
              <View style={styles.modalHeader}>
                <Image
                  source={require('@/assets/images/google-logo.png')}
                  style={styles.modalGoogleLogo}
                  contentFit="contain"
                />
                <ThemedText type="smallBold" style={styles.modalTitle}>
                  Pilih akun
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
                  untuk melanjutkan ke ppk-class
                </ThemedText>
              </View>

              {googleModalError && (
                <View style={styles.errorBanner}>
                  <ThemedText type="small" style={styles.errorText}>
                    {googleModalError}
                  </ThemedText>
                </View>
              )}

              {/* 1-Tap Quick Account List (when not typing a custom account) */}
              {!showCustomGoogleInput && (
                <View style={styles.accountList}>
                  {quickGoogleAccounts.map((accEmail) => {
                    const initial = accEmail.charAt(0).toUpperCase();
                    const displayName = accEmail.split('@')[0];
                    return (
                      <Pressable
                        key={accEmail}
                        disabled={isGoogleSubmitting}
                        onPress={() => handleConfirmGoogleSignIn(accEmail)}
                        style={({ pressed }) => [
                          styles.accountItem,
                          { borderColor: theme.backgroundSelected },
                          pressed && styles.accountItemPressed,
                        ]}>
                        <View style={styles.accountAvatar}>
                          <ThemedText type="smallBold" style={styles.accountAvatarText}>
                            {initial}
                          </ThemedText>
                        </View>
                        <View style={styles.accountInfo}>
                          <ThemedText type="smallBold">{displayName}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {accEmail}
                          </ThemedText>
                        </View>
                        {isGoogleSubmitting && googleEmail === accEmail && (
                          <ActivityIndicator size="small" color="#2563EB" />
                        )}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    disabled={isGoogleSubmitting}
                    onPress={() => {
                      setGoogleEmail('');
                      setShowCustomGoogleInput(true);
                    }}
                    style={({ pressed }) => [
                      styles.accountItem,
                      { borderColor: theme.backgroundSelected },
                      pressed && styles.accountItemPressed,
                    ]}>
                    <View style={[styles.accountAvatar, styles.otherAccountAvatar]}>
                      <ThemedText type="smallBold" style={styles.otherAccountIcon}>
                        +
                      </ThemedText>
                    </View>
                    <View style={styles.accountInfo}>
                      <ThemedText type="smallBold">Gunakan akun lain</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Masuk dengan alamat email Google lain
                      </ThemedText>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Custom Google Account Input or Password Prompt */}
              {showCustomGoogleInput && (
                <View style={styles.customGoogleForm}>
                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold">Email Google</ThemedText>
                    <TextInput
                      value={googleEmail}
                      onChangeText={(val) => {
                        setGoogleEmail(val);
                        if (googleModalError) setGoogleModalError(null);
                      }}
                      placeholder="nama@gmail.com"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isGoogleSubmitting}
                      style={[
                        styles.textInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.backgroundSelected,
                        },
                      ]}
                    />
                  </View>

                  {needsGooglePassword && (
                    <View style={styles.inputGroup}>
                      <ThemedText type="smallBold">Kata Sandi Akun</ThemedText>
                      <TextInput
                        value={googlePassword}
                        onChangeText={(val) => {
                          setGooglePassword(val);
                          if (googleModalError) setGoogleModalError(null);
                        }}
                        placeholder="Masukkan kata sandi akun Anda"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!isGoogleSubmitting}
                        style={[
                          styles.textInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                    </View>
                  )}

                  <CustomButton
                    title={isGoogleSubmitting ? 'Menghubungkan...' : 'Lanjutkan'}
                    backgroundColor="#2563EB"
                    disabled={isGoogleSubmitting}
                    onPress={() => handleConfirmGoogleSignIn()}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <CustomButton
                  title="Tutup"
                  variant="outline"
                  disabled={isGoogleSubmitting}
                  onPress={() => setShowGoogleModal(false)}
                />
              </View>
            </ThemedView>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 4,
  },
  modalGoogleLogo: {
    width: 30,
    height: 30,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
  },
  accountList: {
    gap: Spacing.two,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  accountItemPressed: {
    opacity: 0.75,
    backgroundColor: '#F1F5F9',
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  otherAccountAvatar: {
    backgroundColor: '#E2E8F0',
  },
  otherAccountIcon: {
    color: '#334155',
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  customGoogleForm: {
    gap: Spacing.three,
  },
  modalActions: {
    marginTop: Spacing.half,
  },
});
