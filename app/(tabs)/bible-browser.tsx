import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
import {
  BIBLE_BOOKS,
  BIBLE_COLLECTIONS,
  BibleBook,
  ChapterVerse,
  fetchChapter,
} from "@/src/services/bible";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { styles } from "./bible-browser.styles";

type Screen = "books" | "chapters" | "verses";

export default function BibleBrowser() {
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
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

  function goBack() {
    if (screen === "verses") {
      setScreen("chapters");
      setVerses([]);
    } else if (screen === "chapters") {
      setScreen("books");
      setBook(null);
    } else router.back();
  }

  async function openChapter(b: BibleBook, ch: number) {
    setBook(b);
    setChapter(ch);
    setScreen("verses");
    setLoading(true);
    setError(false);
    setVerses([]);
    try {
      const data = await fetchChapter(b.id, ch);
      setVerses(data);
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
        : "ASV · 66 Books"
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
        <View>
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
      </View>

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
