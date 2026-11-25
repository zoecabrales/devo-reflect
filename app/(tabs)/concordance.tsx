import { BentoGrid, ConcordanceSkeleton, PageHeader } from "@/src/components";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { useIsDesktop, useIsTablet, useListPaddingH } from "@/src/utils/responsive";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    ConcordanceResult,
    searchConcordance,
    SUGGESTED_TERMS,
} from "@/src/services/concordance";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/src/styles/concordance.styles";

const PAGE_SIZE = 10;

/** Tablets and desktop: results as verse cards in sections by book. */
const WIDE_MIN_WIDTH = 768;

type BookSection = {
  book: number;
  label: string;
  /** All matches in this book (not just the ones loaded so far). */
  total: number;
  items: ConcordanceResult[];
};

// Map numeric book IDs (1-66) to Bible browser book IDs
const BOOK_ID_MAP: Record<number, string> = {
  1: "genesis", 2: "exodus", 3: "leviticus", 4: "numbers", 5: "deuteronomy",
  6: "joshua", 7: "judges", 8: "ruth", 9: "1samuel", 10: "2samuel",
  11: "1kings", 12: "2kings", 13: "1chronicles", 14: "2chronicles",
  15: "ezra", 16: "nehemiah", 17: "esther", 18: "job", 19: "psalms",
  20: "proverbs", 21: "ecclesiastes", 22: "song-of-solomon", 23: "isaiah",
  24: "jeremiah", 25: "lamentations", 26: "ezekiel", 27: "daniel",
  28: "hosea", 29: "joel", 30: "amos", 31: "obadiah", 32: "jonah",
  33: "micah", 34: "nahum", 35: "habakkuk", 36: "zephaniah", 37: "haggai",
  38: "zechariah", 39: "malachi", 40: "matthew", 41: "mark", 42: "luke",
  43: "john", 44: "acts", 45: "romans", 46: "1corinthians",
  47: "2corinthians", 48: "galatians", 49: "ephesians", 50: "philippians",
  51: "colossians", 52: "1thessalonians", 53: "2thessalonians",
  54: "1timothy", 55: "2timothy", 56: "titus", 57: "philemon",
  58: "hebrews", 59: "james", 60: "1peter", 61: "2peter", 62: "1john",
  63: "2john", 64: "3john", 65: "jude", 66: "revelation",
};

