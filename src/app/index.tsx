/**
 * @file index.tsx
 * @description Student Dashboard screen (main route `/`) for the PPK Class application.
 * Displays a summary header and a list of 5 hardcoded students with their Nama, NIM,
 * and Program Studi, along with a quick navigation button to the Login page.
 */

import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentCard } from '@/components/student-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { STUDENTS_DATA, Student } from '@/constants/students';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * DashboardScreen component that renders the hardcoded list of 5 students
 * (Nama, NIM, Program Studi) and summary metrics.
 */
export default function DashboardScreen() {
  const theme = useTheme();

  // Compute unique Program Studi count from the hardcoded dataset
  const totalProdi = new Set(STUDENTS_DATA.map((item) => item.programStudi)).size;

  /**
   * Renders the top header section above the student FlatList.
   */
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar: Title & Login/Logout Navigation Button */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <ThemedText type="subtitle">Dashboard Mahasiswa</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Daftar Mahasiswa Aktif PPK Class
          </ThemedText>
        </View>

        <Link href="/login" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.loginNavButton,
              { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.loginNavText}>
              Halaman Login
            </ThemedText>
          </Pressable>
        </Link>
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
  loginNavButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  loginNavText: {
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.75,
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
