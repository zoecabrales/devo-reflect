import { AppModal, BentoGrid, PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
  BookmarkedVerse,
  bookmarkRef,
  loadBookmarks,
} from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import {
  addMemoryVerse,
  ClozeToken,
  isMastered,
  loadMemoryVerses,
  makeCloze,
  MASTERY_STREAK,
  MemoryVerse,
  normalizeWord,
  recordPractice,
  removeMemoryVerse,
  verseRef,
} from "@/src/services/memoryVerses";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import {
  MODAL_MAX_WIDTH,
  pageScrollMarker,
  useIsDesktop,
  useListPaddingH,
  usePageScroll,
} from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "flashcards" | "fill";

/** Verses per practice session. */
const SESSION_SIZE = 10;

export default function MemoryVerses() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const padH = useListPaddingH();
  // Phone / tablet web: the page scrolls, not an inner box (responsive.ts)
  const pageScroll = usePageScroll();
  // Web (any width): bento grid layout; BentoGrid drops to one column on
  // phones. The native app keeps the simple stacked list.
  const gridLayout = Platform.OS === "web";
  const uid = auth.currentUser?.uid ?? "";

  const [verses, setVerses] = useState<MemoryVerse[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemoryVerse | null>(null);

  // Practice session
  const [mode, setMode] = useState<Mode | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      Promise.all([loadMemoryVerses(uid), loadBookmarks(uid)])
        .then(([m, b]) => {
          setVerses(m);
          setBookmarks(b);
        })
        .catch((err) => console.warn("Failed to load memory verses:", err))
        .finally(() => setLoading(false));
    }, [uid]),
  );

  const memorised = verses.filter(isMastered).length;
  const added = new Set(verses.map((v) => v.id));
  const available = bookmarks.filter((b) => !added.has(b.id));

  async function handleAdd(bm: BookmarkedVerse) {
    const v = await addMemoryVerse(uid, bm);
    setVerses((prev) => [v, ...prev]);
  }

  async function handleRemove(v: MemoryVerse) {
    await removeMemoryVerse(uid, v.id);
    setVerses((prev) => prev.filter((x) => x.id !== v.id));
    setRemoveTarget(null);
  }

  function startPractice(m: Mode) {
    // Least-practised, not-yet-memorised verses first
    const order = [...verses].sort(
      (a, b) =>
        Number(isMastered(a)) - Number(isMastered(b)) ||
        a.streak - b.streak ||
        (a.lastPracticedAt ?? 0) - (b.lastPracticedAt ?? 0),
    );
    setQueue(order.slice(0, SESSION_SIZE).map((v) => v.id));
    setIndex(0);
    setCorrectCount(0);
    setMode(m);
  }

  async function answer(correct: boolean) {
    const v = verses.find((x) => x.id === queue[index]);
    if (!v) return;
    const updated = await recordPractice(uid, v, correct);
    setVerses((prev) => prev.map((x) => (x.id === v.id ? updated : x)));
    if (correct) setCorrectCount((n) => n + 1);
    setIndex((i) => i + 1);
  }

  // Phones and tablets: tighter cards and type
  const compact = !isDesktop;
  const surface = { backgroundColor: theme.surface, borderColor: theme.border };
  const card = [surface, compact && styles.cardCompact];
  const current =
    mode && index < queue.length
      ? verses.find((x) => x.id === queue[index])
      : undefined;

  // ── Practice ──────────────────────────────────────────────────────────────
  function renderPractice() {
    if (!current) {
      // Session finished
      return (
        <View style={[styles.card, card, styles.center]}>
          <Ionicons name="trophy-outline" size={28} color={theme.text} />
          <Text style={[styles.title, compact && styles.titleCompact, { color: theme.text }]}>
            Session complete
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {correctCount} of {queue.length} recalled correctly.
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, styles.btnOutline, { borderColor: theme.border }]}
              onPress={() => setMode(null)}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, { backgroundColor: theme.primary }]}
              onPress={() => startPractice(mode!)}
            >
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Practise again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stack}>
        <View style={styles.practiceHead}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {mode === "flashcards" ? "FLASHCARDS" : "FILL IN THE BLANK"} ·{" "}
            {index + 1} OF {queue.length}
          </Text>
          <TouchableOpacity onPress={() => setMode(null)} hitSlop={8}>
            <Text style={[styles.link, { color: theme.textSecondary }]}>
              End
            </Text>
          </TouchableOpacity>
        </View>
        {mode === "flashcards" ? (
          <Flashcard key={current.id + index} verse={current} onAnswer={answer} />
        ) : (
          <FillBlank
            key={current.id + index}
            verse={current}
            seed={index + current.practiceCount}
            onAnswer={answer}
          />
        )}
      </View>
    );
  }

  // ── Verse card ────────────────────────────────────────────────────────────
  function renderVerseCard(v: MemoryVerse, tile = false) {
    const mastered = isMastered(v);
    return (
      <View
        key={v.id}
        style={[styles.card, card, styles.verseCard, tile && desktopPage.tileFill]}
      >
        <View style={styles.verseHead}>
          <Text style={[styles.ref, compact && styles.refCompact, { color: theme.text }]}>
            {verseRef(v)}
            {!!v.version && (
              <Text style={{ color: theme.textSecondary }}>
                {"  "}
                {v.version}
              </Text>
            )}
          </Text>
          <TouchableOpacity
            onPress={() => setRemoveTarget(v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${verseRef(v)}`}
          >
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text
          style={[
            tile ? styles.verseTextTile : styles.verseText,
            tile && compact && styles.verseTextTileCompact,
            { color: theme.textSecondary },
          ]}
          numberOfLines={tile ? 5 : 2}
        >
          {v.text}
        </Text>
        {tile && <View style={styles.grow} />}
        {/* Progress toward mastery */}
        <View style={styles.dots}>
          {Array.from({ length: MASTERY_STREAK }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < Math.min(v.streak, MASTERY_STREAK) ? GREEN : theme.border,
                },
              ]}
            />
          ))}
          <Text
            style={[
              styles.dotsLabel,
              { color: mastered ? GREEN : theme.textSecondary },
            ]}
          >
            {mastered
              ? "Memorised"
              : v.practiceCount === 0
                ? "Not practised yet"
                : `${v.streak} in a row`}
          </Text>
        </View>
      </View>
    );
  }

  // ── Web grid ──────────────────────────────────────────────────────────────
  function renderGrid() {
    const learning = verses.filter(
      (v) => !isMastered(v) && v.practiceCount > 0,
    ).length;
    const fresh = verses.filter((v) => v.practiceCount === 0).length;
    const modes: {
      mode: Mode;
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      desc: string;
    }[] = [
      {
        mode: "flashcards",
        icon: "albums-outline",
        title: "Flashcards",
        desc: "Say the verse from memory, then reveal it to check.",
      },
      {
        mode: "fill",
        icon: "create-outline",
        title: "Fill in the blank",
        desc: "Type the missing words back into the verse.",
      },
    ];

    return (
      <View style={compact ? styles.sectionsCompact : styles.sections}>
        <BentoGrid
          gap={compact ? 10 : 14}
          data={["practice", "progress"]}
          keyExtractor={(k) => k}
          spanFor={(k) => (k === "practice" ? 2 : 1)}
          renderItem={(k) =>
            k === "practice" ? (
              <View style={[styles.card, card, desktopPage.tileFill]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  PRACTISE · UP TO {SESSION_SIZE} VERSES
                </Text>
                <View style={styles.modeRow}>
                  {modes.map((m) => (
                    <TouchableOpacity
                      key={m.mode}
                      style={[
                        styles.modeTile, compact && styles.modeTileCompact,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => startPractice(m.mode)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={m.icon}
                        size={22}
                        color={theme.primaryText}
                      />
                      <Text
                        style={[styles.modeTitle, compact && styles.modeTitleCompact, { color: theme.primaryText }]}
                      >
                        {m.title}
                      </Text>
                      <Text
                        style={[styles.modeDesc, compact && styles.modeDescCompact, { color: theme.primaryText }]}
                      >
                        {m.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={[styles.card, card, desktopPage.tileFill]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  PROGRESS
                </Text>
                <Text style={[styles.bigNumber, compact && styles.bigNumberCompact, { color: theme.text }]}>
                  {memorised}
                  <Text style={[styles.bigNumberOf, compact && styles.bigNumberOfCompact, { color: theme.textSecondary }]}>
                    {" "}/ {verses.length}
                  </Text>
                </Text>
                <Text style={[styles.body, { color: theme.textSecondary }]}>
                  memorised
                </Text>
                <View style={[styles.track, { backgroundColor: theme.background }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.round((memorised / verses.length) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.grow} />
                <View style={styles.statRow}>
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>
                    <Text style={[styles.strong, { color: theme.text }]}>
                      {learning}
                    </Text>{" "}
                    learning
                  </Text>
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>
                    <Text style={[styles.strong, { color: theme.text }]}>
                      {fresh}
                    </Text>{" "}
                    not practised
                  </Text>
                </View>
              </View>
            )
          }
        />

        <View style={styles.stack}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            YOUR VERSES
          </Text>
          {/* Long verses get wide tiles; "Add" closes the grid */}
          <BentoGrid
            gap={compact ? 10 : 14}
            data={[...verses, null]}
            keyExtractor={(v) => v?.id ?? "add"}
            spanFor={(v) => (v && v.text.length > 160 ? 2 : 1)}
            minColumnWidth={240}
            renderItem={(v) =>
              v ? (
                renderVerseCard(v, true)
              ) : (
                <TouchableOpacity
                  style={[
                    styles.card,
                    styles.addTile, compact && styles.addTileCompact,
                    desktopPage.tileFill,
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setPickerOpen(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Ionicons name="add-circle-outline" size={26} color={theme.textSecondary} />
                  <Text style={[styles.link, { color: theme.text }]}>
                    Add from bookmarks
                  </Text>
                </TouchableOpacity>
              )
            }
          />
        </View>
      </View>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  function renderList() {
    if (verses.length === 0) {
      return (
        <View style={[styles.card, card, styles.center]}>
          <Ionicons name="albums-outline" size={28} color={theme.text} />
          <Text style={[styles.title, compact && styles.titleCompact, { color: theme.text }]}>
            Hide God&apos;s Word in your heart
          </Text>
          <Text style={[styles.body, styles.centerText, { color: theme.textSecondary }]}>
            Pick verses from your bookmarks, then practise them with flashcards
            or fill-in-the-blank.
          </Text>
          {bookmarks.length > 0 ? (
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnWide, { backgroundColor: theme.primary }]}
              onPress={() => setPickerOpen(true)}
            >
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Choose from bookmarks
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnWide, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/(tabs)/bible-browser")}
            >
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Bookmark a verse first
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (gridLayout) return renderGrid();

    return (
      <View style={styles.stack}>
        {/* Summary + practice */}
        <View style={[styles.card, card]}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            <Text style={[styles.strong, { color: theme.text }]}>
              {memorised} of {verses.length}
            </Text>{" "}
            memorised
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, { backgroundColor: theme.primary }]}
              onPress={() => startPractice("flashcards")}
            >
              <Ionicons name="albums-outline" size={16} color={theme.primaryText} />
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Flashcards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, { backgroundColor: theme.primary }]}
              onPress={() => startPractice("fill")}
            >
              <Ionicons name="create-outline" size={16} color={theme.primaryText} />
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Fill in the blank
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listHead}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            YOUR VERSES
          </Text>
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            hitSlop={8}
            style={styles.addLink}
          >
            <Ionicons name="add" size={16} color={theme.text} />
            <Text style={[styles.link, { color: theme.text }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {verses.map((v) => renderVerseCard(v))}
      </View>
    );
  }

  return (
    <SafeAreaView
      {...pageScrollMarker(pageScroll)}
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Memory Verses"
        subtitle="Learn Scripture by heart"
      />
      <ScrollView
        {...pageScrollMarker(pageScroll, "pageScrollList")}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padH },
          isDesktop && desktopPage.content,
        ]}
      >
        {/* Desktop: practice and the empty state keep a readable column,
            left-aligned under the page title; the grid uses the full width */}
        <View
          style={
            isDesktop &&
            (mode || verses.length === 0 || !gridLayout) &&
            styles.desktopColumn
          }
        >
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loader} />
        ) : mode ? (
          renderPractice()
        ) : (
          renderList()
        )}
        </View>
      </ScrollView>

      {/* ── Add from bookmarks ── */}
      <AppModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        overlayStyle={styles.overlay}
        cardStyle={[styles.modalCard, surface]}
      >
        <View style={styles.listHead}>
          <Text style={[styles.title, compact && styles.titleCompact, { color: theme.text }]}>
            Add from bookmarks
          </Text>
          <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={8}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        {available.length === 0 ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {bookmarks.length === 0
              ? "You have no bookmarks yet. Bookmark verses in the Bible reader first."
              : "Every bookmarked verse is already in your list."}
          </Text>
        ) : (
          <ScrollView style={styles.pickerList}>
            {available.map((b) => (
              <View
                key={b.id}
                style={[styles.pickRow, { borderBottomColor: theme.border }]}
              >
                <View style={styles.flex}>
                  <Text style={[styles.ref, compact && styles.refCompact, { color: theme.text }]}>
                    {bookmarkRef(b)}
                  </Text>
                  <Text
                    style={[styles.verseText, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {b.text}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleAdd(b)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${bookmarkRef(b)}`}
                >
                  <Ionicons name="add" size={18} color={theme.primaryText} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </AppModal>

      {/* ── Remove confirmation ── */}
      <AppModal
        visible={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        overlayStyle={styles.overlay}
        cardStyle={[styles.modalCard, surface]}
      >
        <Text style={[styles.title, compact && styles.titleCompact, { color: theme.text }]}>
          Remove {removeTarget ? verseRef(removeTarget) : ""}?
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          It stays in your bookmarks; only its practice progress is cleared.
        </Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, styles.btnOutline, { borderColor: theme.border }]}
            onPress={() => setRemoveTarget(null)}
          >
            <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, compact && styles.btnCompact, styles.btnFlex, { backgroundColor: "#e53e3e" }]}
            onPress={() => removeTarget && handleRemove(removeTarget)}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

