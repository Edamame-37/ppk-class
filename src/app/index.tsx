/**
 * @file index.tsx
 * @description Home / Student Dashboard screen (`/`) for the PPK Class application.
 * Fully integrated with Firebase Authentication and Cloud Firestore (`ppk-class`) without any hardcoded data:
 * 1. Presents the Login page first on every fresh app launch (`!isLoggedIn`)
 * 2. Subscribes in realtime (`onSnapshot`) to the `students` collection in Cloud Firestore (with seamless `AsyncStorage` sync)
 * 3. Allows inputting new student documents (`nama`, `nim`, `programStudi`) into the database
 * 4. Allows deleting student documents on card long-press
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LogBox,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from '@/app/login';
import { CustomButton } from '@/components/custom-button';
import { StudentCard } from '@/components/student-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Student } from '@/constants/students';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import {
  addStudentToDatabase,
  deleteStudentFromDatabase,
  subscribeToStudents,
} from '@/services/student-service';
import { getStudentsData } from '@/utils/storage';

// Ensure LogBox ignores any cached Firestore permission messages across Fast Refreshes
LogBox.ignoreLogs([
  'Cloud Firestore onSnapshot error',
  'Missing or insufficient permissions',
  '@firebase/firestore',
]);

/**
 * DashboardScreen component displaying the live list of students from Cloud Firestore / Local Storage
 * and providing a form to input new student records into the `students` collection.
 */
