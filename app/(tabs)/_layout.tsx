import { auth } from "@/src/services/firebase";
import { Redirect, Tabs } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

type AuthState = "loading" | "unauthenticated" | "unverified" | "authenticated";

export default function TabsLayout() {
  const [authState, setAuthState] = useState<AuthState>("loading");

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

  if (authState === "loading") return null;
  if (authState === "unauthenticated")
    return <Redirect href="/(auth)/sign-in" />;
  if (authState === "unverified")
    return <Redirect href="/(auth)/verify-email" />;

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal" }} />
      <Tabs.Screen name="prayers" options={{ title: "Prayers" }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