export default function Concordance() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const padH = useListPaddingH();
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const { width } = useWindowDimensions();
  // Phones keep the plain list; tablets and desktop get sections of cards
  const wide = isDesktop || width >= WIDE_MIN_WIDTH;
  // Same frame as the other main tabs: desktop page width, else side padding
  const frame = isDesktop ? desktopPage.header : { paddingHorizontal: padH };
  // Side padding inside the results (the desktop frame already pads)
  const innerPadH = isDesktop ? 0 : padH;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConcordanceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(text: string) {
    setSearchError(false);
    setVisibleCount(PAGE_SIZE);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setSearching(false);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      try {
        const data = await searchConcordance(text);
        setResults(data);
      } catch {
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    runSearch(text);
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.navigate("/(tabs)/home");
  }

  function navigateToVerse(result: ConcordanceResult) {
    const bookId = BOOK_ID_MAP[result.book];
    if (bookId) {
      router.push({
        pathname: "/bible-browser",
        params: {
          bookId,
          chapter: result.chapter.toString(),
          verse: result.verse.toString(),
          underline: "true",
          context: "1",
        },
      });
    }
  }

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const scoreResult = (text: string, search: string) => {
    const normalizedText = text.toLowerCase();
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return 999;
    if (normalizedText === normalizedSearch) return 0;
    if (normalizedText.includes(` ${normalizedSearch} `) ||
        normalizedText.startsWith(`${normalizedSearch} `) ||
        normalizedText.endsWith(` ${normalizedSearch}`)) return 1;
    if (normalizedText.includes(normalizedSearch)) return 2;
    return 3;
  };

  const sortedResults = useMemo(() => {
    if (!query.trim()) return results;
    return [...results]
      .sort((a, b) => {
        const aScore = scoreResult(a.text, query);
        const bScore = scoreResult(b.text, query);
        if (aScore !== bScore) return aScore - bScore;
        if (a.book !== b.book) return a.book - b.book;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });
  }, [results, query]);

  const highlightQueryText = (text: string) => {
    const searchTerm = query.trim();
    if (!searchTerm) return text;

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
    const chunks = text.split(regex);

    return chunks.map((chunk, index) =>
      regex.test(chunk) ? (
        <Text key={index} style={styles.highlightText}>
          {chunk}
        </Text>
      ) : (
        <Text key={index}>{chunk}</Text>
      ),
    );
  };

  // Wide layouts: books in the order of their best match, each book's verses
  // together, so loading more only ever grows the last section
  const bookOrdered = useMemo(() => {
    if (!wide) return sortedResults;
    const byBook = new Map<number, ConcordanceResult[]>();
    for (const r of sortedResults) {
      const list = byBook.get(r.book);
      if (list) list.push(r);
      else byBook.set(r.book, [r]);
    }
    return [...byBook.values()].flat();
  }, [wide, sortedResults]);

  const visibleResults = bookOrdered.slice(0, visibleCount);
  const hasMore = visibleCount < bookOrdered.length;

  const sections = useMemo(() => {
    if (!wide) return [] as BookSection[];
    const totals = new Map<number, number>();
    for (const r of bookOrdered) totals.set(r.book, (totals.get(r.book) ?? 0) + 1);
    const out: BookSection[] = [];
    for (const r of visibleResults) {
      const last = out[out.length - 1];
      if (last && last.book === r.book) last.items.push(r);
      else
        out.push({
          book: r.book,
          label: r.bookLabel,
          total: totals.get(r.book) ?? 0,
          items: [r],
        });
    }
    return out;
  }, [wide, bookOrdered, visibleResults]);

  const loadMore = () => {
    if (hasMore)
      setVisibleCount((p) => Math.min(p + PAGE_SIZE, bookOrdered.length));
  };

  const bookCount = wide ? new Set(results.map((r) => r.book)).size : 0;
  const resultCount = (
    <Text
      style={[
        styles.resultCount,
        { marginHorizontal: innerPadH },
        { color: theme.textSecondary },
      ]}
    >
      {results.length} verse{results.length !== 1 ? "s" : ""} found
      {wide && bookCount > 0
        ? ` · ${bookCount} book${bookCount !== 1 ? "s" : ""}`
        : ""}
    </Text>
  );

  const loadingMore = hasMore ? (
    <View style={{ paddingVertical: 20, alignItems: "center" }}>
      <ActivityIndicator color={theme.textSecondary} />
    </View>
  ) : null;

  /** Tablet / desktop: one verse as a card. */
  const verseCard = (item: ConcordanceResult) => (
    <TouchableOpacity
      style={[
        styles.resultCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => navigateToVerse(item)}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={`Open ${item.bookLabel} ${item.chapter}:${item.verse}`}
    >
      <View style={styles.resultCardHead}>
        <Text style={[styles.resultCardRef, { color: theme.text }]}>
          {item.bookLabel} {item.chapter}:{item.verse}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} />
      </View>
      <Text style={[styles.resultCardText, { color: theme.text }]}>
        {highlightQueryText(item.text)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Biblical Concordance"
        subtitle="Search every verse · ASV"
        right={
          <TouchableOpacity
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close Concordance"
            style={isTablet && styles.closeTablet}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        }
      />

      {/* Search bar */}
      <View style={frame}>
      <View
        style={[
          styles.searchWrap,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search a word or phrase…"
          placeholderTextColor={theme.placeholder}
          value={query}
          onChangeText={handleQueryChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleQueryChange("")}>
            <Ionicons
              name="close-circle"
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      </View>

      {/* Content */}
      {searching ? (
        <ConcordanceSkeleton
          cards={wide}
          padH={innerPadH}
          contentStyle={isDesktop && desktopPage.content}
        />
      ) : searchError ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Could not reach the concordance.{"\n"}Check your connection.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => runSearch(query)}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryText, { color: theme.primaryText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No verses found for &ldquo;{query}&rdquo;.
          </Text>
        </View>
      ) : hasSearched && wide ? (
        // Tablet / desktop: a section per book, its verses as cards
        <FlatList
          data={sections}
          keyExtractor={(sec) => String(sec.book)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.resultList,
            styles.sectionList,
            isDesktop && desktopPage.content,
          ]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={resultCount}
          ListFooterComponent={loadingMore}
          renderItem={({ item: sec }) => (
            <View style={[styles.bookSection, { paddingHorizontal: innerPadH }]}>
              <View style={styles.bookSectionHead}>
                <Text style={[styles.sectionLabel, styles.bookSectionLabel, { color: theme.textSecondary }]}>
                  {`${sec.label} · ${sec.total} verse${sec.total !== 1 ? "s" : ""}`}
                </Text>
                <View style={[styles.bookSectionRule, { backgroundColor: theme.border }]} />
              </View>
              <BentoGrid
                gap={12}
                data={sec.items}
                keyExtractor={(r) => String(r.pk)}
                spanFor={() => 1}
                minColumnWidth={300}
                maxColumns={2}
                // A lone verse keeps its card size instead of stretching
                fillRows={false}
                renderItem={(r) => verseCard(r)}
              />
            </View>
          )}
        />
      ) : hasSearched ? (
        <FlatList
          data={visibleResults}
          keyExtractor={(item) => String(item.pk)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.resultList}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={resultCount}
          ListFooterComponent={loadingMore}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.resultRow,
                { paddingHorizontal: padH },
                { borderBottomColor: theme.border },
              ]}
              onPress={() => navigateToVerse(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.resultRef, { color: theme.textSecondary }]}>
                {item.bookLabel} {item.chapter}:{item.verse}
              </Text>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {highlightQueryText(item.text)}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        /* Landing state — suggested search terms */
        <>
          <View style={frame}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Suggested Topics
          </Text>
          <View style={styles.suggestedWrap}>
            {SUGGESTED_TERMS.map((term) => (
              <TouchableOpacity
                key={term}
                style={[
                  styles.suggestedChip,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                onPress={() => {
                  setQuery(term);
                  runSearch(term);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestedChipText, { color: theme.text }]}>
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
