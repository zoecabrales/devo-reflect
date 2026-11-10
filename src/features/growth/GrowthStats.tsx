import { useAppTheme } from "@/src/contexts/ThemeContext";
import { loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { useIsDesktop } from "@/src/utils/responsive";
import { calcStreak, loadEntries } from "@/src/services/journal";
import { loadPrayers } from "@/src/services/prayers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Stats = {
  streak: number;
  entriesThisMonth: number;
  prayersAnswered: number;
  prayersTotal: number;
  bookmarks: number;
};

/**
 * Growth dashboard: a strip of at-a-glance numbers (2×2 on phones), all
 * derived from data the app already stores. Refreshes whenever the Growth tab is focused.
 */
export function GrowthStats() {
  const { theme } = useAppTheme();
  // Phones / tablets: compact tiles (icon beside the label, smaller number)
  const compact = !useIsDesktop();
  const uid = auth.currentUser?.uid ?? "";
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      Promise.all([loadEntries(uid), loadPrayers(uid), loadBookmarks(uid)])
        .then(([entries, prayers, bookmarks]) => {
          const now = new Date();
          setStats({
            streak: calcStreak(entries),
            entriesThisMonth: entries.filter((e) => {
              const d = new Date(e.createdAt);
              return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth()
              );
            }).length,
            prayersAnswered: prayers.filter((p) => p.answeredAt !== null)
              .length,
            prayersTotal: prayers.length,
            bookmarks: bookmarks.length,
          });
        })
        .catch((err) => console.warn("Failed to load growth stats:", err));
    }, [uid]),
  );

  const tiles: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
  }[] = [
    {
      icon: "flame-outline",
      value: stats ? String(stats.streak) : "–",
      label: "Day streak",
    },
    {
      icon: "book-outline",
      value: stats ? String(stats.entriesThisMonth) : "–",
      label: compact ? "Entries this month" : "Journal entries this month",
    },
    {
      icon: "hand-left-outline",
      value: stats ? `${stats.prayersAnswered} / ${stats.prayersTotal}` : "–",
      label: "Prayers answered",
    },
    {
      icon: "bookmark-outline",
      value: stats ? String(stats.bookmarks) : "–",
      label: "Saved verses",
    },
  ];

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {tiles.map((t) =>
        compact ? (
          <View
            key={t.label}
            style={[
              styles.tile,
              styles.tileCompact,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.labelRow}>
              <Ionicons name={t.icon} size={14} color={theme.textSecondary} />
              <Text
                style={[styles.labelCompact, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </View>
            <Text style={[styles.valueCompact, { color: theme.text }]}>
              {t.value}
            </Text>
          </View>
        ) : (
          <View
            key={t.label}
            style={[
              styles.tile,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name={t.icon} size={18} color={theme.textSecondary} />
            <Text style={[styles.value, { color: theme.text }]}>
              {t.value}
            </Text>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {t.label}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Tiles wrap: 4 across on tablet / desktop, 2×2 on phones
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
  },
  value: {
    fontSize: 28,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  // ── Compact (phones / tablets) ──
  rowCompact: {
    gap: 10,
  },
  tileCompact: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelCompact: {
    flexShrink: 1,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  valueCompact: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
});
