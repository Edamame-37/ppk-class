/**
 * @file app-tabs.tsx
 * @description Compact bottom navigation container for native platforms (Android & iOS).
 * Completely hides the footer when the user is on the Login page (`!isLoggedIn`) and renders
 * a compact, smaller-dimension footer containing only the Dashboard tab when on the Dashboard.
 */
import { Image } from 'expo-image';
import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';

/**
 * Primary navigation layout for native platforms.
 * Renders the active screen via `<Slot />` and conditionally displays a compact
 * Dashboard-only footer bar when the user is logged in.
 */
export default function AppTabs() {
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Hide footer completely on the Login page; render compact footer only on Dashboard */}
      {isLoggedIn && (
        <View
          style={[
            styles.footerBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.backgroundSelected,
              paddingBottom: Math.max(insets.bottom, Spacing.one),
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
              Dashboard
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
    paddingTop: Spacing.one,
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
