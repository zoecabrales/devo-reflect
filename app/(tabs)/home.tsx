import { Theme } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    BIBLE_COLLECTIONS,
    BibleVerse,
    fetchDailyVerse,
    loadReadingPosition,
    ReadingPosition,
} from "@/src/services/bible";
import { loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "./home.styles";

// ── Helpers ────────────────────────────────────────────────────────────────

const PHT = "Asia/Manila";

function getGreeting(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: PHT,
    }).format(new Date()),
    10,
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PHT,
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingSkeleton({ theme }: { theme: Theme }) {
  return (
    <View
      style={[
        styles.loadingCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.skeletonShort, { backgroundColor: theme.text }]} />
      <View style={[styles.skeletonMedium, { backgroundColor: theme.text }]} />
      <View style={[styles.skeletonLong, { backgroundColor: theme.text }]} />
      <View style={[styles.skeletonLongAlt, { backgroundColor: theme.text }]} />
      <View
        style={[styles.skeletonLongAlt2, { backgroundColor: theme.text }]}
      />
      <ActivityIndicator
        size="small"
        color={theme.textSecondary}
        style={{ marginTop: 4 }}
      />
    </View>
  );
}

function ErrorCard({ theme, onRetry }: { theme: Theme; onRetry: () => void }) {
  return (
    <View
      style={[
        styles.errorCard,
        { backgroundColor: theme.surface, borderColor: theme.borderError },
      ]}
    >
      <Text style={[styles.errorText, { color: theme.text }]}>
        Could not load today's verse.{"\n"}Check your connection and try again.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.retryText, { color: theme.primaryText }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function VerseCard({ verse, theme }: { verse: BibleVerse; theme: Theme }) {
  const router = useRouter();
  const reference = `${verse.bookLabel} ${verse.chapter}:${verse.verse}`;
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() =>
        router.push(
          `/(tabs)/bible-browser?bookId=${verse.book}&chapter=${verse.chapter}&verse=${verse.verse}`,
        )
      }
      activeOpacity={0.8}
    >
      <Text style={[styles.cardLabel, { color: theme.text }]}>
        Verse of the Day
      </Text>
      <Text style={[styles.verseReference, { color: theme.text }]}>
        {reference}
      </Text>
      <Text style={[styles.verseText, { color: theme.text }]}>
        "{verse.text}"
      </Text>
      <View style={styles.cardFooter}>
        <View style={[styles.versionBadge, { borderColor: theme.border }]}>
          <Text
            style={[styles.versionBadgeText, { color: theme.textSecondary }]}
          >
            {verse.version}
          </Text>
        </View>
        <View style={styles.readInContextLink}>
          <Text style={[styles.readInContextText, { color: theme.primary }]}>
            Read in context
          </Text>
          <Ionicons name="chevron-forward" size={12} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CollectionCards({ theme }: { theme: Theme }) {
  const router = useRouter();
  return (
    <View>
      <Text style={[styles.collectionSectionLabel, { color: theme.text }]}>
        Browse by section
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.collectionScroll}
        contentContainerStyle={styles.collectionScrollContent}
      >
        {BIBLE_COLLECTIONS.map((col) => (
          <TouchableOpacity
            key={col.id}
            style={[
              styles.collectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() =>
              router.push(`/(tabs)/bible-browser?collectionId=${col.id}`)
            }
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.collectionIconWrap,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons
                name={col.icon as any}
                size={13}
                color={theme.primaryText}
              />
            </View>
            <Text style={[styles.collectionLabel, { color: theme.text }]}>
              {col.label}
            </Text>
            <Text
              style={[
                styles.collectionSubtitle,
                { color: theme.textSecondary },
              ]}
            >
              {col.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ConcordanceCard({ theme }: { theme: Theme }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.browseCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push("/(tabs)/concordance")}
      activeOpacity={0.8}
    >
      <View style={[styles.browseIconWrap, { backgroundColor: theme.primary }]}>
        <Ionicons name="search-outline" size={18} color={theme.primaryText} />
      </View>
      <View style={styles.browseTextWrap}>
        <Text style={[styles.browseTitle, { color: theme.text }]}>
          Biblical Concordance
        </Text>
        <Text style={[styles.browseSubtitle, { color: theme.textSecondary }]}>
          Search every verse · ASV
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

function ResumeReadingCard({
  position,
  theme,
}: {
  position: ReadingPosition;
  theme: Theme;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.resumeCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() =>
        router.push(
          `/(tabs)/bible-browser?bookId=${position.bookId}&chapter=${position.chapter}`,
        )
      }
      activeOpacity={0.8}
    >
      <View style={[styles.resumeIconWrap, { backgroundColor: theme.primary }]}>
        <Ionicons name="bookmark-outline" size={18} color={theme.primaryText} />
      </View>
      <View style={styles.resumeTextWrap}>
        <Text style={[styles.resumeLabel, { color: theme.textSecondary }]}>
          Resume Reading
        </Text>
        <Text style={[styles.resumeTitle, { color: theme.text }]}>
          {position.bookLabel} {position.chapter}
        </Text>
        <Text style={[styles.resumeSubtitle, { color: theme.textSecondary }]}>
          Continue where you left off
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

function BookmarkBadgeCard({ count, theme }: { count: number; theme: Theme }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.browseCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push("/(tabs)/bookmarks")}
      activeOpacity={0.8}
    >
      <View style={[styles.browseIconWrap, { backgroundColor: theme.primary }]}>
        <Ionicons name="bookmark" size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.browseLabel, { color: theme.textSecondary }]}>
          Saved Verses
        </Text>
        <Text style={[styles.browseTitle, { color: theme.text }]}>
          {count === 0
            ? "No bookmarks yet"
            : `${count} verse${count === 1 ? "" : "s"} bookmarked`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

function BrowseBibleCard({ theme }: { theme: Theme }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.browseCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push("/(tabs)/bible-browser")}
      activeOpacity={0.8}
    >
      <View style={[styles.browseIconWrap, { backgroundColor: theme.primary }]}>
        <Ionicons name="book-outline" size={18} color={theme.primaryText} />
      </View>
      <View style={styles.browseTextWrap}>
        <Text style={[styles.browseTitle, { color: theme.text }]}>
          Read the Word
        </Text>
        <Text style={[styles.browseSubtitle, { color: theme.textSecondary }]}>
          66 books · ASV
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { theme } = useAppTheme();

  const [greeting, setGreeting] = useState(getGreeting);
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const user = auth.currentUser;
  const displayName = user?.displayName?.split(" ")[0] ?? "Friend";

  // Re-evaluate greeting every minute so it stays accurate while app is open
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function loadVerse(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await fetchDailyVerse();
      setVerse(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Refresh both the verse and reading position every time Home comes into focus
  useFocusEffect(
    useCallback(() => {
      loadVerse();
      loadReadingPosition().then(setReadingPosition);
      loadBookmarks().then((bms) => setBookmarkCount(bms.length));
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadVerse(true)}
            tintColor={theme.primary}
          />
        }
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting}, {displayName}
          </Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {getFormattedDate()}
          </Text>
        </View>

        {/* Verse of the Day */}
        {loading ? (
          <LoadingSkeleton theme={theme} />
        ) : error ? (
          <ErrorCard theme={theme} onRetry={loadVerse} />
        ) : verse ? (
          <VerseCard verse={verse} theme={theme} />
        ) : null}

        {/* Collection Cards */}
        <CollectionCards theme={theme} />

        {/* Browse Bible */}
        <BrowseBibleCard theme={theme} />

        {/* Resume Reading — only shown after the user has opened a chapter */}
        {readingPosition && (
          <ResumeReadingCard position={readingPosition} theme={theme} />
        )}

        {/* Bookmark Badge */}
        <BookmarkBadgeCard count={bookmarkCount} theme={theme} />

        {/* Biblical Concordance */}
        <ConcordanceCard theme={theme} />
      </ScrollView>
    </View>
  );
}
