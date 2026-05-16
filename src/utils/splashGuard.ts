import * as SplashScreen from "expo-splash-screen";

let hidden = false;

/**
 * Hides the native splash screen exactly once per app session.
 * Safe to call from multiple components — subsequent calls are no-ops.
 * This prevents the "No native splash screen registered" error that occurs
 * when both SplashScreen.tsx and (tabs)/_layout.tsx race to call hideAsync().
 */
export function hideSplashOnce(): void {
  if (hidden) return;
  hidden = true;
  SplashScreen.hideAsync().catch(() => {});
}

