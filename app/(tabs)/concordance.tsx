import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
import {
    ConcordanceResult,
    searchConcordance,
    SUGGESTED_TERMS,
} from "@/src/services/concordance";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./concordance.styles";

const PAGE_SIZE = 10;

export default function Concordance() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? darkTheme : lightTheme;

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

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Biblical Concordance
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Search every verse · ASV
          </Text>
        </View>
      </View>

      {/* Search bar */}
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

      {/* Content */}
      {searching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </View>
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
            No verses found for "{query}".
          </Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={visibleResults}
          keyExtractor={(item) => String(item.pk)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.resultList}
          onEndReached={() => {
            if (hasMore)
              setVisibleCount((p) => Math.min(p + PAGE_SIZE, results.length));
          }}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {results.length} verse{results.length !== 1 ? "s" : ""} found
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[styles.resultRow, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.resultRef, { color: theme.textSecondary }]}>
                {item.bookLabel} {item.chapter}:{item.verse}
              </Text>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {item.text}
              </Text>
            </View>
          )}
        />
      ) : (
        /* Landing state — suggested search terms */
        <>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
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
        </>
      )}
    </SafeAreaView>
  );
}
