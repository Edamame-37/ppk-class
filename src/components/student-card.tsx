/**
 * @file student-card.tsx
 * @description Reusable card component for displaying a student's Nama, NIM, and Program Studi
 * on the Dashboard screen. Applies Week 9 concepts:
 * - Reusable modular component with typed props (Week 9 Slide 8)
 * - Responsive layout adapting to screen dimensions (`width >= 768`) and `Platform.OS` (Week 9 Slide 10)
 * - Interactive `<Pressable>` feedback (`onPress` / `onLongPress`, Week 9 Slide 5)
 */

import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

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
  /** Optional handler when a student card is tapped */
  onPress?: (student: Student) => void;
  /** Optional handler when a student card is long-pressed (e.g. to delete custom added student) */
  onLongPress?: (student: Student) => void;
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
 * Renders a responsive styled card containing a student's avatar initials, name (Nama),
 * student ID (NIM), and study program (Program Studi) without an index number label.
 */
export function StudentCard({ student, onPress, onLongPress }: StudentCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const initials = getInitials(student.nama);

  return (
    <Pressable
      onPress={() => onPress?.(student)}
      onLongPress={() => onLongPress?.(student)}
      style={({ pressed }) => [
        styles.pressableWrapper,
        isTablet && styles.tabletCardWidth,
        pressed && styles.pressed,
      ]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.card, { borderColor: theme.backgroundSelected }]}>
        {/* Left section: Avatar with student initials */}
        <View style={styles.avatarContainer}>
          <ThemedText style={styles.avatarText}>{initials}</ThemedText>
        </View>

        {/* Center section: Nama, NIM, and Program Studi details */}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableWrapper: {
    width: '100%',
  },
  tabletCardWidth: {
    width: '48.5%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    // Platform-specific adaptive padding per Week 9 Slide 10
    padding: Platform.OS === 'ios' ? 20 : 16,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
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
