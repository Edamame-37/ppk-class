/**
 * @file use-app-state.ts
 * @description Custom React Hook implementing the AppState API lifecycle pattern
 * from Week 9 Slides 14, 22, 23, and 24:
 * - Tracks application-wide state (`active` | `inactive` | `background`)
 * - Executes `onBackground` (e.g. `saveDraft()`) when moving to background
 * - Executes `onForeground` (e.g. `refreshData()`) when returning to active foreground
 * - Cleans up the listener via `sub.remove()` on unmount to prevent memory leaks
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Callbacks triggered on application state transitions.
 */
export interface UseAppStateCallbacks {
  /** Invoked when the app transitions into the `background` or `inactive` state */
  onBackground?: () => void;
  /** Invoked when the app returns to the `active` (foreground) state */
  onForeground?: () => void;
}

/**
 * Subscribes to React Native's `AppState` lifecycle and cleans up on unmount.
 *
 * @param callbacks - Optional handlers for background and foreground transitions
 * @returns The current `AppStateStatus` (`'active'`, `'background'`, `'inactive'`, etc.)
 */
export function useAppState(callbacks?: UseAppStateCallbacks): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus | undefined) ?? 'active'
  );
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        callbacksRef.current?.onBackground?.();
      } else if (nextAppState === 'active') {
        callbacksRef.current?.onForeground?.();
      }
    });

    // Mandatory cleanup on component unmount to prevent memory leaks (Week 9 Slide 14 & 23)
    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}
