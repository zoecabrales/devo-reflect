import { DesktopSidebar } from "@/src/components/desktop/DesktopSidebar";
import { DesktopTopBar } from "@/src/components/desktop/DesktopTopBar";
import { TAB_ACTIVE_COLOR } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    isIdleTimeout,
    setLastActiveAt,
    signOutUser,
} from "@/src/services/auth";
import { auth } from "@/src/services/firebase";
import { useIsDesktop } from "@/src/utils/responsive";
import { hideSplashOnce } from "@/src/utils/splashGuard";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Text, View } from "react-native";

type AuthState = "loading" | "unauthenticated" | "unverified" | "authenticated";

export default function TabsLayout() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const router = useRouter();
  const pathname = usePathname();
  const appStateRef = useRef(AppState.currentState);
  const { theme } = useAppTheme();
  // Desktop web: top bar + left sidebar instead of the bottom tab bar
  const isDesktop = useIsDesktop();

  // Treat Home as the active tab when on a hidden screen launched from it
  const homeIsEffectivelyFocused =
    pathname.includes("bible-browser") || pathname.includes("concordance");

  // Keep the Journal tab highlighted when composing
  const journalIsEffectivelyFocused = pathname.includes("journal-compose");

  // Auth state guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Hide the native splash in case navigation state was restored directly
      // to (tabs) — prevents the dashboard flashing before the auth redirect.
      // hideSplashOnce() is a no-op if SplashScreen.tsx already called it.
      hideSplashOnce();

      if (!user) {
        setAuthState("unauthenticated");
      } else if (!user.emailVerified) {
        setAuthState("unverified");
      } else {
        setAuthState("authenticated");
      }
    });
    return unsubscribe;
  }, []);

  // Idle timeout: save timestamp on background, check on foreground
  useEffect(() => {
    // Cold-start check — handle case where app was left for >10 min then killed and reopened
    isIdleTimeout().then((timedOut) => {
      if (timedOut) {
        signOutUser().then(() => router.replace("/(auth)/sign-in"));
      }
    });

    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (nextState === "background" || nextState === "inactive") {
          // Save the moment the user left the app
          await setLastActiveAt();
        } else if (nextState === "active" && prev !== "active") {
          // User returned — check if they were away for more than 10 minutes
          const timedOut = await isIdleTimeout();
          if (timedOut) {
            await signOutUser();
            router.replace("/(auth)/sign-in");
          }
        }
      },
    );

    return () => subscription.remove();
  }, []);

  if (authState === "loading") return null;
  if (authState === "unauthenticated")
    return <Redirect href="/(auth)/sign-in" />;
  if (authState === "unverified")
    return <Redirect href="/(auth)/verify-email" />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {isDesktop && <DesktopTopBar />}
      <Tabs
        tabBar={isDesktop ? (props) => <DesktopSidebar {...props} /> : undefined}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarPosition: isDesktop ? "left" : "bottom",
          tabBarActiveTintColor: TAB_ACTIVE_COLOR,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<
              string,
              {
                active: keyof typeof Ionicons.glyphMap;
                inactive: keyof typeof Ionicons.glyphMap;
              }
            > = {
              home: { active: "home", inactive: "home-outline" },
              journal: { active: "book", inactive: "book-outline" },
              growth: { active: "leaf", inactive: "leaf-outline" },
              bookmarks: { active: "bookmark", inactive: "bookmark-outline" },
              settings: { active: "settings", inactive: "settings-outline" },
              // Hidden / auxiliary screens reuse main tab icons
              "bible-browser": { active: "home", inactive: "home-outline" },
              concordance: { active: "home", inactive: "home-outline" },
              "journal-compose": { active: "book", inactive: "book-outline" },
            };
            const icon = icons[route.name] ?? icons.home;
            // Keep Home/Journal highlighted when the user is inside a hidden screen
            const isFocused =
              focused ||
              (route.name === "home" && homeIsEffectivelyFocused) ||
              (route.name === "journal" && journalIsEffectivelyFocused);
            const iconColor = isFocused ? TAB_ACTIVE_COLOR : color;
            return (
              <Ionicons
                name={isFocused ? icon.active : icon.inactive}
                size={size}
                color={iconColor}
              />
            );
          },
          tabBarLabel: ({ focused, color, children }) => {
            const isLabelFocused =
              focused ||
              (route.name === "home" && homeIsEffectivelyFocused) ||
              (route.name === "journal" && journalIsEffectivelyFocused);
            return (
              <Text
                style={{
                  color: isLabelFocused ? TAB_ACTIVE_COLOR : color,
                  fontSize: 10,
                  marginBottom: 2,
                }}
              >
                {children}
              </Text>
            );
          },
        })}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="journal" options={{ title: "Journal" }} />
        <Tabs.Screen name="growth" options={{ title: "Growth" }} />
        <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        {/* Hidden screens — navigable but not shown in the tab bar */}
        <Tabs.Screen name="bible-browser" options={{ href: null }} />
        <Tabs.Screen name="concordance" options={{ href: null }} />
        <Tabs.Screen name="journal-compose" options={{ href: null }} />
        {/* Disabled tabs — files kept for git history, hidden from tab bar */}
        <Tabs.Screen name="prayers" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
