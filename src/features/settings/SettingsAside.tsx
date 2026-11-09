import { useAppTheme } from "@/src/contexts/ThemeContext";
import { loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { loadEntries } from "@/src/services/journal";
import { loadPrayers } from "@/src/services/prayers";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Counts = { entries: number; bookmarks: number; prayers: number };

/**
 * Desktop Settings side column: account summary and app info with the
 * legal pages.
 */
export function SettingsAside() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const user = auth.currentUser;
  const uid = user?.uid ?? "";
  const [counts, setCounts] = useState<Counts | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      Promise.all([loadEntries(uid), loadBookmarks(uid), loadPrayers(uid)])
        .then(([e, b, p]) =>
          setCounts({
            entries: e.length,
            bookmarks: b.length,
            prayers: p.length,
          }),
        )
        .catch((err) => console.warn("Failed to load account counts:", err));
    }, [uid]),
  );

  const email = user?.email ?? "";
  const name = user?.displayName || email.split("@")[0] || "Friend";
  const initial = name.charAt(0).toUpperCase();
  const created = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;
  const version = Constants.expoConfig?.version ?? "";

  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <View style={styles.aside}>
      {/* ── Account ── */}
      <Label theme={theme}>Account</Label>
      <View style={[styles.card, card]}>
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.primaryText }]}>
              {initial}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={[styles.meta, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
          {user?.emailVerified && (
            <View style={[styles.badge, { borderColor: theme.border }]}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={theme.textSecondary}
              />
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                Verified
              </Text>
            </View>
          )}
        </View>
        {created && (
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            Member since {created}
          </Text>
        )}
        <View style={[styles.stats, { borderTopColor: theme.border }]}>
          <Stat theme={theme} value={counts?.entries} label="Entries" />
          <Stat theme={theme} value={counts?.bookmarks} label="Bookmarks" />
          <Stat theme={theme} value={counts?.prayers} label="Prayers" />
        </View>
      </View>

      {/* ── About ── */}
      <Label theme={theme}>About</Label>
      <View style={[styles.card, styles.cardFlush, card]}>
        <Row
          theme={theme}
          icon="information-circle-outline"
          label="Devo Reflect"
        >
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            Version {version}
          </Text>
        </Row>
        <Divider theme={theme} />
        <Row
          theme={theme}
          icon="document-text-outline"
          label="Terms & Conditions"
          onPress={() => router.push("/(auth)/terms-and-conditions")}
        />
        <Divider theme={theme} />
        <Row
          theme={theme}
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => router.push("/(auth)/privacy-policy")}
        />
      </View>
    </View>
  );
}

// ── Small building blocks ──────────────────────────────────────────────────

type ThemeProp = { theme: ReturnType<typeof useAppTheme>["theme"] };

function Label({ theme, children }: ThemeProp & { children: string }) {
  return (
    <Text style={[styles.label, { color: theme.textSecondary }]}>
      {children.toUpperCase()}
    </Text>
  );
}

function Stat({
  theme,
  value,
  label,
}: ThemeProp & { value: number | undefined; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>
        {value ?? "–"}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function Row({
  theme,
  icon,
  label,
  onPress,
  children,
}: ThemeProp & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  children?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "link" : undefined}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.row,
        hovered && onPress && { backgroundColor: theme.background },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {children}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={14}
          color={theme.textSecondary}
        />
      )}
    </Pressable>
  );
}

function Divider({ theme }: ThemeProp) {
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  aside: {
    gap: 8,
  },
  // Matches Settings' section labels
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardFlush: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Oswald_700Bold",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
  },
  statLabel: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
});
