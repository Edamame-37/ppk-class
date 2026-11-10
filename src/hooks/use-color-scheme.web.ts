/**
 * @file use-color-scheme.web.ts
 * @description Web color scheme hook that enforces the 'light' theme across the web application.
 */

/**
 * Returns the active color scheme for web (fixed to 'light').
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
