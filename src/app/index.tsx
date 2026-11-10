/**
 * @file index.tsx
 * @description Main entry route (`/`) for the PPK Class application.
 * Presents the Login screen first when the user opens the application, and transitions
 * to the Student Dashboard screen (displaying 5 hardcoded students with Nama, NIM, and Program Studi)
 * once the user signs in.
 */

import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from '@/app/login';
import { StudentCard } from '@/components/student-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { STUDENTS_DATA, Student } from '@/constants/students';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * DashboardScreen component that renders the hardcoded list of 5 students
 * (Nama, NIM, Program Studi) after the user has logged in from the initial Login screen.
 */
export default function DashboardScreen() {
  const theme = useTheme();

  // Start with isLoggedIn = false so the user is immediately presented with the Login page on app launch
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Compute unique Program Studi count from the hardcoded dataset
  const totalProdi = new Set(STUDENTS_DATA.map((item) => item.programStudi)).size;

  // Render the Login page first before entering the Dashboard
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  /**
   * Renders the top header section above the student FlatList (without the "Halaman Login" text/button).
   */
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar: Dashboard Title & Subtitle */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <ThemedText type="subtitle">Dashboard Mahasiswa</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Daftar Mahasiswa Aktif PPK Class
          </ThemedText>
        </View>
      </View>

      {/* Summary Statistics Row */}
      <View style={styles.statsRow}>
        <ThemedView
          type="backgroundElement"
          style={[styles.statCard, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="subtitle" style={styles.statValue}>
            {STUDENTS_DATA.length}
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

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold">Daftar Mahasiswa ({STUDENTS_DATA.length})</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Data Hardcode
        </ThemedText>
      </View>
    </View>
  );

  /**
   * Renders an individual StudentCard item inside the FlatList.
   */
  const renderStudentItem = ({ item, index }: { item: Student; index: number }) => (
    <StudentCard student={item} index={index + 1} />
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={STUDENTS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: BottomTabInset + Spacing.four,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
});