export default function DashboardScreen() {
  const theme = useTheme();
  const { isLoggedIn, isHydrating, session, setIsLoggedIn, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Student list state populated from Cloud Firestore & synced with Local Storage (no hardcoded data)
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNim, setNewNim] = useState('');
  const [newProdi, setNewProdi] = useState('Informatika');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Subscribe to the Cloud Firestore `students` collection when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    setIsLoadingDb(true);
    setDbError(null);

    const unsubscribe = subscribeToStudents(
      (firestoreStudents) => {
        setStudents(firestoreStudents);
        setIsLoadingDb(false);
        setDbError(null);
      },
      (errMessage) => {
        // Ignore permission-denied messages so no red error banner appears on the Dashboard
        if (!errMessage.includes('Missing or insufficient permissions')) {
          setDbError(errMessage);
        } else {
          setDbError(null);
        }
        setIsLoadingDb(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  // AppState lifecycle: read cached students if needed when returning to foreground
  const appState = useAppState({
    onForeground: () => {
      if (students.length === 0) {
        getStudentsData().then((cached) => {
          if (cached.length > 0) setStudents(cached);
        });
      }
    },
  });

  // Derived state calculated during render using useMemo
  const totalProdi = useMemo(
    () => new Set(students.map((item) => item.programStudi)).size,
    [students]
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (item) =>
        item.nama.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.programStudi.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  /**
   * Inserts a new student document (`nama`, `nim`, `programStudi`) into the database (`students`).
   */
  const handleAddStudent = useCallback(async () => {
    const trimmedName = newNama.trim();
    const trimmedNim = newNim.trim();
    const trimmedProdi = newProdi.trim() || 'Informatika';

    if (!trimmedName || !trimmedNim) {
      setDbError('Nama dan NIM mahasiswa wajib diisi.');
      return;
    }

    setIsSavingStudent(true);
    setDbError(null);

    try {
      await addStudentToDatabase({
        nama: trimmedName,
        nim: trimmedNim,
        programStudi: trimmedProdi,
      });

      setNewNama('');
      setNewNim('');
      setNewProdi('Informatika');
      setShowAddForm(false);
    } catch (err) {
      setDbError((err as Error)?.message || 'Gagal menyimpan data mahasiswa.');
    } finally {
      setIsSavingStudent(false);
    }
  }, [newNama, newNim, newProdi]);

  /**
   * Deletes a student document from the database when long-pressed.
   */
  const handleDeleteStudent = useCallback(async (student: Student) => {
    try {
      await deleteStudentFromDatabase(student.id);
    } catch (err) {
      setDbError((err as Error)?.message || 'Gagal menghapus data mahasiswa.');
    }
  }, []);

  // Wait for initial startup check if needed
  if (isHydrating) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </ThemedView>
    );
  }

  // If the user has not logged in during this session, present the Login screen (without footer)
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  /**
   * Renders an individual StudentCard item inside the FlatList.
   */
  const renderStudentItem = ({ item }: { item: Student }) => (
    <StudentCard student={item} onLongPress={handleDeleteStudent} />
  );

  /** Only display non-permission error banners */
  const visibleError =
    dbError && !dbError.includes('Missing or insufficient permissions') ? dbError : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <FlatList
          key={isTablet ? 'tablet-grid' : 'phone-list'}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.tabletColumnWrapper : undefined}
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Top Bar: Dashboard Title, Logged-in Firebase Email & Logout Button */}
              <View style={styles.topBar}>
                <View style={styles.titleGroup}>
                  <ThemedText type="subtitle">Dashboard</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Daftar Mahasiswa{session?.email ? ` • ${session.email}` : ''}
                  </ThemedText>
                </View>

                <View style={styles.topBarActions}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.statusBadge, { borderColor: theme.backgroundSelected }]}>
                    <View style={styles.statusDot} />
                    <ThemedText type="small" themeColor="textSecondary" style={styles.statusText}>
                      {appState}
                    </ThemedText>
                  </ThemedView>

                  <Pressable
                    onPress={logout}
                    style={({ pressed }) => [
                      styles.logoutChip,
                      { borderColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={styles.logoutText}>
                      Keluar
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Summary Statistics Row */}
              <View style={styles.statsRow}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.statCard, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="subtitle" style={styles.statValue}>
                    {students.length}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Total Mahasiswa
                  </ThemedText>
                </ThemedView>

                <ThemedView
                  type="backgroundElement"
                  style={[styles.statCard, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="subtitle" style={styles.statValue}>
                    {totalProdi}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Program Studi
                  </ThemedText>
                </ThemedView>
              </View>

              {/* Error Banner if a form validation or unexpected error occurs */}
              {visibleError && (
                <View style={styles.errorBanner}>
                  <ThemedText type="small" style={styles.errorText}>
                    {visibleError}
                  </ThemedText>
                </View>
              )}

              {/* Search Input & Button to Input New Student into Database */}
              <View style={styles.controlsRow}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Cari nama, NIM, atau prodi..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.searchInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
                <CustomButton
                  title={showAddForm ? 'Tutup' : '+ Tambah'}
                  onPress={() => {
                    setShowAddForm((prev) => !prev);
                    setDbError(null);
                  }}
                  style={styles.addToggleBtn}
                  labelStyle={styles.smallBtnLabel}
                />
              </View>

              {/* Form Input Data Mahasiswa */}
              {showAddForm && (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.addFormCard, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">
                    Input Data Mahasiswa ke Database
                  </ThemedText>
                  <TextInput
                    value={newNama}
                    onChangeText={setNewNama}
                    placeholder="Nama Mahasiswa"
                    placeholderTextColor={theme.textSecondary}
                    editable={!isSavingStudent}
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                  <TextInput
                    value={newNim}
                    onChangeText={setNewNim}
                    placeholder="NIM Mahasiswa (contoh: 24060124120014)"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    editable={!isSavingStudent}
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                  <TextInput
                    value={newProdi}
                    onChangeText={setNewProdi}
                    placeholder="Program Studi (contoh: Informatika)"
                    placeholderTextColor={theme.textSecondary}
                    editable={!isSavingStudent}
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                  <View style={styles.formButtonRow}>
                    <CustomButton
                      title={isSavingStudent ? 'Menyimpan...' : 'Simpan ke Database'}
                      disabled={isSavingStudent}
                      onPress={handleAddStudent}
                      style={styles.flexButton}
                      labelStyle={styles.smallBtnLabel}
                    />
                  </View>
                </ThemedView>
              )}

              {/* Section Title */}
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold">
                  Daftar Mahasiswa ({filteredStudents.length})
                </ThemedText>
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoadingDb ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <ThemedText type="small" themeColor="textSecondary">
                  Memuat data mahasiswa dari database...
                </ThemedText>
              </View>
            ) : (
              <ThemedView
                type="backgroundElement"
                style={[styles.emptyCard, { borderColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">Belum Ada Data Mahasiswa di Database</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                  Database mahasiswa Anda masih kosong. Tekan tombol &quot;+ Tambah&quot; di atas
                  untuk menginput data mahasiswa baru ke database.
                </ThemedText>
              </ThemedView>
            )
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  tabletColumnWrapper: {
    justifyContent: 'space-between',
  },
  headerContainer: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  titleGroup: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 11,
  },
  logoutChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 12,
    color: '#DC2626',
  },
  pressed: {
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.half,
  },
  statValue: {
    color: '#2563EB',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  addToggleBtn: {
    height: 42,
    paddingHorizontal: Spacing.three,
  },
  smallBtnLabel: {
    fontSize: 13,
  },
  addFormCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  flexButton: {
    flex: 1,
    height: 42,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  emptyContainer: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  separator: {
    height: Spacing.two,
  },
});
