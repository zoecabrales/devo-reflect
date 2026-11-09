import { VerseCardSkeleton } from "@/src/components";
import { TAB_ACTIVE_COLOR, Theme } from "@/src/constants/theme";
import {
  BIBLE_COLLECTIONS,
  BibleVerse,
  ReadingPosition,
} from "@/src/services/bible";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  theme: Theme;
  greeting: string;
  displayName: string;
  dateText: string;
  verse: BibleVerse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  readingPosition: ReadingPosition | null;
  /** Journal entries written since Monday; null while loading. */
  journalThisWeek: number | null;
};

/** Desktop web layout for the Home tab (rendered inside the sidebar shell). */
export function DesktopHome({
  theme,
  greeting,
  displayName,
  dateText,
  verse,
  loading,
  error,
  onRetry,
  readingPosition,
  journalThisWeek,
}: Props) {
  const router = useRouter();
  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.page}>
        {/* ── Greeting ── */}
        <Text style={[styles.greeting, { color: theme.text }]}>
          {greeting}, {displayName}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {dateText}
        </Text>

        {/* ── Verse of the day + daily walk ── */}
        <View style={styles.topRow}>
          <View style={[styles.card, styles.verseCard, card]}>
            <SectionLabel theme={theme}>Verse of the Day</SectionLabel>
            {loading ? (
              <VerseCardSkeleton />
            ) : error || !verse ? (
              <>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  Could not load today&apos;s verse.
                </Text>
                <ArrowLink label="Try again" onPress={onRetry} />
              </>
            ) : (
              <>
                <Text style={[styles.verseRef, { color: theme.text }]}>
                  {verse.bookLabel} {verse.chapter}:{verse.verse}
                </Text>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {verse.text}
                </Text>
                <ArrowLink
                  label="Read in context"
                  onPress={() =>
                    router.push(
                      `/(tabs)/bible-browser?bookId=${verse.book}&chapter=${verse.chapter}&verse=${verse.verse}`,
                    )
                  }
                />
              </>
            )}
          </View>

          <View style={[styles.card, styles.walkCard, card]}>
            <SectionLabel theme={theme}>Your Daily Walk</SectionLabel>
            <Text style={[styles.walkCount, { color: theme.text }]}>
              {journalThisWeek === null
                ? "–"
                : String(journalThisWeek).padStart(2, "0")}
            </Text>
            <Text style={[styles.walkCaption, { color: theme.textSecondary }]}>
              Journal {journalThisWeek === 1 ? "entry" : "entries"} this week
            </Text>
            <View
              style={[styles.walkDivider, { backgroundColor: theme.border }]}
            />
            <ArrowLink
              label={
                readingPosition
                  ? `Continue reading · ${readingPosition.bookLabel} ${readingPosition.chapter}`
                  : "Start reading"
              }
              onPress={() =>
                router.push(
                  readingPosition
                    ? `/(tabs)/bible-browser?bookId=${readingPosition.bookId}&chapter=${readingPosition.chapter}`
                    : "/(tabs)/bible-browser",
                )
              }
            />
          </View>
        </View>

        {/* ── Browse by section ── */}
        <SectionLabel theme={theme} style={styles.browseLabel}>
          Browse by Section
        </SectionLabel>
        <View style={styles.grid}>
          {BIBLE_COLLECTIONS.map((col) => (
            <HoverCard
              key={col.id}
              theme={theme}
              style={styles.sectionCard}
              accessibilityLabel={`Explore ${col.label}`}
              onPress={() =>
                router.push(`/(tabs)/bible-browser?collectionId=${col.id}`)
              }
            >
              <Ionicons
                name={col.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={theme.text}
              />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {col.label}
              </Text>
              <Text style={[styles.sectionLink, { color: theme.textSecondary }]}>
                Explore books →
              </Text>
            </HoverCard>
          ))}
        </View>

        {/* ── Quick access ── */}
        <HoverCard
          theme={theme}
          style={styles.quickCard}
          accessibilityLabel="Read the Word"
          onPress={() => router.push("/(tabs)/bible-browser")}
        >
          <View style={{ flex: 1 }}>
            <SectionLabel theme={theme}>Quick Access</SectionLabel>
            <Text style={[styles.quickTitle, { color: theme.text }]}>
              Read the Word
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={TAB_ACTIVE_COLOR} />
        </HoverCard>
      </View>
    </ScrollView>
  );
}

// ── Small building blocks ──────────────────────────────────────────────────

function SectionLabel({
  theme,
  children,
  style,
}: {
  theme: Theme;
  children: string;
  style?: object;
}) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }, style]}>
      {children.toUpperCase()}
    </Text>
  );
}

function ArrowLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={styles.link}>
      <Text style={styles.linkText}>{label} →</Text>
    </Pressable>
  );
}

function HoverCard({
  theme,
  style,
  onPress,
  accessibilityLabel,
  children,
}: {
  theme: Theme;
  style: object;
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.card,
        style,
        {
          backgroundColor: theme.surface,
          borderColor: hovered ? theme.textSecondary : theme.border,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 40,
  },
  page: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    gap: 14,
  },
  verseCard: {
    flex: 3,
  },
  walkCard: {
    flex: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  verseRef: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  link: {
    marginTop: 14,
    alignSelf: "flex-start",
  },
  linkText: {
    fontSize: 14,
    color: TAB_ACTIVE_COLOR,
  },
  walkCount: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  walkCaption: {
    fontSize: 14,
    marginTop: 6,
  },
  walkDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 18,
  },
  browseLabel: {
    marginTop: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  sectionCard: {
    width: "32.6%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionLink: {
    fontSize: 12,
  },
  quickCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  quickTitle: {
    fontSize: 17,
  },
});
