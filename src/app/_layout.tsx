/**
 * @file _layout.tsx
 * @description Root layout component for the ppk-class React Native (Expo Router) application.
 * Enforces the Light theme (DefaultTheme), configures the status bar and splash screen,
 * and renders the main tab navigator.
 */
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Root TabLayout component that wraps the application with the Light theme context
 * and renders the animated splash overlay along with the primary tab navigator.
 */
export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
