/**
 * @file _layout.tsx
 * @description Root layout component for the ppk-class React Native (Expo Router) application.
 * Configures theme provider (light/dark mode), splash screen behavior, and main tab navigation.
 */
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Root TabLayout component that wraps the application with theme context
 * and renders the animated splash overlay along with the primary tab navigator.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
