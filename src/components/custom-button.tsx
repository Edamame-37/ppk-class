/**
 * @file custom-button.tsx
 * @description Modular, reusable button component implementing Week 9 Slides 5, 8, and 9:
 * - Principles of Modularity, DRY (Don't Repeat Yourself), Consistency, and Maintenance
 * - Props-driven configuration (`title`, `onPress`, `onLongPress`, `backgroundColor`, `disabled`, `variant`, `leftIcon`)
 * - Responsive touch feedback using `<Pressable>` (`pressed && { opacity: 0.6 }`)
 */

import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Props for the modular CustomButton component (Week 9 Slide 9).
 */
export interface CustomButtonProps {
  /** Text label displayed inside the button */
  title: string;
  /** Handler invoked when the user taps the button */
  onPress?: () => void;
  /** Optional handler invoked when the user long-presses the button (Week 9 Slide 5) */
  onLongPress?: () => void;
  /** Custom background color override */
  backgroundColor?: string;
  /** Custom text color override */
  textColor?: string;
  /** Disables touch interactions when true */
  disabled?: boolean;
  /** Visual preset variant (`primary` | `outline` | `danger`) */
  variant?: 'primary' | 'outline' | 'danger';
  /** Optional icon element rendered to the left of the title (e.g. Google logo) */
  leftIcon?: ReactNode;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
  /** Optional label style override */
  labelStyle?: StyleProp<TextStyle>;
}

/**
 * Reusable CustomButton component supporting multiple visual variants and touch states.
 */
export function CustomButton({
  title,
  onPress,
  onLongPress,
  backgroundColor,
  textColor,
  disabled = false,
  variant = 'primary',
  leftIcon,
  style,
  labelStyle,
}: CustomButtonProps) {
  const theme = useTheme();

  // Resolve background color based on variant and props
  const resolvedBg =
    backgroundColor ??
    (variant === 'primary'
      ? '#2563EB'
      : variant === 'danger'
        ? '#DC2626'
        : theme.background);

  // Resolve border color for outline variant
  const resolvedBorderColor =
    variant === 'outline' ? theme.backgroundSelected : resolvedBg;

  // Resolve label text color
  const resolvedTextColor =
    textColor ?? (variant === 'outline' ? theme.text : '#FFFFFF');

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: resolvedBg,
          borderColor: resolvedBorderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {leftIcon}
      <ThemedText
        type="smallBold"
        style={[styles.label, { color: resolvedTextColor }, labelStyle]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
});
