import { AppModal, ChapterSkeleton, SheetHandle } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    BIBLE_BOOKS,
    BIBLE_COLLECTIONS,
    BIBLE_VERSIONS,
    BibleBook,
    BibleVersion,
    ChapterVerse,
    fetchChapter,
    saveReadingPosition,
} from "@/src/services/bible";
import {
    addBookmark,
    bookmarkId,
    formatVerseNumbers,
    loadBookmarks,
    loadHighlights,
    loadUnderlines,
    removeHighlight,
    saveHighlight,
    setUnderlines,
} from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { recordChapterRead } from "@/src/services/readingPlans";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    BackHandler,
    Platform,
    ScrollView,
    SectionList,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookContents,
  ChapterContents,
} from "@/src/features/bible/BookContents";
import {
  BOOK_MAX_WIDTH,
  BOOK_SIDE_PADDING,
  BookSpread,
} from "@/src/features/bible/BookSpread";
import { styles } from "@/src/styles/bible-browser.styles";
import { dateKeyOf, formatDateKey } from "@/src/utils/dateKey";
import {
    SIDEBAR_WIDTH,
    useIsDesktop,
    useListPaddingH,
} from "@/src/utils/responsive";

type Screen = "books" | "chapters" | "verses";

/** Two taps on a verse within this many ms open the verse panel. */
const DOUBLE_TAP_MS = 260;

const HIGHLIGHT_COLORS = [
  "#FFD966", // yellow
  "#93C47D", // green
  "#76A9EA", // blue
  "#E06666", // red
  "#C27BA0", // purple
  "#F9CB9C", // orange
  "#A0C4FF", // sky blue
  "#B5EAD7", // mint
];

