import { useAppTheme } from "@/src/contexts/ThemeContext";
import { NotificationBell } from "@/src/features/connections/NotificationBell";
import { TOP_BAR_HEIGHT } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Desktop web header: brand on the left, quick actions on the right. */
export function DesktopTopBar() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const actions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    href: "/(tabs)/concordance" | "/(tabs)/settings";
  }[] = [
    {
      icon: "search-outline",
      label: "Search the Bible",
      href: "/(tabs)/concordance",
    },
    {
      icon: "person-circle-outline",
      label: "Account settings",
      href: "/(tabs)/settings",
    },
  ];

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}
    >
      <Pressable
        style={styles.brand}
        onPress={() => router.navigate("/(tabs)/home")}
        accessibilityRole="link"
        accessibilityLabel="Devo Reflect home"
      >
        <View
          style={[
            styles.logoTile,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="book-outline" size={16} color={theme.text} />
        </View>
        <Text style={[styles.brandText, { color: theme.text }]}>
          Devo Reflect
        </Text>
      </Pressable>

      <View style={styles.actions}>
        {actions.map((a, i) => (
          <View key={a.href} style={styles.actions}>
            {/* Notifications sit between search and account */}
            {i === 1 && (
              <NotificationBell
                buttonStyle={styles.actionButton}
                panelTop={TOP_BAR_HEIGHT}
              />
            )}
            <Pressable
              onPress={() => router.navigate(a.href)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Ionicons name={a.icon} size={20} color={theme.text} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: TOP_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 18,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
});
