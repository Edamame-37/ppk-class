/**
 * @file _layout.tsx
 * @description Root layout component for the ppk-class React Native (Expo Router) application.
 * Enforces the Light theme (DefaultTheme), wraps the app in AuthProvider, configures the status bar
 * and splash screen, and renders the main navigation container.
 */
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/hooks/auth-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Root TabLayout component that wraps the application with Light theme and AuthProvider contexts.
 */
export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AnimatedSplashOverlay />
        <AppTabs />
      </AuthProvider>
    </ThemeProvider>
  );
}
