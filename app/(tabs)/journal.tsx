import {
  AppModal,
  BentoGrid,
  JournalListSkeleton,
  PageHeader,
  SheetHandle,
} from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  calcStreak,
  deleteEntry,
  JournalEntry,
  loadEntries,
} from "@/src/services/journal";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
// prettier-ignore
import { ScrollView, SectionList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { styles } from "@/src/styles/journal.styles";
import { useIsDesktop } from "@/src/utils/responsive";

// ── Constants ─────────────────────────────────────────────────────────────

const PHT = "Asia/Manila";

const PSALM_119_11 = {
  ref: "Psalm 119:11",
  text: "Thy word have I laid up in my heart, that I might not sin against thee.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

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
  const [guideVisible, setGuideVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

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

  async function confirmDelete() {
    if (!deleteTargetId) return;
    await deleteEntry(uid, deleteTargetId);
    setEntries((prev) => prev.filter((e) => e.id !== deleteTargetId));
    setDeleteTargetId(null);
  }

  const streak = calcStreak(entries);
  const sections = groupByMonth(entries);

  /** One entry card; `tile` = inside the desktop bento grid. */
  function renderEntry(
    item: JournalEntry,
    { tile = false, featured = false } = {},
  ) {
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
          tile && desktopPage.tileFill,
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
                numberOfLines={featured ? 5 : tile ? 3 : 2}
              >
                {item.observation}
              </Text>
            )}
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteTargetId(item.id)}
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
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Journal"
        subtitle={
          entries.length > 0
            ? `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`
            : "Start your first SOAP entry"
        }
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.helpBtn, { borderColor: theme.border }]}
              onPress={() => setGuideVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-outline"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
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
            <TouchableOpacity
              style={[
                styles.newEntryBtn,
                {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => router.push("/(tabs)/journal-compose")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={theme.primaryText} />
              <Text
                style={[
                  styles.newEntryText,
                  {
                    color: theme.primaryText,
                  },
                ]}
              >
                New
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Body ── */}
      {loading ? (
        <JournalListSkeleton />
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
      ) : isDesktop ? (
        /* ── Desktop: a bento grid per month group ── */
        <ScrollView contentContainerStyle={desktopPage.content}>
          {sections.map((section, si) => (
            <View key={section.title}>
              <View style={[styles.groupHeader, styles.groupHeaderDesktop]}>
                <Text
                  style={[styles.groupLabel, { color: theme.textSecondary }]}
                >
                  {section.title}
                </Text>
                <Text
                  style={[styles.groupCount, { color: theme.textSecondary }]}
                >
                  {section.count} {section.count === 1 ? "entry" : "entries"}
                </Text>
              </View>
              <BentoGrid
                data={section.data}
                keyExtractor={(item) => item.id}
                spanFor={(item, index) =>
                  (si === 0 && index === 0) ||
                  item.observation.length > 160 ||
                  item.scripture.length >= 3
                    ? 2
                    : 1
                }
                renderItem={(item, { index }) =>
                  renderEntry(item, {
                    tile: true,
                    featured: si === 0 && index === 0,
                  })
                }
              />
            </View>
          ))}
        </ScrollView>
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
          renderItem={({ item }) => renderEntry(item)}
        />
      )}
      {/* ── Delete Confirmation Modal ── */}
      <AppModal
        visible={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        overlayStyle={styles.deleteModalOverlay}
        cardStyle={[
          styles.deleteModalCard,
          { backgroundColor: theme.surface, borderColor: theme.border, },
        ]}
      >
        <Text style={[styles.deleteModalTitle, { color: theme.text }]}>
          Delete Entry
        </Text>
        <Text
          style={[
            styles.deleteModalBody,
            { color: theme.textSecondary },
          ]}
        >
          This entry will be permanently removed. This cannot be undone.
        </Text>
        <View style={styles.deleteModalActions}>
          <TouchableOpacity
            style={[
              styles.deleteModalCancel,
              { borderColor: theme.border },
            ]}
            onPress={() => setDeleteTargetId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.deleteModalCancelText,
                { color: theme.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteModalConfirm,
              { backgroundColor: "#e53e3e" },
            ]}
            onPress={confirmDelete}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.deleteModalConfirmText, { color: "#fff" }]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* ── SOAP Guide Modal ── */}
      <AppModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        animationType="slide"
        overlayStyle={styles.guideModalOverlay}
        cardStyle={[
          styles.guideModalSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SheetHandle style={styles.guideModalHandle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.guideModalTitle, { color: theme.text }]}>
            The SOAP Method
          </Text>
          <Text
            style={[
              styles.guideModalIntro,
              { color: theme.textSecondary },
            ]}
          >
            A simple framework for reading Scripture slowly and
            responding personally.
          </Text>

          <View
            style={[
              styles.guideModalDivider,
              { backgroundColor: theme.text },
            ]}
          />

          {(
            [
              {
                letter: "S",
                name: "Scripture",
                desc: "Choose a verse or passage to focus on. Write it out rather than just referencing it — the act of writing slows you down.",
                prompt: "What verse stood out to me today?",
              },
              {
                letter: "O",
                name: "Observation",
                desc: "What does the text say? Note context, who is speaking, repeated words. Stay with what's actually in the passage.",
                prompt: "What do I notice about this passage?",
              },
              {
                letter: "A",
                name: "Application",
                desc: "What does this mean for your life today? Be specific — one action, one attitude, one relationship.",
                prompt: "How does this apply to my life right now?",
              },
              {
                letter: "P",
                name: "Prayer",
                desc: "Respond to God based on what you read. It doesn't need to be long — honesty matters more than length.",
                prompt: "What do I want to say to God in response?",
              },
            ] as const
          ).map((step) => (
            <View key={step.letter} style={styles.guideStep}>
              <View
                style={[
                  styles.guideStepBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.guideStepLetter,
                    { color: theme.primaryText },
                  ]}
                >
                  {step.letter}
                </Text>
              </View>
              <View style={styles.guideStepBody}>
                <Text
                  style={[styles.guideStepName, { color: theme.text }]}
                >
                  {step.name}
                </Text>
                <Text
                  style={[
                    styles.guideStepDesc,
                    { color: theme.textSecondary },
                  ]}
                >
                  {step.desc}
                </Text>
                <Text
                  style={[
                    styles.guideStepPrompt,
                    { color: theme.textSecondary },
                  ]}
                >
                  "{step.prompt}"
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.guideModalCTA,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => setGuideVisible(false)}
          >
            <Text
              style={[
                styles.guideModalCTAText,
                { color: theme.primaryText },
              ]}
            >
              Got it
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </AppModal>
    </SafeAreaView>
  );
}
