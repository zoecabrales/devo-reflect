import { PageHeader, VerseCardSkeleton } from "@/src/components";
import { TAB_ACTIVE_COLOR, Theme } from "@/src/constants/theme";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import {
  BIBLE_COLLECTIONS,
  BibleCollection,
  BibleVerse,
  ReadingPosition,
} from "@/src/services/bible";
import { contextHref } from "@/src/utils/readerLink";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useState } from "react";
import { SectionGuideButton, SectionGuideModal } from "./SectionGuide";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { SharedVersesCard } from "@/src/features/connections/SharedVersesCard";
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
  // Section whose "?" guide is open
  const [guide, setGuide] = useState<BibleCollection | null>(null);
  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PageHeader title={`${greeting}, ${displayName}`} subtitle={dateText} />
      <ScrollView contentContainerStyle={desktopPage.content}>
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
                      contextHref({
                        bookId: verse.book,
                        chapter: verse.chapter,
                        verse: verse.verse,
                      }),
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

        {/* ── Verses shared by Brethren ── */}
        {BRETHREN_ENABLED && (
          <SharedVersesCard theme={theme} style={styles.sharedCard} large />
        )}

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
              <SectionGuideButton
                theme={theme}
                label={col.label}
                onPress={() => setGuide(col)}
                style={styles.sectionHelpBtn}
              />
              <Ionicons
                name={col.icon as keyof typeof Ionicons.glyphMap}
                size={19}
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

        <SectionGuideModal
          collection={guide}
          theme={theme}
          onClose={() => setGuide(null)}
        />

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
          <Ionicons name="arrow-forward" size={24} color={TAB_ACTIVE_COLOR} />
        </HoverCard>
      </ScrollView>
    </View>
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
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 21,
  },
  topRow: {
    flexDirection: "row",
    gap: 16,
  },
  verseCard: {
    flex: 3,
  },
  walkCard: {
    flex: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: "italic",
  },
  link: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  linkText: {
    fontSize: 16,
    color: TAB_ACTIVE_COLOR,
  },
  walkCount: {
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 45,
  },
  walkCaption: {
    fontSize: 16,
    marginTop: 7,
  },
  walkDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 21,
  },
  browseLabel: {
    marginTop: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  sharedCard: {
    marginTop: 16,
  },
  sectionHelpBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  sectionCard: {
    width: "32.6%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionLink: {
    fontSize: 14,
  },
  quickCard: {
    marginTop: 21,
    flexDirection: "row",
    alignItems: "center",
  },
  quickTitle: {
    fontSize: 20,
  },
});
