import { AppModal, SheetHandle, VerseCardSkeleton } from "@/src/components";
import { Theme } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    BIBLE_COLLECTIONS,
    BibleCollection,
    BibleVerse,
    fetchDailyVerse,
    loadReadingPosition,
    ReadingPosition,
} from "@/src/services/bible";
import { DesktopHome } from "@/src/features/home/DesktopHome";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { SharedVersesCard } from "@/src/features/connections/SharedVersesCard";
import {
    SectionGuideButton,
    SectionGuideModal,
} from "@/src/features/home/SectionGuide";
import { loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { loadEntries } from "@/src/services/journal";
import {
  pageScrollMarker,
  useIsDesktop,
  usePageScroll,
  useScrollPaddingH,
} from "@/src/utils/responsive";
import { contextHref } from "@/src/utils/readerLink";
import {
    ShareImageSheet,
    ShareImageTarget,
} from "@/src/features/shareImage/ShareImageSheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    AppState,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "@/src/styles/home.styles";

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

/** Midnight at the start of this week (Monday), local time. */
function startOfWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

// ── Sub-components ─────────────────────────────────────────────────────────

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
  const [share, setShare] = useState<ShareImageTarget | null>(null);
  return (
    <>
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: theme.primary,
        },
      ]}
      onPress={() =>
        router.push(
          contextHref({
            bookId: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
          }),
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
        <View style={styles.verseCardActions}>
          {/* Share to social media (its own button; the card opens the reader) */}
          <TouchableOpacity
            onPress={() =>
              setShare({ text: verse.text, reference, version: verse.version })
            }
            hitSlop={8}
            style={[styles.verseShareBtn, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Share the verse of the day"
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={14} color={theme.text} />
            <Text style={[styles.verseShareText, { color: theme.text }]}>
              Share
            </Text>
          </TouchableOpacity>
          <View style={styles.readInContextLink}>
            <Text style={[styles.readInContextText, { color: theme.primary }]}>
              Read in context
            </Text>
            <Ionicons name="chevron-forward" size={12} color={theme.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
    <ShareImageSheet
      target={share}
      theme={theme}
      onClose={() => setShare(null)}
    />
    </>
  );
}

function CollectionCards({ theme }: { theme: Theme }) {
  const router = useRouter();
  const [selected, setSelected] = useState<BibleCollection | null>(null);
  // Section whose "?" guide is open
  const [guide, setGuide] = useState<BibleCollection | null>(null);
  const padH = useScrollPaddingH();

  return (
    <View>
      <Text style={[styles.collectionSectionLabel, { color: theme.text }]}>
        Browse by section
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Bleed to the screen edges, keeping the first card aligned
        style={[styles.collectionScroll, { marginHorizontal: -padH }]}
        contentContainerStyle={[
          styles.collectionScrollContent,
          { paddingHorizontal: padH },
        ]}
      >
        {BIBLE_COLLECTIONS.map((col) => (
          <TouchableOpacity
            key={col.id}
            style={[
              styles.collectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setSelected(col)}
            activeOpacity={0.75}
          >
            <SectionGuideButton
              theme={theme}
              label={col.label}
              onPress={() => setGuide(col)}
              style={styles.collectionHelpBtn}
            />
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
            <Text
              style={[
                styles.collectionDescription,
                { color: theme.textSecondary },
              ]}
              numberOfLines={4}
            >
              {col.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionGuideModal
        collection={guide}
        theme={theme}
        onClose={() => setGuide(null)}
      />

      {/* Collection Info Modal */}
      <AppModal
        visible={selected !== null}
        onClose={() => setSelected(null)}
        animationType="slide"
        overlayStyle={styles.collectionModalOverlay}
        cardStyle={[
          styles.collectionModalSheet,
          { backgroundColor: theme.surface, borderColor: theme.border, },
        ]}
      >
        <SheetHandle style={styles.collectionModalHandle} />

        {/* Icon */}
        <View
          style={[
            styles.collectionModalIconWrap,
            { backgroundColor: theme.primary },
          ]}
        >
          <Ionicons
            name={(selected?.icon ?? "book-outline") as any}
            size={22}
            color={theme.primaryText}
          />
        </View>

        {/* Label + subtitle */}
        <Text
          style={[styles.collectionModalLabel, { color: theme.text }]}
        >
          {selected?.label}
        </Text>
        <Text
          style={[
            styles.collectionModalSubtitle,
            { color: theme.textSecondary },
          ]}
        >
          {selected?.subtitle}
        </Text>

        {/* Divider */}
        <View
          style={[
            styles.collectionModalDivider,
            { backgroundColor: theme.text },
          ]}
        />

        {/* Full description */}
        <Text
          style={[
            styles.collectionModalDescription,
            { color: theme.text },
          ]}
        >
          {selected?.description}
        </Text>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.collectionModalCTA,
            { backgroundColor: theme.primary },
          ]}
          onPress={() => {
            const id = selected?.id;
            setSelected(null);
            router.push(`/(tabs)/bible-browser?collectionId=${id}`);
          }}
        >
          <Text
            style={[
              styles.collectionModalCTAText,
              { color: theme.primaryText },
            ]}
          >
            Browse Books
          </Text>
        </TouchableOpacity>
      </AppModal>
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
        <Ionicons name="bookmark" size={18} color={theme.primaryText} />
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

/** Quick-access link styled like "Read the Word". */
function QuickLinkCard({
  theme,
  icon,
  title,
  subtitle,
  href,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  href: "/(tabs)/reading-plans" | "/(tabs)/memory-verses";
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[
        styles.browseCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push(href)}
      activeOpacity={0.8}
    >
      <View style={[styles.browseIconWrap, { backgroundColor: theme.primary }]}>
        <Ionicons name={icon} size={18} color={theme.primaryText} />
      </View>
      <View style={styles.browseTextWrap}>
        <Text style={[styles.browseTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.browseSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

// The "Begin Journey" verse greeting shows at most once every 4 hours, when
// Home opens or the app returns to the foreground on Home.
const VERSE_GREETING_KEY = "@verse_greeting_shown_at";
const VERSE_GREETING_INTERVAL_MS = 4 * 60 * 60 * 1000;

/** True (and records now) if the greeting is due; false otherwise. */
async function claimVerseGreeting(): Promise<boolean> {
  const now = Date.now();
  const last = Number(await AsyncStorage.getItem(VERSE_GREETING_KEY));
  // A missing / unreadable value, or one in the future (clock changed), is due
  if (last && last <= now && now - last < VERSE_GREETING_INTERVAL_MS) {
    return false;
  }
  await AsyncStorage.setItem(VERSE_GREETING_KEY, String(now));
  return true;
}

const PSALM_119_105 =
  "Thy word is a lamp unto my feet, and a light unto my path.";

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
  const [showVerseGreeting, setShowVerseGreeting] = useState(false);
  const [journalThisWeek, setJournalThisWeek] = useState<number | null>(null);
  const isDesktop = useIsDesktop();
  const padH = useScrollPaddingH();
  // Phone / tablet web: the page scrolls, not an inner box (responsive.ts)
  const pageScroll = usePageScroll();

  const user = auth.currentUser;
  const displayName = user?.displayName?.split(" ")[0] ?? "Friend";

  // Re-evaluate greeting every minute so it stays accurate while app is open
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Show the verse greeting when it's due: on opening Home, and when the app
  // comes back to the foreground while Home is the screen in view
  useFocusEffect(
    useCallback(() => {
      const check = () =>
        claimVerseGreeting()
          .then((due) => due && setShowVerseGreeting(true))
          .catch(() => {});
      check();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") check();
      });
      return () => sub.remove();
    }, []),
  );

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
      loadBookmarks(user?.uid ?? "").then((bms) =>
        setBookmarkCount(bms.length),
      );
      // Only the desktop layout shows the weekly journal count
      if (isDesktop && user) {
        const since = startOfWeek();
        loadEntries(user.uid)
          .then((entries) =>
            setJournalThisWeek(
              entries.filter((e) => e.createdAt >= since).length,
            ),
          )
          .catch(() => setJournalThisWeek(0));
      }
    }, [isDesktop]),
  );

  return (
    <View
      {...pageScrollMarker(pageScroll)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {isDesktop ? (
        <DesktopHome
          theme={theme}
          greeting={greeting}
          displayName={displayName}
          dateText={getFormattedDate()}
          verse={verse}
          loading={loading}
          error={error}
          onRetry={() => loadVerse()}
          readingPosition={readingPosition}
          journalThisWeek={journalThisWeek}
        />
      ) : (
      <ScrollView
        {...pageScrollMarker(pageScroll, "pageScrollList")}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: padH },
          // The top bar already clears the status bar
          pageScroll && { paddingTop: 24 },
        ]}
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
          <VerseCardSkeleton />
        ) : error ? (
          <ErrorCard theme={theme} onRetry={loadVerse} />
        ) : verse ? (
          <VerseCard verse={verse} theme={theme} />
        ) : null}

        {/* Verses shared by Brethren */}
        {BRETHREN_ENABLED && <SharedVersesCard theme={theme} />}

        {/* Collection Cards */}
        <CollectionCards theme={theme} />

        {/* Quick Access */}
        <Text style={[styles.quickAccessLabel, { color: theme.text }]}>
          Quick Access
        </Text>
        <BrowseBibleCard theme={theme} />
        {readingPosition && (
          <ResumeReadingCard position={readingPosition} theme={theme} />
        )}
        <QuickLinkCard
          theme={theme}
          icon="calendar-outline"
          title="Reading Plans"
          subtitle="Read the Bible a little each day"
          href="/(tabs)/reading-plans"
        />
        <QuickLinkCard
          theme={theme}
          icon="albums-outline"
          title="Memory Verses"
          subtitle="Practise verses with flashcards"
          href="/(tabs)/memory-verses"
        />
        <BookmarkBadgeCard count={bookmarkCount} theme={theme} />
        <ConcordanceCard theme={theme} />
      </ScrollView>
      )}

      {/* ── Verse Greeting Modal ─────────────────────────── */}
      <AppModal
        visible={showVerseGreeting}
        onClose={() => setShowVerseGreeting(false)}
        statusBarTranslucent
        overlayStyle={styles.verseGreetingOverlay}
        cardStyle={[
          styles.verseGreetingCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text
          style={[
            styles.verseGreetingRef,
            { color: theme.textSecondary },
          ]}
        >
          Psalms 119:105
        </Text>
        <View
          style={[
            styles.verseGreetingDivider,
            { backgroundColor: theme.text },
          ]}
        />
        <Text style={[styles.verseGreetingText, { color: theme.text }]}>
          {PSALM_119_105}
        </Text>
        <TouchableOpacity
          style={[
            styles.verseGreetingBtn,
            {
              borderColor: theme.border,
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setShowVerseGreeting(false)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.verseGreetingBtnText,
              { color: theme.primaryText },
            ]}
          >
            Begin Journey
          </Text>
        </TouchableOpacity>
      </AppModal>
    </View>
  );
}
