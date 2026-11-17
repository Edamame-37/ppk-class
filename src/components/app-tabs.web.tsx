/**
 * @file app-tabs.web.tsx
 * @description Compact bottom footer navigation component for Web.
 * Completely hides the footer when the user is on the Login page (`!isLoggedIn`) and renders
 * a compact, smaller-dimension footer containing only the Dashboard item when on the Dashboard.
 */
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';

/**
 * Main web layout rendering `<Slot />` and a compact Dashboard footer only after login.
 */
export default function AppTabs() {
  const { isLoggedIn, session } = useAuth();
  const isSuperAdmin = session?.role === 'super_admin';
  const colors = Colors.light;

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn && !isSuperAdmin}>
            <Stack.Screen name="index" />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn && isSuperAdmin}>
            <Stack.Screen name="admin" />
          </Stack.Protected>
        </Stack>
      </View>

      {/* Hide footer completely on the Login page; render compact footer only on Dashboard */}
      {isLoggedIn && (
        <View
          style={[
            styles.footerBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.backgroundSelected,
            },
          ]}>
          <View style={[styles.tabPill, { backgroundColor: colors.backgroundElement }]}>
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={styles.tabIcon}
              contentFit="contain"
              tintColor="#2563EB"
            />
            <ThemedText type="smallBold" style={styles.tabLabel}>
              {isSuperAdmin ? 'Dashboard Super Admin' : 'Dashboard Mahasiswa'}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  footerBar: {
    borderTopWidth: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tabIcon: {
    width: 15,
    height: 15,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#2563EB',
  },
});
