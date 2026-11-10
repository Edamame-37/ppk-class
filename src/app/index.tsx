/**
 * @file index.tsx
 * @description Home / Student Dashboard screen (`/`) for the PPK Class application.
 * Implements the 5 Firebase + React Native requirements:
 * 1. Authenticates with Google on Firebase Auth (`login.tsx` + `auth-context.tsx`)
 * 2. Stores login session & token in Local Storage (`AsyncStorage`)
 * 3. Bypasses the Login page automatically whenever an active token exists in Local Storage
 * 4. Allows inputting new student data (`nama`, `nim`, `programStudi`) into the `students` database table/collection
 * 5. Displays the live list of students stored in the database via `subscribeToStudents`
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { STUDENTS_DATA, Student } from '@/constants/students';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import {
  addStudentToDatabase,
  resetStudentsInDatabase,
  subscribeToStudents,
} from '@/services/student-service';
import { getStudentsData } from '@/utils/storage';

/**
 * DashboardScreen component displaying the list of students from the database
 * and providing a form to input new student records into the `students` table/collection.
 */
export default function DashboardScreen() {
  const theme = useTheme();
  const { isLoggedIn, isHydrating, session, setIsLoggedIn, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Database student list state (populated via `subscribeToStudents` realtime database listener)
  const [students, setStudents] = useState<Student[]>([...STUDENTS_DATA]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNim, setNewNim] = useState('');
  const [newProdi, setNewProdi] = useState('Informatika');

  // Subscribe to the `students` database collection/table on mount and cleanup on unmount (Week 10 Slide 19)
  useEffect(() => {
    const unsubscribe = subscribeToStudents((dbStudents) => {
      setStudents(dbStudents);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // AppState lifecycle: refresh database cache when app returns from background to active foreground (Week 9 Slide 23)
  const appState = useAppState({
    onForeground: () => {
      getStudentsData().then((stored) => setStudents(stored));
    },
  });

  // Derived state calculated during render using useMemo (Week 9 Slide 17 Decision Guide)
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
   * Inserts a new student record (`nama`, `nim`, `programStudi`) into the `students` database collection.
   */
  const handleAddStudent = useCallback(async () => {
    const trimmedName = newNama.trim();
    if (!trimmedName) return;

    const generatedNim =
      newNim.trim() ||
      `240601241${[2, 3, 4][Math.floor(Math.random() * 3)]}0${String(
        Math.floor(100 + Math.random() * 900)
      )}`;

    await addStudentToDatabase({
      nama: trimmedName,
      nim: generatedNim,
      programStudi: newProdi.trim() || 'Informatika',
    });

    setNewNama('');
    setNewNim('');
    setNewProdi('Informatika');
    setShowAddForm(false);
  }, [newNama, newNim, newProdi]);

  /**
   * Resets the `students` database table back to the 5 initial students (Asep, Mamat, Yanto, Udin, Rahmat).
   */
  const handleResetStudents = useCallback(async () => {
    await resetStudentsInDatabase();
  }, []);

  // While checking Local Storage for an active token on app launch, avoid flashing the Login screen
  if (isHydrating) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </ThemedView>
    );
  }

  // If no active token is found in Local Storage, present the Login screen (without footer)
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  /**
   * Renders an individual StudentCard item inside the FlatList.
   */
  const renderStudentItem = ({ item }: { item: Student }) => <StudentCard student={item} />;

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
              {/* Top Bar: Dashboard Title, Active User Info & Logout Button */}
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
                  onPress={() => setShowAddForm((prev) => !prev)}
                  style={styles.addToggleBtn}
                  labelStyle={styles.smallBtnLabel}
                />
              </View>

              {/* Form Input Data Mahasiswa ke Database (`students` collection) */}
              {showAddForm && (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.addFormCard, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">Input Data Mahasiswa ke Database</ThemedText>
                  <TextInput
                    value={newNama}
                    onChangeText={setNewNama}
                    placeholder="Nama Mahasiswa (contoh: Budi)"
                    placeholderTextColor={theme.textSecondary}
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
                    placeholder="NIM (kosongkan untuk auto-generate 240601241...)"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
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
                      title="Simpan ke Database"
                      onPress={handleAddStudent}
                      style={styles.flexButton}
                      labelStyle={styles.smallBtnLabel}
                    />
                    {students.length !== STUDENTS_DATA.length && (
                      <CustomButton
                        title="Reset 5 Data"
                        variant="outline"
                        onPress={handleResetStudents}
                        style={styles.resetBtn}
                        labelStyle={styles.smallBtnLabel}
                      />
                    )}
                  </View>
                </ThemedView>
              )}

              {/* Section Title */}
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold">
                  Daftar Mahasiswa ({filteredStudents.length})
                </ThemedText>
                {students.length !== STUDENTS_DATA.length && (
                  <Pressable onPress={handleResetStudents}>
                    <ThemedText type="small" style={styles.resetLink}>
                      Reset Default
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
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
  resetBtn: {
    height: 42,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  resetLink: {
    color: '#2563EB',
  },
  separator: {
    height: Spacing.two,
  },
});
