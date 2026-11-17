import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CustomButton } from '@/components/custom-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatFirebaseAuthError, useAuth } from '@/hooks/auth-context';
import { useTheme } from '@/hooks/use-theme';

export function AdminPasswordSetup() {
  const theme = useTheme();
  const { linkAdminPassword, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const passwordEnabled = session?.providers.includes('password') ?? false;

  const handleSubmit = async () => {
    if (password !== confirmation) {
      setMessage('Konfirmasi kata sandi tidak sama.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      await linkAdminPassword(password);
      setPassword('');
      setConfirmation('');
      setIsOpen(false);
      setMessage('Login Email & Password berhasil diaktifkan.');
    } catch (error) {
      setMessage(formatFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (passwordEnabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <CustomButton
        title="Aktifkan Login Email & Password"
        variant="outline"
        onPress={() => {
          setMessage(null);
          setIsOpen(true);
        }}
        style={styles.openButton}
        labelStyle={styles.buttonLabel}
      />
    );
  }

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.form, { borderColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">Aktifkan login manual</ThemedText>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Kata sandi baru"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        editable={!isSubmitting}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="Konfirmasi kata sandi"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        editable={!isSubmitting}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}
      />
      {message && (
        <ThemedText type="small" style={styles.errorText}>
          {message}
        </ThemedText>
      )}
      <View style={styles.actions}>
        <CustomButton
          title="Batal"
          variant="outline"
          disabled={isSubmitting}
          onPress={() => setIsOpen(false)}
          style={styles.actionButton}
        />
        <CustomButton
          title={isSubmitting ? 'Memproses...' : 'Aktifkan'}
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={styles.actionButton}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  openButton: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
  },
  buttonLabel: {
    fontSize: 12,
  },
  form: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  input: {
    minWidth: 240,
    height: 42,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    color: '#DC2626',
  },
});
