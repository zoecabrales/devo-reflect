import {
  MAIN_ITEMS,
  NavItem,
  PARENT_ITEM,
  SETTINGS_ITEM,
  TabBarProps,
} from "@/src/components/desktop/DesktopSidebar";
import { TAB_ACTIVE_COLOR } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

/** Height of the bar itself, below the status-bar inset. */
export const MOBILE_TOP_BAR_HEIGHT = 56;

type Props = TabBarProps & {
  /** Status-bar inset; the screens below are given a top inset of 0. */
  topInset: number;
};

/**
 * Phone / tablet web replacement for the bottom tab bar: a slim top bar
 * (logo, search, ☰) whose menu opens a panel with the app's sections.
 * With no bar pinned to the bottom, pages scroll freely and the browser
 * can collapse its own toolbars. Passed to <Tabs tabBar> with
 * tabBarPosition "top", so it gets the same navigation state.
 */
export function MobileTopBar({ state, navigation, topInset }: Props) {
  const { theme } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentName = state.routes[state.index].name;
  const activeName = PARENT_ITEM[currentName] ?? currentName;

  function go(name: string) {
    setMenuOpen(false);
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
        style={[
          styles.menuItem,
          active && { backgroundColor: theme.surface },
        ]}
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={active ? item.activeIcon : item.icon}
          size={20}
          color={color}
        />
        <Text
          style={[
            styles.menuLabel,
            { color },
            active && styles.menuLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        // Stays at the top while the page scrolls (`sticky` is web-only)
        { position: "sticky", top: 0 } as unknown as ViewStyle,
        {
          paddingTop: topInset,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          style={styles.brand}
          onPress={() => go("home")}
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
          <Pressable
            onPress={() => go("concordance")}
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Search the Bible"
          >
            <Ionicons name="search-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        {/* Tap outside the panel to close */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuOpen(false)}
          accessibilityLabel="Close menu"
        >
          <Pressable
            // Swallow taps inside the panel so they don't close it
            onPress={() => {}}
            style={[
              styles.panel,
              {
                paddingTop: topInset + 12,
                backgroundColor: theme.background,
                borderLeftColor: theme.border,
              },
            ]}
          >
            <View style={styles.panelHeader}>
              <Text
                style={[styles.panelTitle, { color: theme.textSecondary }]}
              >
                MENU
              </Text>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={[styles.iconButton, { backgroundColor: theme.surface }]}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>
            {MAIN_ITEMS.map(renderItem)}
            <View
              style={[styles.panelDivider, { backgroundColor: theme.border }]}
            />
            {renderItem(SETTINGS_ITEM)}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: MOBILE_TOP_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "flex-end",
  },
  panel: {
    height: "100%",
    width: "78%",
    maxWidth: 320,
    paddingHorizontal: 12,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuLabelActive: {
    fontWeight: "700",
  },
  panelDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
    marginHorizontal: 12,
  },
});
