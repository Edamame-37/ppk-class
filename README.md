# PPK Class

Aplikasi Expo SDK 58 untuk autentikasi pengguna dan pengelolaan data mahasiswa melalui Firebase Authentication dan Cloud Firestore. Aplikasi mendukung Android, iOS, dan web.

## Persyaratan

- Node.js dan npm
- Proyek Firebase dengan Email/Password dan Google provider aktif
- Development build untuk Google Sign-In native

## Konfigurasi

1. Salin `.env.example` menjadi `.env`.
2. Isi seluruh variabel `EXPO_PUBLIC_FIREBASE_*` dari Firebase Console.
3. Isi `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` untuk Google Sign-In.
4. Untuk iOS, isi `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
5. Pastikan `google-services.json` berasal dari aplikasi Android dengan package yang sama seperti `ANDROID_PACKAGE`.

Firebase API key dan OAuth client ID merupakan identifier client, bukan secret server. Tetap gunakan environment berbeda untuk development, preview, dan production.

## Firebase

Aktifkan provider Email/Password dan Google pada Firebase Authentication.

Firestore harus memiliki koleksi `students`. Setiap dokumen menggunakan field berikut:

```text
nama: string
nim: string
programStudi: string
createdAt: timestamp | string
```

Security Rules harus memberikan akses hanya kepada pengguna terautentikasi. Aplikasi menampilkan cache terakhir jika snapshot tidak tersedia, tetapi operasi tulis tidak dianggap berhasil jika Firestore menolaknya.

## Account linking dan Super Admin

Email `asephijau12@gmail.com` selalu memperoleh role lokal `super_admin`, baik saat login melalui Google maupun Email/Password. Email lain menggunakan role `user`. Pemisahan ini mengatur halaman dan kontrol yang terlihat di aplikasi; otorisasi database tetap mengikuti Firestore Rules yang aktif di Firebase Console.

Untuk menggunakan Google dan Email/Password pada akun yang sama:

1. Login dengan Google menggunakan `asephijau12@gmail.com`.
2. Keluar, pilih **Daftar Sekarang**, lalu masukkan email yang sama dan password baru.
3. Saat verifikasi Google muncul, pilih akun `asephijau12@gmail.com`.
4. Firebase menghubungkan provider `google.com` dan `password` ke UID yang sama.

Tidak diperlukan Cloud Function, deployment Firebase, atau Blaze plan. Logout dan login kembali setelah perubahan akun agar sesi lokal membaca role terbaru.

Untuk mengaktifkan login manual Super Admin tanpa mengekspos password di bundle aplikasi:

1. Login dengan Google sebagai `asephijau12@gmail.com`.
2. Pada Dashboard Super Admin, tekan **Aktifkan Login Email & Password**.
3. Masukkan dan konfirmasi password satu kali.
4. Setelah provider Password terhubung, akun dapat login menggunakan Google atau form Email/Password dengan UID yang sama.

`ADMIN_EMAIL_PASSWORD` tidak dibaca oleh aplikasi dan tidak boleh menggunakan prefix `EXPO_PUBLIC_`. Password hanya dikirim langsung ke Firebase Authentication ketika form setup disubmit.

## Menjalankan aplikasi

```bash
npm install
npx expo start
```

Google Sign-In native menggunakan `@react-native-google-signin/google-signin`, sehingga tidak tersedia di Expo Go. Buat development build setelah konfigurasi native atau OAuth berubah:

```bash
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

Gunakan `--platform ios` untuk iOS. Daftarkan package atau bundle identifier serta SHA-1 setiap sertifikat Android yang digunakan pada Firebase dan Google Cloud.

## Pemeriksaan kualitas

```bash
npx expo lint
npx tsc --noEmit
npm test
npx expo-doctor
```

## Build

Profil build tersedia di `eas.json`:

- `development`: development client internal berupa APK untuk Android
- `preview`: distribusi internal
- `production`: build store