function HighlightedVerseText({
  text,
  query,
  bookmarkColor,
  underline,
  textStyle,
}: {
  text: string;
  query: string;
  bookmarkColor?: string;
  underline?: boolean;
  textStyle: object;
}) {
  const trimmed = query.trim();
  const bookmarkBg = bookmarkColor
    ? { backgroundColor: bookmarkColor + "99" }
    : {};
  const underlineStyle = underline
    ? { textDecorationLine: "underline" as const }
    : {};

  if (!trimmed) {
    return (
      <Text style={textStyle}>
        {bookmarkColor || underline ? (
          <Text style={[bookmarkBg, underlineStyle]}>{text}</Text>
        ) : (
          text
        )}
      </Text>
    );
  }

  // Split text into alternating [non-match, match, non-match, …] segments
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <Text style={textStyle}>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <Text
            key={i}
            style={[
              bookmarkBg,
              underlineStyle,
              { backgroundColor: "#FFD966CC", fontWeight: "700" },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={i} style={[bookmarkBg, underlineStyle]}>
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}

export default function BibleBrowser() {
  const router = useRouter();
  const {
    collectionId,
    bookId,
    chapter: chapterParam,
    verse: verseParam,
    verses: versesParam,
    highlight: highlightParam,
    underline: underlineParam,
    pickMode,
    pickTarget,
    forDate: forDateParam,
    forDateId,
    returnTo,
  } = useLocalSearchParams<{
    collectionId?: string;
    bookId?: string;
    chapter?: string;
    verse?: string;
    verses?: string; // "16,17,18" when opening a multi-verse bookmark
    highlight?: string;
    underline?: string;
    pickMode?: string; // "verse" when opened from CalendarWidget
    pickTarget?: string; // "day" | "series"
    forDate?: string; // "YYYY-MM-DD" when opened from a Growth calendar day
    forDateId?: string; // changes per calendar tap
    returnTo?: string; // screen to go back to, e.g. a reading plan
  }>();

  // Calendar day the next bookmark is for (set from Growth's calendar).
  // Re-armed whenever a new forDateId arrives; cleared after one bookmark or
  // when dismissed. State derived from params, updated during render.
  const [planFor, setPlanFor] = useState({
    id: forDateId,
    date: forDateId ? (forDateParam ?? null) : null,
  });
  if (planFor.id !== forDateId) {
    setPlanFor({
      id: forDateId,
      date: forDateId ? (forDateParam ?? null) : null,
    });
  }
  const pendingForDate = planFor.date;
  const clearPendingForDate = () => setPlanFor((p) => ({ ...p, date: null }));

  const isPickMode = pickMode === "verse";
  const { theme } = useAppTheme();
  const uid = auth.currentUser?.uid ?? "";

  const activeCollection = collectionId
    ? (BIBLE_COLLECTIONS.find((c) => c.id === collectionId) ?? null)
    : null;
  const visibleBooks = activeCollection
    ? BIBLE_BOOKS.filter((b) => activeCollection.bookIds.includes(b.id))
    : BIBLE_BOOKS;

  const [screen, setScreen] = useState<Screen>("books");
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [highlights, setHighlights] = useState<Map<string, string>>(new Map());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [journaled, setJournaled] = useState<Set<string>>(new Set());
  // Temporary underline (arriving from Concordance); cleared on navigation
  const [underlined, setUnderlined] = useState<Set<string>>(new Set());
  // Underlines the user saved from the drawer; kept until they remove them
  const [savedUnderlines, setSavedUnderlines] = useState<Set<string>>(
    new Set(),
  );
  const savedUnderlinesRef = useRef(savedUnderlines);
  const [bookmarkConfirm, setBookmarkConfirm] = useState<string | null>(null);
  const [drawerVerse, setDrawerVerse] = useState<ChapterVerse | null>(null);
  // Select mode: verse numbers picked to bookmark / highlight / journal as one.
  // null = not selecting.
  const [selection, setSelection] = useState<number[] | null>(null);
  const [shareVerse, setShareVerse] = useState<ChapterVerse | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A first tap waiting to see if a second one follows (double tap)
  const pendingTap = useRef<{
    verse: number;
    timer: ReturnType<typeof setTimeout>;
    run: () => void;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const verseOffsets = useRef<Map<number, number>>(new Map());
  // Desktop book view: verse to open the spread at ("end" = last spread)
  const [focusVerse, setFocusVerse] = useState<number | "end" | null>(null);
  const isDesktop = useIsDesktop();
  const padH = useListPaddingH();
  const { width: windowWidth } = useWindowDimensions();
  // Desktop chapter view: left/right inset of the book, so the header and
  // search bar line up with its edges
  const bookInset =
    Math.max(0, windowWidth - SIDEBAR_WIDTH - BOOK_MAX_WIDTH) / 2 +
    BOOK_SIDE_PADDING;
  // Desktop: book list, chapter picker and reader all use the book frame
  const bookAligned = isDesktop;

  // Deep-link: auto-open a saved chapter when bookId+chapter params are present.
  // Depends on the params so it re-fires whenever the user navigates here from
  // Bookmarks (or any other screen) with a new set of params.
  useEffect(() => {
    if (bookId && chapterParam) {
      const found = BIBLE_BOOKS.find((b) => b.id === bookId);
      const ch = parseInt(chapterParam, 10);
      if (found && !isNaN(ch)) {
        const v = verseParam ? parseInt(verseParam, 10) : NaN;
        // A multi-verse bookmark highlights every verse it covers
        const range = (versesParam ?? "")
          .split(",")
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n));
        const targets =
          (highlightParam === "true" || underlineParam === "true") && !isNaN(v)
            ? range.length > 0
              ? range
              : [v]
            : undefined;
        openChapter(
          found,
          ch,
          undefined,
          targets,
          underlineParam === "true",
          isNaN(v) ? null : v,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterParam, verseParam, versesParam, highlightParam, underlineParam]);

  // Clear underlines when user starts searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setUnderlined(new Set());
    }
  }, [searchQuery]);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    // Book view: open the spread holding the first match
    const q = text.trim().toLowerCase();
    if (!q) return;
    const hit = verses.find((v) => v.text.toLowerCase().includes(q));
    if (hit) setFocusVerse(hit.verse);
  }

  function goBack() {
    setUnderlined(new Set()); // Clear temporary underlines when navigating
    setSelection(null);
    if (returnTo) {
      // Opened from another screen (e.g. a reading plan): go straight back
      // there, not up through the chapter list or to the first tab
      router.navigate(returnTo as never);
    } else if (screen === "verses") {
      setScreen("chapters");
      setVerses([]);
      setSearchVisible(false);
      setSearchQuery("");
    } else if (screen === "chapters") {
      setScreen("books");
      setBook(null);
    } else router.back();
  }

  // Android back button follows the same rule when there's a screen to return to
  useFocusEffect(
    useCallback(() => {
      if (!returnTo) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.navigate(returnTo as never);
        return true;
      });
      return () => sub.remove();
    }, [returnTo, router]),
  );

  /** Stable key identifying a verse independent of translation. */
  function verseKey(bookId: string, ch: number, verseNum: number) {
    return `${bookId}-${ch}-${verseNum}`;
  }

  async function openChapter(
    b: BibleBook,
    ch: number,
    ver?: BibleVersion,
    /** Verses to highlight (or underline) on open, e.g. from a bookmark. */
    autoHighlightVerses?: number[],
    autoUnderlineVerse: boolean = false,
    /** Desktop book view: verse to open at, or "end" for the last spread. */
    focus: number | "end" | null = null,
  ) {
    setBook(b);
    setChapter(ch);
    setScreen("verses");
    setLoading(true);
    setError(false);
    setVerses([]);
    setFocusVerse(focus);
    setSearchVisible(false);
    setSearchQuery("");
    setSelection(null);
    try {
      const [data, savedHighlights, savedBookmarks, underlines] =
        await Promise.all([
          fetchChapter(b.id, ch, (ver ?? version).id),
          loadHighlights(),
          loadBookmarks(uid),
          loadUnderlines(),
        ]);
      savedUnderlinesRef.current = underlines;
      setSavedUnderlines(underlines);
      setVerses(data);

      // Auto-highlight the target verses that have no existing highlight
      let finalHighlights = savedHighlights;
      if (autoHighlightVerses && !autoUnderlineVerse) {
        for (const n of autoHighlightVerses) {
          const key = verseKey(b.id, ch, n);
          if (finalHighlights.has(key)) continue;
          await saveHighlight(key, HIGHLIGHT_COLORS[0]);
          finalHighlights = new Map(finalHighlights);
          finalHighlights.set(key, HIGHLIGHT_COLORS[0]);
        }
      }

      setHighlights(finalHighlights);
      // Mark every verse a bookmark covers (several for a multi-verse one)
      setBookmarked(
        new Set(
          savedBookmarks.flatMap((bm) =>
            (bm.verses && bm.verses.length > 0 ? bm.verses : [bm.verse]).map(
              (n) => verseKey(bm.bookId, bm.chapter, n),
            ),
          ),
        ),
      );

      // Set temporary underline for Concordance navigation
      if (autoUnderlineVerse && autoHighlightVerses?.length) {
        setUnderlined(
          new Set(autoHighlightVerses.map((n) => verseKey(b.id, ch, n))),
        );
      } else {
        setUnderlined(new Set());
      }
      // Tick the chapter off in any reading plan (runs in the background)
      recordChapterRead(uid, b.id, ch);
      // Persist reading position so Home can show "Resume Reading"
      await saveReadingPosition({
        bookId: b.id,
        bookLabel: b.label,
        chapter: ch,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  /** Runs a waiting single tap now (e.g. another verse was tapped). */
  function flushPendingTap() {
    const p = pendingTap.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingTap.current = null;
    p.run();
  }

  /** Forgets a waiting single tap without running it. */
  function cancelPendingTap() {
    if (pendingTap.current) clearTimeout(pendingTap.current.timer);
    pendingTap.current = null;
  }

  // Don't fire a waiting tap after leaving the chapter or the screen
  useEffect(() => () => cancelPendingTap(), [book, chapter]);

  /**
   * Tap on a verse:
   * - one tap underlines it (or removes the underline)
   * - two taps open the panel to colour, bookmark or journal it
   * - in select mode, a tap adds / removes it from the selection
   * - when picking or bookmarking a verse for a Growth calendar day, one tap
   *   opens the panel straight away (that flow is about choosing a verse)
   */
  function handleVerseTap(v: ChapterVerse) {
    if (selection) {
      const next = selection.includes(v.verse)
        ? selection.filter((n) => n !== v.verse)
        : [...selection, v.verse].sort((a, b) => a - b);
      setSelection(next.length > 0 ? next : null);
      return;
    }
    if (isPickMode || pendingForDate) {
      setDrawerVerse(v);
      return;
    }

    const p = pendingTap.current;
    if (p && p.verse === v.verse) {
      // Second tap on the same verse: open the panel instead of underlining
      cancelPendingTap();
      // A double-click on web also selects a word; clear that
      if (Platform.OS === "web") window.getSelection?.()?.removeAllRanges();
      setDrawerVerse(v);
      return;
    }
    // A different verse: finish the earlier tap first
    flushPendingTap();
    const run = () => toggleUnderline([v.verse]);
    pendingTap.current = {
      verse: v.verse,
      run,
      timer: setTimeout(() => {
        pendingTap.current = null;
        run();
      }, DOUBLE_TAP_MS),
    };
  }

  /** Drawer → "Select Verses": start select mode with the tapped verse. */
  function startSelection() {
    if (!drawerVerse) return;
    setSelection([drawerVerse.verse]);
    setDrawerVerse(null);
  }

  /** The selected verses, in order, with their text. */
  function selectedVerses(): ChapterVerse[] {
    if (!selection) return [];
    return verses.filter((v) => selection.includes(v.verse));
  }

  function showBookmarkConfirm(label: string) {
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setBookmarkConfirm(label);
    confirmTimerRef.current = setTimeout(() => setBookmarkConfirm(null), 2000);
  }

  /** Select mode: highlight every selected verse in one colour. Tapping the
   *  colour they all already have removes it from all of them. */
  async function handleSelectionHighlight(color: string) {
    if (!selection || !book) return;
    const keys = selection.map((n) => verseKey(book.id, chapter!, n));
    const allHaveIt = keys.every((k) => highlights.get(k) === color);
    for (const k of keys) {
      if (allHaveIt) await removeHighlight(k);
      else await saveHighlight(k, color);
    }
    setHighlights((prev) => {
      const next = new Map(prev);
      for (const k of keys) {
        if (allHaveIt) next.delete(k);
        else next.set(k, color);
      }
      return next;
    });
  }

  /** Select mode: save the selected verses as one bookmark. */
  async function handleSelectionBookmark() {
    const picked = selectedVerses();
    if (picked.length === 0 || !book) return;
    const nums = picked.map((v) => v.verse);
    await addBookmark(uid, {
      id: bookmarkId(book.id, chapter!, nums),
      bookId: book.id,
      bookLabel: book.label,
      chapter: chapter!,
      verse: nums[0],
      verses: nums.length > 1 ? nums : null,
      text: picked.map((v) => v.text).join(" "),
      version: version.label,
      forDate: pendingForDate,
      createdAt: Date.now(),
    });
    clearPendingForDate();
    setBookmarked(
      (prev) =>
        new Set([...prev, ...nums.map((n) => verseKey(book.id, chapter!, n))]),
    );
    setSelection(null);
    showBookmarkConfirm(
      `${book.label} ${chapter}:${formatVerseNumbers(nums)}`,
    );
  }

  /** Select mode: start a journal entry with the selected verses. */
  function handleSelectionJournal() {
    const picked = selectedVerses();
    if (picked.length === 0 || !book) return;
    const nums = picked.map((v) => v.verse);
    setJournaled(
      (prev) =>
        new Set([...prev, ...nums.map((n) => verseKey(book.id, chapter!, n))]),
    );
    setSelection(null);
    router.push({
      pathname: "/(tabs)/journal-compose",
      params: {
        ref: `${book.label} ${chapter}:${formatVerseNumbers(nums)}`,
        text: picked.map((v) => v.text).join(" "),
      },
    });
  }

  /** Select mode: return the selected verses to Growth (CalendarWidget). */
  function handleSelectionPick() {
    const picked = selectedVerses();
    if (picked.length === 0 || !book) return;
    const nums = picked.map((v) => v.verse);
    setSelection(null);
    router.navigate({
      pathname: "/(tabs)/growth",
      params: {
        pickedVerseText: picked.map((v) => v.text).join(" "),
        pickedVerseRef: `${book.label} ${chapter}:${formatVerseNumbers(nums)}`,
        pickTarget: pickTarget ?? "day",
        pickSessionId: Date.now().toString(),
      },
    });
  }

  /** Long press → open the share modal */
  function handleVerseLongPress(v: ChapterVerse) {
    setShareVerse(v);
  }

  async function handleShare() {
    if (!shareVerse || !book) return;
    const ref = `${book.label} ${chapter}:${shareVerse.verse} (${version.label})`;
    await Share.share({ message: `"${shareVerse.text}"\n\n— ${ref}` });
    setShareVerse(null);
  }

  async function handleHighlight(color: string) {
    if (!drawerVerse || !book) return;
    const key = verseKey(book.id, chapter!, drawerVerse.verse);
    if (highlights.get(key) === color) {
      // Tapping the active color again removes the highlight
      await removeHighlight(key);
      setHighlights((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } else {
      await saveHighlight(key, color);
      setHighlights((prev) => new Map([...prev, [key, color]]));
    }
  }

  /** Saves or clears the underline on the given verses. They are all
   *  underlined unless every one already is, in which case all are cleared. */
  async function toggleUnderline(nums: number[]) {
    if (!book || nums.length === 0) return;
    const keys = nums.map((n) => verseKey(book.id, chapter!, n));
    // Read the latest set (a delayed tap may run from an older render) and
    // show the change straight away, then save it
    const current = savedUnderlinesRef.current;
    const on = !keys.every((k) => current.has(k));
    const next = new Set(current);
    for (const k of keys) {
      if (on) next.add(k);
      else next.delete(k);
    }
    savedUnderlinesRef.current = next;
    setSavedUnderlines(next);
    await setUnderlines(keys, on);
  }

  async function handleDrawerBookmark() {
    if (!drawerVerse || !book) return;
    const now = Date.now();
    const key = verseKey(book.id, chapter!, drawerVerse.verse);
    await addBookmark(uid, {
      id: key,
      bookId: book.id,
      bookLabel: book.label,
      chapter: chapter!,
      verse: drawerVerse.verse,
      text: drawerVerse.text,
      version: version.label,
      forDate: pendingForDate,
      createdAt: now,
    });
    clearPendingForDate();
    setBookmarked((prev) => new Set([...prev, key]));
    setDrawerVerse(null);
    showBookmarkConfirm(`${book.label} ${chapter}:${drawerVerse.verse}`);
  }

  function handleDrawerJournal() {
    if (!drawerVerse || !book) return;
    const key = verseKey(book.id, chapter!, drawerVerse.verse);
    setJournaled((prev) => new Set([...prev, key]));
    const ref = `${book.label} ${chapter}:${drawerVerse.verse}`;
    setDrawerVerse(null);
    router.push({
      pathname: "/(tabs)/journal-compose",
      params: {
        ref,
        text: drawerVerse.text,
      },
    });
  }

  /** Returns the selected verse back to the Growth tab (CalendarWidget pick mode) */
  function handlePickVerse() {
    if (!drawerVerse || !book) return;
    const ref = `${book.label} ${chapter}:${drawerVerse.verse}`;
    setDrawerVerse(null);
    router.navigate({
      pathname: "/(tabs)/growth",
      params: {
        pickedVerseText: drawerVerse.text,
        pickedVerseRef: ref,
        pickTarget: pickTarget ?? "day",
        pickSessionId: Date.now().toString(),
      },
    });
  }

  /** Previous / next chapter across book boundaries (null at either end). */
  function neighbourChapter(dir: -1 | 1): { b: BibleBook; ch: number } | null {
    if (!book || !chapter) return null;
    const ch = chapter + dir;
    if (ch >= 1 && ch <= book.chapters) return { b: book, ch };
    const i = BIBLE_BOOKS.findIndex((x) => x.id === book.id) + dir;
    const nb = BIBLE_BOOKS[i];
    if (!nb) return null;
    return { b: nb, ch: dir === 1 ? 1 : nb.chapters };
  }
  const prevChapter = neighbourChapter(-1);
  const nextChapter = neighbourChapter(1);

  /** One verse row; `bookMode` = desktop two-page book (serif, no scroll sync). */
  function renderVerse(v: ChapterVerse, bookMode = false) {
    const key = verseKey(book!.id, chapter!, v.verse);
    const highlightColor = highlights.get(key);
    const isBookmarked = bookmarked.has(key);
    const isJournaled = journaled.has(key);
    const isUnderlined = underlined.has(key) || savedUnderlines.has(key);
    const isSelected = selection?.includes(v.verse) ?? false;
    return (
      <TouchableOpacity
        key={v.verse}
        style={[
          styles.verseRow,
          selection && styles.verseRowSelectable,
          isSelected && {
            backgroundColor: theme.primary + "14",
            borderColor: theme.primary + "55",
          },
        ]}
        onPress={() => handleVerseTap(v)}
        // Screen readers: activating underlines; the "Verse options" action
        // opens the panel (a double tap is the screen reader's activate)
        accessibilityRole="button"
        accessibilityLabel={`Verse ${v.verse}`}
        accessibilityHint="Underlines the verse. Tap twice for options."
        accessibilityActions={[
          { name: "activate" },
          { name: "options", label: "Verse options" },
          { name: "longpress", label: "Share" },
        ]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "options") {
            cancelPendingTap();
            setDrawerVerse(v);
          } else if (e.nativeEvent.actionName === "longpress") {
            handleVerseLongPress(v);
          } else {
            handleVerseTap(v);
          }
        }}
        onLongPress={selection ? undefined : () => handleVerseLongPress(v)}
        delayLongPress={400}
        activeOpacity={0.75}
        onLayout={
          bookMode
            ? undefined
            : (e) => {
                const y = e.nativeEvent.layout.y;
                verseOffsets.current.set(v.verse, y);
                // If this is the deep-linked target verse, scroll to it now
                // that we have its exact position (onLayout fires after paint)
                if (verseParam && v.verse === parseInt(verseParam, 10)) {
                  scrollViewRef.current?.scrollTo({ y, animated: false });
                }
              }
        }
      >
        <View style={[styles.verseNumCol, bookMode && styles.verseNumColBook]}>
          <Text
            style={[
              styles.verseNum,
              bookMode && styles.verseNumBook,
              { color: theme.text },
            ]}
          >
            {v.verse}
          </Text>
          {selection && (
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={14}
              color={isSelected ? theme.primary : theme.textSecondary}
            />
          )}
          {isBookmarked && (
            <Ionicons
              name="bookmark"
              size={9}
              color={theme.primary}
              style={styles.verseBookmarkIcon}
            />
          )}
          {isJournaled && (
            <Ionicons
              name="book"
              size={9}
              color={theme.textSecondary}
              style={styles.verseBookmarkIcon}
            />
          )}
        </View>
        <HighlightedVerseText
          text={v.text}
          query={searchQuery}
          bookmarkColor={highlightColor}
          underline={isUnderlined}
          textStyle={[
            styles.verseText,
            bookMode && styles.verseTextBook,
            { color: theme.text },
          ]}
        />
      </TouchableOpacity>
    );
  }

  const headerTitle =
    screen === "books"
      ? (activeCollection?.label ?? "Bible")
      : screen === "chapters"
        ? book!.label
        : `${book!.label} ${chapter}`;

  const headerSubtitle =
    screen === "books"
      ? activeCollection
        ? activeCollection.subtitle
        : `${version.label} · 66 Books`
      : null;

  const sections = [
    {
      title: "Old Testament",
      data: visibleBooks.filter((b) => b.testament === "OT"),
    },
    {
      title: "New Testament",
      data: visibleBooks.filter((b) => b.testament === "NT"),
    },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: padH },
          bookAligned && { paddingHorizontal: bookInset },
        ]}
      >
        <TouchableOpacity
          onPress={goBack}
          style={[styles.backBtn, { borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {headerTitle}
          </Text>
          {headerSubtitle && (
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              {headerSubtitle}
            </Text>
          )}
        </View>
        {screen === "verses" && (
          <TouchableOpacity
            style={[styles.searchIconBtn, { borderColor: theme.border }]}
            onPress={() => setSearchVisible((v) => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={18}
              color={theme.text}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.versionPill,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.versionPillText, { color: theme.text }]}>
            {version.label}
          </Text>
          <Ionicons name="chevron-down" size={11} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Bookmarking / planning for a calendar day (from Growth) */}
      {pendingForDate && (
        <View
          style={[
            styles.planBanner,
            { marginHorizontal: padH },
            { borderColor: theme.border, backgroundColor: theme.surface },
            bookAligned && { marginHorizontal: bookInset },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={theme.textSecondary}
          />
          <Text style={[styles.planBannerText, { color: theme.text }]}>
            {pendingForDate > dateKeyOf(Date.now()) ? "Planning" : "Bookmarking"}{" "}
            a verse for {formatDateKey(pendingForDate)}
            <Text style={{ color: theme.textSecondary }}>
              {" "}
              · tap a verse, then Bookmark
            </Text>
          </Text>
          <TouchableOpacity
            onPress={clearPendingForDate}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      {screen === "verses" && searchVisible && (
        <View
          style={[
            styles.searchBar,
            { marginHorizontal: padH },
            { borderColor: theme.border, backgroundColor: theme.surface },
            bookAligned && { marginHorizontal: bookInset },
          ]}
        >
          <Ionicons name="search" size={15} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search in chapter…"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Version Picker Modal */}
      <AppModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        animationType="slide"
        overlayStyle={styles.drawerOverlay}
        cardStyle={[
          styles.drawerSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SheetHandle style={styles.drawerHandle} />
        <Text style={[styles.drawerTitle, { color: theme.text }]}>
          Bible Version
        </Text>
        {BIBLE_VERSIONS.map((v) => {
          const active = v.id === version.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={styles.versionOption}
              activeOpacity={0.7}
              onPress={() => {
                setPickerVisible(false);
                setVersion(v);
                // Re-fetch current chapter in the new version
                if (screen === "verses" && book && chapter) {
                  openChapter(book, chapter, v);
                }
              }}
            >
              <Text
                style={[
                  styles.versionOptionLabel,
                  {
                    color: active ? theme.primary : theme.text,
                  },
                ]}
              >
                {v.label}
              </Text>
              <Text
                style={[
                  styles.versionOptionDesc,
                  { color: theme.textSecondary },
                ]}
              >
                {v.description}
              </Text>
              {active && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </AppModal>

      {/* Share modal */}
      <AppModal
        visible={shareVerse !== null}
        onClose={() => setShareVerse(null)}
        animationType="slide"
        overlayStyle={styles.drawerOverlay}
        cardStyle={[
          styles.drawerSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SheetHandle style={styles.drawerHandle} />
        <Text style={[styles.drawerTitle, { color: theme.text }]}>
          {shareVerse
            ? `${book?.label ?? ""} ${chapter}:${shareVerse.verse}`
            : ""}
        </Text>

        {/* Verse preview */}
        {shareVerse && (
          <Text
            style={[
              styles.shareVersePreview,
              { color: theme.textSecondary },
            ]}
            numberOfLines={4}
          >
            "{shareVerse.text}"
          </Text>
        )}

        {/* Share button */}
        <TouchableOpacity
          style={[
            styles.drawerBookmarkBtn,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.drawerBookmarkBtnText}>Share Verse</Text>
        </TouchableOpacity>
      </AppModal>

      {/* Highlight / Bookmark drawer */}
      <AppModal
        visible={drawerVerse !== null}
        onClose={() => setDrawerVerse(null)}
        animationType="slide"
        overlayStyle={styles.drawerOverlay}
        cardStyle={[
          styles.drawerSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SheetHandle style={styles.drawerHandle} />
        <Text style={[styles.drawerTitle, { color: theme.text }]}>
          {drawerVerse
            ? `${book?.label ?? ""} ${chapter}:${drawerVerse.verse}`
            : ""}
        </Text>

        {/* Color swatches */}
        <Text
          style={[styles.drawerLabel, { color: theme.textSecondary }]}
        >
          Highlight
        </Text>
        <View style={styles.swatchRow}>
          {HIGHLIGHT_COLORS.map((c) => {
            const activeKey = drawerVerse
              ? verseKey(book!.id, chapter!, drawerVerse.verse)
              : null;
            const isActive = activeKey
              ? highlights.get(activeKey) === c
              : false;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  isActive && styles.swatchActive,
                ]}
                onPress={() => handleHighlight(c)}
                activeOpacity={0.8}
              />
            );
          })}
        </View>

        {/* Underline: a plain mark, separate from the colour */}
        {drawerVerse && book && (() => {
          const on = savedUnderlines.has(
            verseKey(book.id, chapter!, drawerVerse.verse),
          );
          return (
            <TouchableOpacity
              style={[
                styles.underlineChip,
                styles.underlineChipDrawer,
                { borderColor: on ? theme.primary : theme.border },
                on && { backgroundColor: theme.primary + "14" },
              ]}
              onPress={() => toggleUnderline([drawerVerse.verse])}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              accessibilityLabel="Underline"
              activeOpacity={0.8}
            >
              <Text style={[styles.underlineChipText, { color: theme.text }]}>
                Underline
              </Text>
              {on && (
                <Ionicons name="checkmark" size={15} color={theme.primary} />
              )}
            </TouchableOpacity>
          );
        })()}

        {/* Bookmark button */}
        <TouchableOpacity
          style={[
            styles.drawerBookmarkBtn,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleDrawerBookmark}
          activeOpacity={0.85}
        >
          <Ionicons name="bookmark-outline" size={18} color="#fff" />
          <Text style={styles.drawerBookmarkBtnText}>
            Add to Bookmarks
          </Text>
        </TouchableOpacity>

        {/* Select mode: pick more verses to bookmark / highlight as one */}
        <TouchableOpacity
          style={[
            styles.drawerBookmarkBtn,
            {
              marginTop: 10,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
          onPress={startSelection}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done-outline" size={18} color={theme.text} />
          <Text
            style={[
              styles.drawerBookmarkBtnText,
              { color: theme.text },
            ]}
          >
            Select More Verses
          </Text>
        </TouchableOpacity>

        {/* Add to Journal button */}
        <TouchableOpacity
          style={[
            styles.drawerBookmarkBtn,
            {
              marginTop: 10,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
          onPress={handleDrawerJournal}
          activeOpacity={0.85}
        >
          <Ionicons name="book-outline" size={18} color={theme.text} />
          <Text
            style={[
              styles.drawerBookmarkBtnText,
              { color: theme.text },
            ]}
          >
            Add to Journal
          </Text>
        </TouchableOpacity>

        {/* Use this Verse — only shown when opened from CalendarWidget */}
        {isPickMode && (
          <TouchableOpacity
            style={[
              styles.drawerBookmarkBtn,
              { marginTop: 10, backgroundColor: theme.primary },
            ]}
            onPress={handlePickVerse}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={theme.primaryText}
            />
            <Text
              style={[
                styles.drawerBookmarkBtnText,
                { color: theme.primaryText },
              ]}
            >
              Use this Verse
            </Text>
          </TouchableOpacity>
        )}
      </AppModal>

      {/* Bookmark confirmation popup */}
      <AppModal
        visible={bookmarkConfirm !== null}
        onClose={() => setBookmarkConfirm(null)}
        closeOnCardPress
        overlayStyle={styles.confirmOverlay}
        cardStyle={[
          styles.confirmCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name="bookmark" size={22} color={theme.primary} />
        <View style={styles.confirmTextWrap}>
          <Text style={[styles.confirmTitle, { color: theme.text }]}>
            {bookmarkConfirm?.includes(",") || bookmarkConfirm?.includes("\u2013")
              ? "Verses Bookmarked"
              : "Verse Bookmarked"}
          </Text>
          <Text style={[styles.confirmRef, { color: theme.textSecondary }]}>
            {bookmarkConfirm} saved to Bookmarks
          </Text>
        </View>
      </AppModal>

      {/* Books — desktop: two-column table of contents */}
      {screen === "books" && isDesktop && (
        <BookContents
          sections={sections}
          theme={theme}
          onSelect={(b) => {
            setBook(b);
            setScreen("chapters");
          }}
        />
      )}
      {screen === "books" && !isDesktop && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                { paddingHorizontal: padH },
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.sectionHeaderText, { color: theme.text }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.bookItem,
                { paddingHorizontal: padH },
                { borderColor: theme.border },
              ]}
              onPress={() => {
                setBook(item);
                setScreen("chapters");
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.bookLabel, { color: theme.text }]}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Chapters — desktop: compact picker on the book frame */}
      {screen === "chapters" && book && isDesktop && (
        <ChapterContents
          book={book}
          theme={theme}
          onSelect={(ch) => openChapter(book, ch)}
        />
      )}
      {screen === "chapters" && book && !isDesktop && (
        <ScrollView contentContainerStyle={styles.chapterGrid}>
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
            <TouchableOpacity
              key={ch}
              style={[
                styles.chapterBtn,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              onPress={() => openChapter(book, ch)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chapterBtnText, { color: theme.text }]}>
                {ch}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Verses */}
      {screen === "verses" &&
        (loading ? (
          <ChapterSkeleton />
        ) : error ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Could not load this chapter.{"\n"}Check your connection.
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => openChapter(book!, chapter!)}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryText, { color: theme.primaryText }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : isDesktop ? (
          <BookSpread
            items={verses}
            keyOf={(v) => v.verse}
            renderItem={(v) => renderVerse(v, true)}
            theme={theme}
            focus={
              focusVerse === "end"
                ? "end"
                : focusVerse === null
                  ? null
                  : Math.max(
                      0,
                      verses.findIndex((v) => v.verse === focusVerse),
                    )
            }
            onPrevChapter={
              prevChapter
                ? () =>
                    // Turning back opens the previous chapter at its end
                    openChapter(
                      prevChapter.b,
                      prevChapter.ch,
                      undefined,
                      undefined,
                      false,
                      "end",
                    )
                : undefined
            }
            onNextChapter={
              nextChapter
                ? () => openChapter(nextChapter.b, nextChapter.ch)
                : undefined
            }
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[styles.versesList, { paddingHorizontal: padH }]}
          >
            {verses.map((v) => renderVerse(v))}
          </ScrollView>
        ))}

      {/* Select mode: actions for the selected verses */}
      {screen === "verses" && selection && book && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
            isDesktop && {
              marginHorizontal: bookInset,
              borderLeftWidth: 1,
              borderRightWidth: 1,
            },
          ]}
        >
          <View style={styles.selectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectionTitle, { color: theme.text }]}>
                {book.label} {chapter}:{formatVerseNumbers(selection)}
              </Text>
              <Text
                style={[styles.selectionHint, { color: theme.textSecondary }]}
              >
                {selection.length} {selection.length === 1 ? "verse" : "verses"}{" "}
                selected · tap verses to add or remove
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelection(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.swatchRow, styles.selectionSwatches]}>
            {HIGHLIGHT_COLORS.map((c) => {
              const isActive = selection.every(
                (n) => highlights.get(verseKey(book.id, chapter!, n)) === c,
              );
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.swatch,
                    styles.selectionSwatch,
                    { backgroundColor: c },
                    isActive && styles.swatchActive,
                  ]}
                  onPress={() => handleSelectionHighlight(c)}
                  accessibilityLabel="Highlight selected verses"
                  activeOpacity={0.8}
                />
              );
            })}
            {(() => {
              const on = selection.every((n) =>
                savedUnderlines.has(verseKey(book.id, chapter!, n)),
              );
              return (
                <TouchableOpacity
                  style={[
                    styles.underlineChip,
                    { borderColor: on ? theme.primary : theme.border },
                    on && { backgroundColor: theme.primary + "14" },
                  ]}
                  onPress={() => toggleUnderline(selection)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel="Underline selected verses"
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.underlineChipText, { color: theme.text }]}
                  >
                    Underline
                  </Text>
                  {on && (
                    <Ionicons name="checkmark" size={14} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>

          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={[
                styles.drawerBookmarkBtn,
                styles.selectionBtn,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSelectionBookmark}
              activeOpacity={0.85}
            >
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={theme.primaryText}
              />
              <Text
                style={[
                  styles.drawerBookmarkBtnText,
                  { color: theme.primaryText },
                ]}
              >
                {selection.length > 1 ? "Bookmark as One" : "Bookmark"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.drawerBookmarkBtn,
                styles.selectionBtn,
                {
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleSelectionJournal}
              activeOpacity={0.85}
            >
              <Ionicons name="book-outline" size={17} color={theme.text} />
              <Text
                style={[styles.drawerBookmarkBtnText, { color: theme.text }]}
              >
                Journal
              </Text>
            </TouchableOpacity>
          </View>

          {isPickMode && (
            <TouchableOpacity
              style={[
                styles.drawerBookmarkBtn,
                { marginTop: 10, backgroundColor: theme.primary },
              ]}
              onPress={handleSelectionPick}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={theme.primaryText}
              />
              <Text
                style={[
                  styles.drawerBookmarkBtnText,
                  { color: theme.primaryText },
                ]}
              >
                {selection.length > 1 ? "Use these Verses" : "Use this Verse"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