// ── Flashcard ──────────────────────────────────────────────────────────────

function Flashcard({
  verse,
  onAnswer,
}: {
  verse: MemoryVerse;
  onAnswer: (correct: boolean) => void;
}) {
  const { theme } = useAppTheme();
  const [revealed, setRevealed] = useState(false);
  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <View style={[styles.card, card, styles.flashcard]}>
      <Text style={[styles.flashRef, { color: theme.text }]}>
        {verseRef(verse)}
      </Text>
      {revealed ? (
        <Text style={[styles.flashText, { color: theme.text }]}>
          {verse.text}
        </Text>
      ) : (
        <Text style={[styles.body, styles.centerText, { color: theme.textSecondary }]}>
          Say the verse from memory, then reveal it to check.
        </Text>
      )}
      {revealed ? (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnFlex, styles.btnOutline, { borderColor: theme.border }]}
            onPress={() => onAnswer(false)}
          >
            <Text style={[styles.btnText, { color: theme.text }]}>Missed it</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnFlex, { backgroundColor: "#4CAF50" }]}
            onPress={() => onAnswer(true)}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>Got it</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnWide, { backgroundColor: theme.primary }]}
          onPress={() => setRevealed(true)}
        >
          <Text style={[styles.btnText, { color: theme.primaryText }]}>
            Reveal verse
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Fill in the blank ──────────────────────────────────────────────────────

