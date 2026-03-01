import {
  isIdleTimeout,
  setLastActiveAt,
  signOutUser,
} from "@/src/services/auth";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

type AuthState = "loading" | "unauthenticated" | "unverified" | "authenticated";

export default function TabsLayout() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const router = useRouter();
  const appStateRef = useRef(AppState.currentState);

  // Auth state guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
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
            prayers: { active: "heart", inactive: "heart-outline" },
            bookmarks: { active: "bookmark", inactive: "bookmark-outline" },
            settings: { active: "settings", inactive: "settings-outline" },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal" }} />
      <Tabs.Screen name="prayers" options={{ title: "Prayers" }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      {/* Hidden screen — navigable but not shown in the tab bar */}
      <Tabs.Screen
        name="bible-browser"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}
