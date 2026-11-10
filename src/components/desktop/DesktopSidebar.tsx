import { TAB_ACTIVE_COLOR } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { SIDEBAR_WIDTH } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// expo-router bundles its own bottom-tabs types and doesn't export the tab
// bar props, so derive them from <Tabs tabBar={...}>.
export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export type NavItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

export const MAIN_ITEMS: NavItem[] = [
  { name: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  {
    name: "journal",
    label: "Journal",
    icon: "book-outline",
    activeIcon: "book",
  },
  { name: "growth", label: "Growth", icon: "leaf-outline", activeIcon: "leaf" },
  {
    name: "bookmarks",
    label: "Bookmarks",
    icon: "bookmark-outline",
    activeIcon: "bookmark",
  },
  {
    name: "reading-plans",
    label: "Reading Plans",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "memory-verses",
    label: "Memory Verses",
    icon: "albums-outline",
    activeIcon: "albums",
  },
];

export const SETTINGS_ITEM: NavItem = {
  name: "settings",
  label: "Settings",
  icon: "settings-outline",
  activeIcon: "settings",
};

// Hidden screens highlight the menu item they belong to
export const PARENT_ITEM: Record<string, string> = {
  "bible-browser": "home",
  concordance: "home",
  "journal-compose": "journal",
};

/**
 * Desktop web replacement for the bottom tab bar. Passed to <Tabs tabBar>,
 * so it receives the same navigation state the bottom bar does.
 */
export function DesktopSidebar({ state, navigation }: TabBarProps) {
  const { theme } = useAppTheme();
  const currentName = state.routes[state.index].name;
  const activeName = PARENT_ITEM[currentName] ?? currentName;

  function go(name: string) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (currentName !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  }

  function renderItem(item: NavItem) {
    const active = item.name === activeName;
    const color = active ? TAB_ACTIVE_COLOR : theme.text;
    return (
      <Pressable
        key={item.name}
        onPress={() => go(item.name)}
        style={({ hovered }: { hovered?: boolean }) => [
          styles.item,
          hovered && !active && { backgroundColor: theme.surface },
        ]}
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={active ? item.activeIcon : item.icon}
          size={18}
          color={color}
        />
        <Text
          style={[
            styles.itemLabel,
            { color, opacity: active ? 1 : 0.85 },
            active && styles.itemLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.background }]}>
      <Text style={[styles.menuLabel, { color: theme.textSecondary }]}>
        MENU
      </Text>
      {MAIN_ITEMS.map(renderItem)}
      <View style={styles.spacer} />
      {renderItem(SETTINGS_ITEM)}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingHorizontal: 12,
    paddingTop: 24,
    gap: 2,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  itemLabel: {
    fontSize: 14,
  },
  itemLabelActive: {
    fontWeight: "600",
  },
  spacer: {
    height: 16,
  },
});
