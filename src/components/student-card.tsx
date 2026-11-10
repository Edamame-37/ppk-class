/**
 * @file student-card.tsx
 * @description Reusable card component for displaying a student's Nama, NIM, and Program Studi
 * on the Dashboard screen without an index number badge.
 */

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Student } from '@/constants/students';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Props for the StudentCard component.
 */
export interface StudentCardProps {
  /** Student data item to render */
  student: Student;
}

/**
 * Extracts up to two uppercase initials from a student's name for the avatar badge.
 *
 * @param fullName - The student's name
 * @returns Uppercase initials (e.g. "AS" for "Asep")
 */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Renders a styled card containing a student's avatar initials, name (Nama),
 * student ID (NIM), and study program (Program Studi).
 */
export function StudentCard({ student }: StudentCardProps) {
  const theme = useTheme();
  const initials = getInitials(student.nama);

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, { borderColor: theme.backgroundSelected }]}>
      {/* Left section: Avatar with student initials */}
      <View style={styles.avatarContainer}>
        <ThemedText style={styles.avatarText}>{initials}</ThemedText>
      </View>

      {/* Center section: Nama, NIM, and Program Studi details (without #1, #2 index label) */}
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <ThemedText type="smallBold" style={styles.nameText}>
            {student.nama}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText type="small" themeColor="textSecondary">
            NIM:{' '}
          </ThemedText>
          <ThemedText type="code" style={styles.nimText}>
            {student.nim}
          </ThemedText>
        </View>

        <View style={styles.badgeContainer}>
          <ThemedView type="backgroundSelected" style={styles.prodiBadge}>
            <ThemedText type="small" style={styles.prodiText}>
              {student.programStudi}
            </ThemedText>
          </ThemedView>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    gap: Spacing.one,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    flexShrink: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nimText: {
    fontSize: 13,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: Spacing.half,
  },
  prodiBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  prodiText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
