import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];
  const hasGoogleSignInPlugin = plugins.some((plugin) =>
    Array.isArray(plugin)
      ? plugin[0] === '@react-native-google-signin/google-signin'
      : plugin === '@react-native-google-signin/google-signin'
  );

  // Android uses autolinking and the explicit Web Client ID. Only iOS needs a URL scheme.
  if (iosClientId && !hasGoogleSignInPlugin) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: iosClientId.split('.').reverse().join('.') },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'ppk-class',
    slug: config.slug ?? 'ppk-class',
    android: {
      ...config.android,
      package: process.env.ANDROID_PACKAGE || 'com.ppkclass.app',
      googleServicesFile: './google-services.json',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.ppkclass.app',
    },
    plugins,
  };
};
