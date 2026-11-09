import { useAppTheme } from "@/src/contexts/ThemeContext";
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
          <Ionicons name="book-outline" size={20} color={theme.text} />
        </View>
        <Text style={[styles.brandText, { color: theme.text }]}>
          Devo Reflect
        </Text>
      </Pressable>

      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.href}
            onPress={() => router.navigate(a.href)}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <Ionicons name={a.icon} size={24} color={theme.text} />
          </Pressable>
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
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
});
