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
    loadBookmarks,
    loadHighlights,
    removeHighlight,
    saveHighlight,
} from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    SectionList,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./bible-browser.styles";

type Screen = "books" | "chapters" | "verses";

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
  textStyle,
}: {
  text: string;
  query: string;
  bookmarkColor?: string;
  textStyle: object;
}) {
  const trimmed = query.trim();
  const bookmarkBg = bookmarkColor
    ? { backgroundColor: bookmarkColor + "99" }
    : {};

  if (!trimmed) {
    return (
      <Text style={textStyle}>
        {bookmarkColor ? <Text style={bookmarkBg}>{text}</Text> : text}
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
              { backgroundColor: "#FFD966CC", fontWeight: "700" },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={i} style={bookmarkBg}>
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
    highlight: highlightParam,
  } = useLocalSearchParams<{
    collectionId?: string;
    bookId?: string;
    chapter?: string;
    verse?: string;
    highlight?: string;
  }>();
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
  const [bookmarkConfirm, setBookmarkConfirm] = useState<string | null>(null);
  const [drawerVerse, setDrawerVerse] = useState<ChapterVerse | null>(null);
  const [shareVerse, setShareVerse] = useState<ChapterVerse | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const verseOffsets = useRef<Map<number, number>>(new Map());

  // Deep-link: auto-open a saved chapter when bookId+chapter params are present.
  // Depends on the params so it re-fires whenever the user navigates here from
  // Bookmarks (or any other screen) with a new set of params.
  useEffect(() => {
    if (bookId && chapterParam) {
      const found = BIBLE_BOOKS.find((b) => b.id === bookId);
      const ch = parseInt(chapterParam, 10);
      if (found && !isNaN(ch)) {
        const targetVerse =
          highlightParam === "true" && verseParam
            ? parseInt(verseParam, 10)
            : undefined;
        openChapter(found, ch, undefined, targetVerse);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterParam, verseParam, highlightParam]);

  function goBack() {
    if (screen === "verses") {
      setScreen("chapters");
      setVerses([]);
      setSearchVisible(false);
      setSearchQuery("");
    } else if (screen === "chapters") {
      setScreen("books");
      setBook(null);
    } else router.back();
  }

  /** Stable key identifying a verse independent of translation. */
  function verseKey(bookId: string, ch: number, verseNum: number) {
    return `${bookId}-${ch}-${verseNum}`;
  }

  async function openChapter(
    b: BibleBook,
    ch: number,
    ver?: BibleVersion,
    autoHighlightVerse?: number,
  ) {
    setBook(b);
    setChapter(ch);
    setScreen("verses");
    setLoading(true);
    setError(false);
    setVerses([]);
    setSearchVisible(false);
    setSearchQuery("");
    try {
      const [data, savedHighlights, savedBookmarks] = await Promise.all([
        fetchChapter(b.id, ch, (ver ?? version).id),
        loadHighlights(),
        loadBookmarks(uid),
      ]);
      setVerses(data);

      // Auto-highlight the target verse if it has no existing highlight
      let finalHighlights = savedHighlights;
      if (autoHighlightVerse) {
        const key = verseKey(b.id, ch, autoHighlightVerse);
        if (!savedHighlights.has(key)) {
          await saveHighlight(key, HIGHLIGHT_COLORS[0]);
          finalHighlights = new Map(savedHighlights);
          finalHighlights.set(key, HIGHLIGHT_COLORS[0]);
        }
      }

      setHighlights(finalHighlights);
      setBookmarked(new Set(savedBookmarks.map((bm) => bm.id)));
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

  /** Single tap → open the highlight / bookmark drawer */
  function handleVerseTap(v: ChapterVerse) {
    setDrawerVerse(v);
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
      createdAt: now,
    });
    setBookmarked((prev) => new Set([...prev, key]));
    setDrawerVerse(null);
    const label = `${book.label} ${chapter}:${drawerVerse.verse}`;
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setBookmarkConfirm(label);
    confirmTimerRef.current = setTimeout(() => setBookmarkConfirm(null), 2000);
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
      <View style={styles.header}>
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

      {/* Search Bar */}
      {screen === "verses" && searchVisible && (
        <View
          style={[
            styles.searchBar,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="search" size={15} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search in chapter…"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
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
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.drawerOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.drawerSheet,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.drawerHandle} />
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Share modal */}
      <Modal
        visible={shareVerse !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShareVerse(null)}
      >
        <TouchableWithoutFeedback onPress={() => setShareVerse(null)}>
          <View style={styles.drawerOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.drawerSheet,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.drawerHandle} />
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Highlight / Bookmark drawer */}
      <Modal
        visible={drawerVerse !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerVerse(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDrawerVerse(null)}>
          <View style={styles.drawerOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.drawerSheet,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.drawerHandle} />
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bookmark confirmation popup */}
      <Modal
        visible={bookmarkConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setBookmarkConfirm(null)}
      >
        <TouchableWithoutFeedback onPress={() => setBookmarkConfirm(null)}>
          <View style={styles.confirmOverlay}>
            <View
              style={[
                styles.confirmCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="bookmark" size={22} color={theme.primary} />
              <View style={styles.confirmTextWrap}>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>
                  Verse Bookmarked
                </Text>
                <Text
                  style={[styles.confirmRef, { color: theme.textSecondary }]}
                >
                  {bookmarkConfirm} saved to Bookmarks
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Books */}
      {screen === "books" && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
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
              style={[styles.bookItem, { borderColor: theme.border }]}
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

      {/* Chapters */}
      {screen === "chapters" && book && (
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
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Loading chapter…
            </Text>
          </View>
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
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.versesList}
          >
            {verses.map((v) => {
              const key = verseKey(book!.id, chapter!, v.verse);
              const highlightColor = highlights.get(key);
              const isBookmarked = bookmarked.has(key);
              return (
                <TouchableOpacity
                  key={v.verse}
                  style={styles.verseRow}
                  onPress={() => handleVerseTap(v)}
                  onLongPress={() => handleVerseLongPress(v)}
                  delayLongPress={400}
                  activeOpacity={0.75}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    verseOffsets.current.set(v.verse, y);
                    // If this is the deep-linked target verse, scroll to it now
                    // that we have its exact position (onLayout fires after paint)
                    if (verseParam && v.verse === parseInt(verseParam, 10)) {
                      scrollViewRef.current?.scrollTo({ y, animated: false });
                    }
                  }}
                >
                  <View style={styles.verseNumCol}>
                    <Text style={[styles.verseNum, { color: theme.text }]}>
                      {v.verse}
                    </Text>
                    {isBookmarked && (
                      <Ionicons
                        name="bookmark"
                        size={9}
                        color={theme.primary}
                        style={styles.verseBookmarkIcon}
                      />
                    )}
                  </View>
                  <HighlightedVerseText
                    text={v.text}
                    query={searchQuery}
                    bookmarkColor={highlightColor}
                    textStyle={[styles.verseText, { color: theme.text }]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ))}
    </SafeAreaView>
  );
}
