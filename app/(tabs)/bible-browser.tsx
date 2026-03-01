import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    SectionList,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./bible-browser.styles";

type Screen = "books" | "chapters" | "verses";

export default function BibleBrowser() {
  const router = useRouter();
  const {
    collectionId,
    bookId,
    chapter: chapterParam,
  } = useLocalSearchParams<{
    collectionId?: string;
    bookId?: string;
    chapter?: string;
  }>();
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? darkTheme : lightTheme;

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

  // Deep-link: auto-open a saved chapter when bookId+chapter params are present
  useEffect(() => {
    if (bookId && chapterParam) {
      const found = BIBLE_BOOKS.find((b) => b.id === bookId);
      const ch = parseInt(chapterParam, 10);
      if (found && !isNaN(ch)) {
        openChapter(found, ch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goBack() {
    if (screen === "verses") {
      setScreen("chapters");
      setVerses([]);
    } else if (screen === "chapters") {
      setScreen("books");
      setBook(null);
    } else router.back();
  }

  async function openChapter(b: BibleBook, ch: number, ver?: BibleVersion) {
    setBook(b);
    setChapter(ch);
    setScreen("verses");
    setLoading(true);
    setError(false);
    setVerses([]);
    try {
      const data = await fetchChapter(b.id, ch, (ver ?? version).id);
      setVerses(data);
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
      edges={["top", "bottom"]}
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

      {/* Version Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.modalSheet, { backgroundColor: theme.surface }]}
              >
                <View
                  style={[styles.modalHandle, { backgroundColor: theme.text }]}
                />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
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
          <ScrollView contentContainerStyle={styles.versesList}>
            {verses.map((v) => (
              <View key={v.verse} style={styles.verseRow}>
                <Text style={[styles.verseNum, { color: theme.text }]}>
                  {v.verse}
                </Text>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {v.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        ))}
    </SafeAreaView>
  );
}
