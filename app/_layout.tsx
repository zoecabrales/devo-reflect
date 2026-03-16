import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { Oswald_700Bold, useFonts } from "@expo-google-fonts/oswald";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Oswald_700Bold });

  // Do NOT hide the native splash here — hiding is delegated to the first
  // auth-aware component that mounts (SplashScreen.tsx or (tabs)/_layout.tsx)
  // so that a restored navigation state never flashes the dashboard.
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
