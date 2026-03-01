import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
import {
    FEATURED_HEBREW_WORDS,
    FeaturedWord,
    fetchHebrewEntry,
    HebrewEntry,
    searchHebrew,
    stripHtml,
} from "@/src/services/hebrew";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { styles } from "./hebrew-dictionary.styles";

type Screen = "list" | "detail";

const PAGE_SIZE = 10;

export default function HebrewDictionary() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const [screen, setScreen] = useState<Screen>("list");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HebrewEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<HebrewEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(text: string) {
    setQuery(text);
    setSearchError(false);
    setVisibleCount(PAGE_SIZE); // reset pagination on every new search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchHebrew(text);
        setResults(data);
      } catch {
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  async function openEntry(topic: string, partial?: FeaturedWord) {
    setDetailLoading(true);
    setScreen("detail");
    try {
      const entry = await fetchHebrewEntry(topic);
      if (entry) {
        setSelected(entry);
      } else if (partial) {
        // Fallback: show partial data without full definition
        setSelected({
          ...partial,
          definition: "",
          weight: 1,
        });
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function goBack() {
    if (screen === "detail") {
      setScreen("list");
      setSelected(null);
    } else {
      router.back();
    }
  }

  const headerTitle =
    screen === "detail" && selected
      ? selected.transliteration
      : "Hebrew Dictionary";
  const headerSubtitle =
    screen === "detail" && selected
      ? selected.topic
      : "Brown-Driver-Briggs · OT Hebrew";

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
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {headerTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {headerSubtitle}
          </Text>
        </View>
      </View>

      {screen === "list" && (
        <>
          {/* Search bar */}
          <View
            style={[
              styles.searchWrap,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={theme.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search in English or Hebrew…"
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

          {/* Content */}
          {searching ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.textSecondary} />
            </View>
          ) : searchError ? (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Could not reach the dictionary.{"\n"}Check your connection.
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleQueryChange(query)}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryText, { color: theme.primaryText }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : query.trim() && results.length === 0 ? (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No Hebrew results found.
              </Text>
            </View>
          ) : (
            (() => {
              const fullList = query.trim() ? results : FEATURED_HEBREW_WORDS;
              const visibleList = fullList.slice(0, visibleCount);
              const hasMore = visibleCount < fullList.length;
              return (
                <FlatList
                  data={visibleList}
                  keyExtractor={(item) => item.topic}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={() => {
                    if (hasMore) {
                      setVisibleCount((prev) =>
                        Math.min(prev + PAGE_SIZE, fullList.length),
                      );
                    }
                  }}
                  onEndReachedThreshold={0.2}
                  ListHeaderComponent={
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>
                      {query.trim() ? "Results" : "Key Hebrew Words"}
                    </Text>
                  }
                  ListFooterComponent={
                    hasMore ? (
                      <View
                        style={{ paddingVertical: 20, alignItems: "center" }}
                      >
                        <ActivityIndicator color={theme.textSecondary} />
                      </View>
                    ) : null
                  }
                  renderItem={({ item: entry }) => (
                    <TouchableOpacity
                      style={[
                        styles.entryRow,
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() =>
                        openEntry(entry.topic, entry as FeaturedWord)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.entryLeft}>
                        <Text
                          style={[styles.entryLexeme, { color: theme.text }]}
                        >
                          {entry.lexeme}
                        </Text>
                        <Text
                          style={[
                            styles.entryTranslit,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {entry.transliteration}
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text
                          style={[
                            styles.entryStrongs,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {entry.topic}
                        </Text>
                        <Text
                          style={[styles.entryShortDef, { color: theme.text }]}
                        >
                          {entry.short_definition}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                />
              );
            })()
          )}
        </>
      )}

      {screen === "detail" &&
        (detailLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Loading definition…
            </Text>
          </View>
        ) : selected ? (
          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailContent}
          >
            <Text style={[styles.detailLexeme, { color: theme.text }]}>
              {selected.lexeme}
            </Text>
            <Text style={[styles.detailTranslit, { color: theme.text }]}>
              {selected.transliteration}
            </Text>
            <Text
              style={[
                styles.detailPronunciation,
                { color: theme.textSecondary },
              ]}
            >
              {selected.pronunciation}
            </Text>
            <View
              style={[styles.detailStrongsChip, { borderColor: theme.border }]}
            >
              <Text
                style={[
                  styles.detailStrongsText,
                  { color: theme.textSecondary },
                ]}
              >
                {selected.topic}
              </Text>
            </View>
            <View
              style={[styles.detailDivider, { backgroundColor: theme.text }]}
            />
            <Text style={[styles.detailShortDef, { color: theme.text }]}>
              {selected.short_definition}
            </Text>
            {selected.definition ? (
              <Text style={[styles.detailDefinition, { color: theme.text }]}>
                {stripHtml(selected.definition)}
              </Text>
            ) : null}
          </ScrollView>
        ) : null)}
    </SafeAreaView>
  );
}
