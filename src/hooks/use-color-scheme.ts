/**
 * @file use-color-scheme.ts
 * @description Custom color scheme hook that enforces the 'light' theme across the application.
 */

/**
 * Returns the active color scheme for the application (fixed to 'light').
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
