import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];

  // Android uses autolinking and the explicit Web Client ID. Only iOS needs a URL scheme.
  if (iosClientId) {
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
    },
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.ppkclass.app',
    },
    plugins,
  };
};
