import { AppModal, PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { BookmarkedVerse, loadBookmarks } from "@/src/services/bookmarks";
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

  const card = { backgroundColor: theme.surface, borderColor: theme.border };
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
          <Text style={[styles.title, { color: theme.text }]}>
            Session complete
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {correctCount} of {queue.length} recalled correctly.
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.btnFlex, styles.btnOutline, { borderColor: theme.border }]}
              onPress={() => setMode(null)}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFlex, { backgroundColor: theme.primary }]}
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

  // ── List ──────────────────────────────────────────────────────────────────
  function renderList() {
    if (verses.length === 0) {
      return (
        <View style={[styles.card, card, styles.center]}>
          <Ionicons name="albums-outline" size={28} color={theme.text} />
          <Text style={[styles.title, { color: theme.text }]}>
            Hide God&apos;s Word in your heart
          </Text>
          <Text style={[styles.body, styles.centerText, { color: theme.textSecondary }]}>
            Pick verses from your bookmarks, then practise them with flashcards
            or fill-in-the-blank.
          </Text>
          {bookmarks.length > 0 ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnWide, { backgroundColor: theme.primary }]}
              onPress={() => setPickerOpen(true)}
            >
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Choose from bookmarks
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnWide, { backgroundColor: theme.primary }]}
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
              style={[styles.btn, styles.btnFlex, { backgroundColor: theme.primary }]}
              onPress={() => startPractice("flashcards")}
            >
              <Ionicons name="albums-outline" size={16} color={theme.primaryText} />
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Flashcards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFlex, { backgroundColor: theme.primary }]}
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

        {verses.map((v) => {
          const mastered = isMastered(v);
          return (
            <View key={v.id} style={[styles.card, card, styles.verseCard]}>
              <View style={styles.verseHead}>
                <Text style={[styles.ref, { color: theme.text }]}>
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
                  <Ionicons
                    name="close"
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text
                style={[styles.verseText, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {v.text}
              </Text>
              {/* Progress toward mastery */}
              <View style={styles.dots}>
                {Array.from({ length: MASTERY_STREAK }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i < Math.min(v.streak, MASTERY_STREAK)
                            ? "#4CAF50"
                            : theme.border,
                      },
                    ]}
                  />
                ))}
                <Text
                  style={[
                    styles.dotsLabel,
                    { color: mastered ? "#4CAF50" : theme.textSecondary },
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
        })}
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
        {/* Desktop: a readable column, left-aligned under the page title */}
        <View style={isDesktop && styles.desktopColumn}>
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
        cardStyle={[styles.modalCard, card]}
      >
        <View style={styles.listHead}>
          <Text style={[styles.title, { color: theme.text }]}>
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
                  <Text style={[styles.ref, { color: theme.text }]}>
                    {b.bookLabel} {b.chapter}:{b.verse}
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
                  accessibilityLabel={`Add ${b.bookLabel} ${b.chapter}:${b.verse}`}
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
        cardStyle={[styles.modalCard, card]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Remove {removeTarget ? verseRef(removeTarget) : ""}?
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          It stays in your bookmarks; only its practice progress is cleared.
        </Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnFlex, styles.btnOutline, { borderColor: theme.border }]}
            onPress={() => setRemoveTarget(null)}
          >
            <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnFlex, { backgroundColor: "#e53e3e" }]}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 48 },
  desktopColumn: { width: "100%", maxWidth: 760 },
  flex: { flex: 1 },
  stack: { gap: 12 },
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
