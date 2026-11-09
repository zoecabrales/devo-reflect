import { useAppTheme } from "@/src/contexts/ThemeContext";
import { loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
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
 * Desktop Growth dashboard: a strip of at-a-glance numbers, all derived from
 * data the app already stores. Refreshes whenever the Growth tab is focused.
 */
export function GrowthStats() {
  const { theme } = useAppTheme();
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
      label: "Journal entries this month",
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
    <View style={styles.row}>
      {tiles.map((t) => (
        <View
          key={t.label}
          style={[
            styles.tile,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name={t.icon} size={18} color={theme.textSecondary} />
          <Text style={[styles.value, { color: theme.text }]}>{t.value}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
  },
  tile: {
    flex: 1,
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
});
