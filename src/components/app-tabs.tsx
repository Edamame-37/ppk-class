/**
 * @file app-tabs.tsx
 * @description Native bottom tab navigator component for Expo SDK 58.
 * Renders only the Dashboard tab in the footer using the Light theme palette.
 */
import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

/**
 * Primary tab navigation layout for native platforms (Android & iOS).
 * Displays only the Dashboard item in the bottom footer bar.
 */
export default function AppTabs() {
  const colors = Colors.light;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
