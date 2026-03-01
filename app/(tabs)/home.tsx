import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
import {
    BIBLE_COLLECTIONS,
    BibleVerse,
    fetchDailyVerse,
    loadReadingPosition,
    ReadingPosition,
} from "@/src/services/bible";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { styles } from "./home.styles";

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
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
  const reference = `${verse.bookLabel} ${verse.chapter}:${verse.verse}`;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
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
      </View>
    </View>
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
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition | null>(null);

  const user = auth.currentUser;
  const displayName = user?.displayName?.split(" ")[0] ?? "Friend";

  async function loadVerse() {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchDailyVerse();
      setVerse(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerse();
  }, []);

  // Refresh reading position every time the Home tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReadingPosition().then(setReadingPosition);
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {getGreeting()}, {displayName}
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

        {/* Resume Reading — only shown after the user has opened a chapter */}
        {readingPosition && (
          <ResumeReadingCard position={readingPosition} theme={theme} />
        )}

        {/* Browse Bible */}
        <BrowseBibleCard theme={theme} />

        {/* Biblical Concordance */}
        <ConcordanceCard theme={theme} />
      </ScrollView>
    </View>
  );
}
