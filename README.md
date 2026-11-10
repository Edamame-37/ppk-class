# ppk-class

## Google Sign-In

Login Google Android/iOS menggunakan SDK native dan membutuhkan development build.
Di Expo Go, gunakan login email/password. Web tetap menggunakan popup Firebase.

1. Aktifkan provider **Google** di Firebase Console > Authentication > Sign-in method.
2. Isi `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` di `.env` dengan OAuth Client ID bertipe **Web application** dari proyek Firebase yang sama.
3. Android: daftarkan package `com.ppkclass.app` (atau nilai `ANDROID_PACKAGE`) dan SHA-1 sertifikat build di Firebase/Google Cloud. Untuk EAS, ambil SHA-1 melalui `npx eas-cli@latest credentials -p android`. Setiap sertifikat development/store yang berbeda perlu didaftarkan. Android Client ID tidak dimasukkan ke kode.
4. iOS: daftarkan bundle ID `com.ppkclass.app` (atau `IOS_BUNDLE_IDENTIFIER`) dan isi `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Config plugin menambahkan URL scheme otomatis.
5. Pastikan konfigurasi environment yang sama tersedia saat build EAS, lalu buat dan instal development build Android:

   ```bash
   npx eas-cli@latest build --profile development --platform android
   npx expo start --dev-client
   ```

   Untuk iOS, gunakan `--platform ios`. Build ulang setelah mengubah konfigurasi native/OAuth iOS.

Untuk web, jalankan `npm run web` dan pastikan domain aplikasi ada di Firebase Authentication > Settings > Authorized domains.

Verifikasi login berhasil, pemilihan akun berbeda, pembatalan tanpa masuk dashboard, dan login email tetap berjalan. Untuk pemeriksaan kode:

```bash
npx expo lint
npx tsc --noEmit
```

Welcome to your Expo (React Native) app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