function FillBlank({
  verse,
  seed,
  onAnswer,
}: {
  verse: MemoryVerse;
  seed: number;
  onAnswer: (correct: boolean) => void;
}) {
  const { theme } = useAppTheme();
  const [tokens] = useState<ClozeToken[]>(() => makeCloze(verse.text, seed));
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  const blanks = tokens
    .map((t, i) => (t.answer ? i : -1))
    .filter((i) => i >= 0);
  const isRight = (i: number) =>
    normalizeWord(typed[i] ?? "") === normalizeWord(tokens[i].answer ?? "");
  const allRight = blanks.every(isRight);

  return (
    <View style={[styles.card, card]}>
      <Text style={[styles.flashRef, { color: theme.text }]}>
        {verseRef(verse)}
      </Text>
      <View style={styles.cloze}>
        {tokens.map((t, i) => {
          if (!t.answer) {
            return (
              <Text key={i} style={[styles.clozeWord, { color: theme.text }]}>
                {t.text}
              </Text>
            );
          }
          // Punctuation around the hidden word stays visible
          const at = t.text.indexOf(t.answer);
          const lead = t.text.slice(0, at);
          const trail = t.text.slice(at + t.answer.length);
          const right = checked && isRight(i);
          const wrong = checked && !isRight(i);
          return (
            <View key={i} style={styles.clozeBlank}>
              {!!lead && (
                <Text style={[styles.clozeWord, { color: theme.text }]}>{lead}</Text>
              )}
              {checked && wrong ? (
                <Text style={[styles.clozeWord, styles.clozeFix]}>{t.answer}</Text>
              ) : (
                <TextInput
                  value={typed[i] ?? ""}
                  onChangeText={(s) => setTyped((prev) => ({ ...prev, [i]: s }))}
                  editable={!checked}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.clozeInput,
                    {
                      width: Math.max(44, t.answer.length * 10 + 16),
                      color: theme.text,
                      borderColor: right ? "#4CAF50" : theme.textSecondary,
                    },
                  ]}
                />
              )}
              {!!trail && (
                <Text style={[styles.clozeWord, { color: theme.text }]}>{trail}</Text>
              )}
            </View>
          );
        })}
      </View>
      {checked ? (
        <>
          <Text
            style={[
              styles.body,
              { color: allRight ? "#4CAF50" : theme.textSecondary },
            ]}
          >
            {allRight
              ? "All correct!"
              : `${blanks.filter(isRight).length} of ${blanks.length} correct. The missing words are shown in red.`}
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnWide, { backgroundColor: theme.primary }]}
            onPress={() => onAnswer(allRight)}
          >
            <Text style={[styles.btnText, { color: theme.primaryText }]}>Next</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnWide, { backgroundColor: theme.primary }]}
          onPress={() => setChecked(true)}
        >
          <Text style={[styles.btnText, { color: theme.primaryText }]}>Check</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const GREEN = "#4CAF50";

