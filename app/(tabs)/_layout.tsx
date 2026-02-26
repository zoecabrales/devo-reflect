import { Tabs } from "expo-router";

export default function TabsLayout() {
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

