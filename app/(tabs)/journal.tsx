import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import { deleteEntry, JournalEntry, loadEntries } from "@/src/services/journal";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    SectionList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./journal.styles";

// ── Constants ─────────────────────────────────────────────────────────────

const PHT = "Asia/Manila";

const PSALM_119_11 = {
  ref: "Psalm 119:11",
  text: "Thy word have I laid up in my heart, that I might not sin against thee.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getPHTDateStr(ts: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PHT }).format(
    new Date(ts),
  );
}

/** Count consecutive days (ending today PHT) that have at least one entry. */
function calcStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const unique = [...new Set(entries.map((e) => getPHTDateStr(e.createdAt)))]
    .sort()
    .reverse();
  const today = getPHTDateStr(Date.now());
  let streak = 0;
  let cursor = today;
  for (const date of unique) {
    if (date === cursor) {
      streak++;
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      cursor = getPHTDateStr(d.getTime());
    } else break;
  }
  return streak;
}

type MonthSection = { title: string; count: number; data: JournalEntry[] };

/** Group entries by "Month YYYY" label, newest group first. */
function groupByMonth(entries: JournalEntry[]): MonthSection[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: PHT,
    }).format(new Date(e.createdAt));
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([title, data]) => ({
    title,
    count: data.length,
    data,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Journal() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid ?? "";

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      loadEntries(uid)
        .then(setEntries)
        .finally(() => setLoading(false));
    }, [uid]),
  );

  async function handleDelete(id: string) {
    await deleteEntry(uid, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const streak = calcStreak(entries);
  const sections = groupByMonth(entries);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Journal
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              {entries.length > 0
                ? `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`
                : "Start your first SOAP entry"}
            </Text>
          </View>
          {streak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            >
              <Text>🔥</Text>
              <Text style={[styles.streakText, { color: theme.text }]}>
                {streak} day{streak === 1 ? "" : "s"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </View>
      ) : entries.length === 0 ? (
        /* ── Empty state ── */
        <View style={styles.empty}>
          <Text style={[styles.emptyPrompt, { color: theme.textSecondary }]}>
            No entries yet. Begin your first study using the SOAP method —
            Scripture, Observation, Application, Prayer.
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftColor: theme.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.verseChipText,
                {
                  color: theme.textSecondary,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontSize: 10,
                  fontWeight: "700",
                },
              ]}
            >
              {PSALM_119_11.ref}
            </Text>
            <Text
              style={[
                styles.cardPreview,
                {
                  color: theme.text,
                  opacity: 1,
                  fontSize: 15,
                  lineHeight: 23,
                  fontStyle: "italic",
                },
              ]}
            >
              {PSALM_119_11.text}
            </Text>
          </View>
        </View>
      ) : (
        /* ── Entry list ── */
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <View style={styles.groupHeader}>
              <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
                {section.title}
              </Text>
              <Text style={[styles.groupCount, { color: theme.textSecondary }]}>
                {section.count} {section.count === 1 ? "entry" : "entries"}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const d = new Date(item.createdAt);
            const mon = new Intl.DateTimeFormat("en-US", {
              month: "short",
              timeZone: PHT,
            })
              .format(d)
              .toUpperCase();
            const day = new Intl.DateTimeFormat("en-US", {
              day: "numeric",
              timeZone: PHT,
            }).format(d);
            const title =
              item.title || item.observation.split("\n")[0] || "Untitled";

            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderLeftColor: theme.primary,
                    borderLeftWidth: 3,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/journal-compose",
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.75}
              >
                <View style={styles.cardTopRow}>
                  {/* Date badge */}
                  <View
                    style={[
                      styles.dateBadge,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateBadgeMonth,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {mon}
                    </Text>
                    <Text style={[styles.dateBadgeDay, { color: theme.text }]}>
                      {day}
                    </Text>
                  </View>

                  {/* Body */}
                  <View style={styles.cardBody}>
                    <Text
                      style={[styles.cardTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    {!!item.observation && (
                      <Text
                        style={[
                          styles.cardPreview,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {item.observation}
                      </Text>
                    )}
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Verse chips */}
                {item.scripture.length > 0 && (
                  <View style={styles.verseChipRow}>
                    {item.scripture.slice(0, 3).map((s) => (
                      <View
                        key={s.ref}
                        style={[
                          styles.verseChip,
                          {
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name="book-outline"
                          size={10}
                          color={theme.primary}
                        />
                        <Text
                          style={[
                            styles.verseChipText,
                            { color: theme.primary },
                          ]}
                        >
                          {s.ref}
                        </Text>
                      </View>
                    ))}
                    {item.scripture.length > 3 && (
                      <View
                        style={[
                          styles.verseChip,
                          {
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verseChipText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          +{item.scripture.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push("/(tabs)/journal-compose")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={theme.primaryText} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