const styles = StyleSheet.create({
  // ── Phones and tablets (compact) ──
  cardCompact: { padding: 12, gap: 8, borderRadius: 12 },
  sectionsCompact: { gap: 20 },
  modeTileCompact: { padding: 12, minHeight: 92, gap: 4, borderRadius: 10 },
  modeTitleCompact: { fontSize: 15 },
  modeDescCompact: { fontSize: 12, lineHeight: 16 },
  bigNumberCompact: { fontSize: 30, lineHeight: 36 },
  bigNumberOfCompact: { fontSize: 17 },
  addTileCompact: { minHeight: 84 },
  refCompact: { fontSize: 14 },
  titleCompact: { fontSize: 15 },
  btnCompact: { paddingVertical: 9 },
  verseTextTileCompact: { fontSize: 13, lineHeight: 19 },

  container: { flex: 1 },
  content: { paddingBottom: 48 },
  desktopColumn: { width: "100%", maxWidth: 760 },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  stack: { gap: 12 },
  sections: { gap: 28 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, flexGrow: 1 },
  modeTile: {
    flexGrow: 1,
    flexBasis: 200,
    borderRadius: 12,
    padding: 18,
    gap: 6,
    justifyContent: "flex-end",
    minHeight: 130,
  },
  modeTitle: { fontSize: 18, fontFamily: "Oswald_700Bold", letterSpacing: 0.3 },
  modeDesc: { fontSize: 13, lineHeight: 18, opacity: 0.85 },
  bigNumber: {
    fontSize: 40,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 48,
  },
  bigNumberOf: { fontSize: 22 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3, backgroundColor: GREEN },
  statRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  statText: { fontSize: 13 },
  verseTextTile: { fontSize: 14, lineHeight: 21, fontStyle: "italic" },
  addTile: {
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  loader: { marginTop: 40 },
  center: { alignItems: "center" },
  centerText: { textAlign: "center" },
  row: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  title: { fontSize: 17, fontFamily: "Oswald_700Bold", letterSpacing: 0.3 },
  body: { fontSize: 14, lineHeight: 20 },
  strong: { fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  link: { fontSize: 14, fontWeight: "600" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  // Side-by-side buttons share the row; full-width ones stretch
  btnFlex: { flex: 1 },
  btnWide: { alignSelf: "stretch" },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "700" },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  verseCard: { gap: 8 },
  verseHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ref: { fontSize: 15, fontWeight: "700" },
  verseText: { fontSize: 13, lineHeight: 19 },
  dots: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotsLabel: { fontSize: 12, marginLeft: 4 },
  practiceHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flashcard: { alignItems: "center", paddingVertical: 28, gap: 16 },
  flashRef: {
    fontSize: 20,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  flashText: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: "italic",
    textAlign: "center",
  },
  cloze: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 8,
    columnGap: 5,
  },
  clozeBlank: { flexDirection: "row", alignItems: "center" },
  clozeWord: { fontSize: 16, lineHeight: 24 },
  clozeFix: { color: "#e53e3e", fontWeight: "700" },
  clozeInput: {
    borderBottomWidth: 1.5,
    fontSize: 16,
    paddingVertical: 2,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  pickerList: { flexGrow: 0 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
