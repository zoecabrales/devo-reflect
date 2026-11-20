// /guest-public — the public page people land on from the church management
// system's "Eager to be encouraged?" button (see api/public/verse-of-the-day.ts).
// No sign-in needed: it shows the church Verse of the Day and its short
// devotional, the same ones the endpoint serves, and invites people to create
// an account. ?date=YYYY-MM-DD shows that day's verse (the endpoint's links
// include it); without it, today's.
//
// Three layouts, using the app's breakpoints (src/utils/responsive.ts):
//   phone   < 768    one column, buttons stacked
//   tablet  768+     wider column, features in a 2×2 grid, buttons side by side
//   desktop 1024+    top bar; verse on the left, intro and buttons on the right

import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import { getCommunityVerse, isValidDate } from "@/src/utils/communityVerse";
import { getPHTDateString } from "@/src/utils/dailyVerse";
import { pageScrollMarker, useIsDesktop, usePageScrollLayout } from "@/src/utils/responsive";
import { hideSplashOnce } from "@/src/utils/splashGuard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABLET_MIN_WIDTH = 768;

type Layout = "phone" | "tablet" | "desktop";

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: "sunny-outline",
    title: "A verse for every day",
    body: "Start each morning with Scripture and a moment to reflect.",
  },
  {
    icon: "book-outline",
    title: "Read the whole Bible",
    body: "Several translations, reading plans and book guides.",
  },
  {
    icon: "create-outline",
    title: "Journal and pray",
    body: "Write what God is teaching you and keep track of your prayers.",
  },
  {
    icon: "bookmark-outline",
    title: "Hide God's Word in your heart",
    body: "Bookmark verses and work on memorising them.",
  },
];

/** "2026-11-20" → "Friday, November 20" */
function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function useLayout(): Layout {
  const { width } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  if (isDesktop) return "desktop";
  const isTablet = Platform.OS === "ios" ? Platform.isPad : width >= TABLET_MIN_WIDTH;
  return isTablet ? "tablet" : "phone";
}

export default function GuestPublic() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const layout = useLayout();
  const pageScroll = usePageScrollLayout();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ date?: string }>();
  const [today] = useState(getPHTDateString);
  const date = isValidDate(params.date) ? params.date : today;
  const verse = getCommunityVerse(date);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    hideSplashOnce();
    return onAuthStateChanged(auth, (user) => setSignedIn(!!user));
  }, []);

  const isDesktop = layout === "desktop";
  const isTablet = layout === "tablet";

  const openApp = () => router.replace("/");
  const signUp = () => router.push("/(auth)/sign-in?mode=signup");
  const signIn = () => router.push("/(auth)/sign-in");

  const brand = (
    <View style={[styles.brand, !isDesktop && styles.brandAboveContent]}>
      <Image
        source={require("@/assets/images/bibleicon.png")}
        style={styles.brandIcon}
        resizeMode="contain"
      />
      <Text style={[styles.brandName, { color: theme.text }]}>Devo Reflect</Text>
    </View>
  );

  const verseBlock = (
    <View
      style={[
        styles.card,
        isTablet && styles.cardTablet,
        isDesktop && styles.cardDesktop,
        !isDesktop && { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
        Verse of the Day · {verse.theme}
      </Text>
      <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(date)}</Text>
      <Text
        style={[
          styles.verseText,
          isTablet && styles.verseTextTablet,
          isDesktop && styles.verseTextDesktop,
          { color: theme.text },
        ]}
      >
        {verse.text}
      </Text>
      <View style={styles.referenceRow}>
        {isDesktop && <View style={[styles.referenceRule, { backgroundColor: theme.text }]} />}
        <Text
          style={[styles.reference, isDesktop && styles.referenceDesktop, { color: theme.text }]}
        >
          {verse.reference}
          <Text style={{ color: theme.textSecondary, fontWeight: "400" }}> · WEB</Text>
        </Text>
      </View>
    </View>
  );

  const devotionalBlock = (
    <View
      style={[
        styles.devotional,
        isTablet && styles.devotionalTablet,
        isDesktop && [styles.devotionalDesktop, { borderTopColor: theme.border }],
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Devotional</Text>
      <Text style={[styles.devotionalTitle, { color: theme.text }]}>{verse.devotional.title}</Text>
      <Text style={[styles.devotionalBody, { color: theme.text }]}>{verse.devotional.body}</Text>
      <View style={[styles.question, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.questionHeader}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.questionLabel, { color: theme.textSecondary }]}>For your group</Text>
        </View>
        <Text style={[styles.questionText, { color: theme.text }]}>{verse.devotional.question}</Text>
      </View>
    </View>
  );

  const buttons = signedIn ? (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
      onPress={openApp}
      activeOpacity={0.8}
    >
      <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>Open Devo Reflect</Text>
    </TouchableOpacity>
  ) : (
    <View style={[styles.buttons, isTablet && styles.buttonsRow]}>
      <TouchableOpacity
        style={[styles.primaryBtn, isTablet && styles.btnInRow, { backgroundColor: theme.primary }]}
        onPress={signUp}
        activeOpacity={0.8}
      >
        <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
          Create a free account
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryBtn, isTablet && styles.btnInRow, { borderColor: theme.border }]}
        onPress={signIn}
        activeOpacity={0.8}
      >
        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
          I already have an account
        </Text>
      </TouchableOpacity>
    </View>
  );

  const intro = (
    <View
      style={
        isDesktop && [
          styles.panel,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]
      }
    >
      <Text
        style={[styles.heading, (isTablet || isDesktop) && styles.headingLarge, { color: theme.text }]}
      >
        Grow in God&apos;s Word, every day
      </Text>
      <Text style={[styles.lead, { color: theme.textSecondary }]}>
        Devo Reflect is a free space for your personal time with God.
      </Text>

      <View style={[styles.features, isTablet && styles.featuresGrid]}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.feature, isTablet && styles.featureGridItem]}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: isDesktop ? theme.background : theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name={f.icon} size={20} color={theme.text} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
              <Text style={[styles.featureBody, { color: theme.textSecondary }]}>{f.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {buttons}
    </View>
  );

  const footnote = (
    <Text style={[styles.footnote, { color: theme.textSecondary }]}>
      Scripture from the World English Bible (public domain).
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      {...pageScrollMarker(pageScroll)}
    >
      {isDesktop && (
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <View style={styles.topBarInner}>
            {brand}
            <TouchableOpacity onPress={signedIn ? openApp : signIn} activeOpacity={0.7}>
              <Text style={[styles.topBarLink, { color: theme.text }]}>
                {signedIn ? "Open app" : "Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isTablet && styles.scrollTablet,
          isDesktop && [styles.scrollDesktop, { minHeight: height - TOP_BAR_H }],
        ]}
        {...pageScrollMarker(pageScroll, "pageScrollList")}
      >
        {isDesktop ? (
          <View style={styles.desktopInner}>
            <View style={styles.columns}>
              <View style={styles.verseColumn}>
                {verseBlock}
                {devotionalBlock}
              </View>
              <View style={styles.introColumn}>{intro}</View>
            </View>
            {footnote}
          </View>
        ) : (
          <View style={[styles.inner, isTablet && styles.innerTablet]}>
            {brand}
            {verseBlock}
            {devotionalBlock}
            {intro}
            {footnote}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const TOP_BAR_H = 64;

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar (desktop)
  topBar: { height: TOP_BAR_H, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: "center" },
  topBarInner: {
    width: "100%",
    // The page content's 1120 plus this bar's own 40 + 40 side padding, so the
    // logo and "Sign in" line up with the columns below
    maxWidth: 1120 + 80,
    alignSelf: "center",
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarLink: { fontSize: 15, fontWeight: "600" },

  // Scroll containers
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 32 },
  scrollTablet: { paddingHorizontal: 40, paddingVertical: 48 },
  scrollDesktop: { paddingHorizontal: 40, paddingVertical: 56, justifyContent: "center" },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center" },
  innerTablet: { maxWidth: 720 },
  desktopInner: { width: "100%", maxWidth: 1120, alignSelf: "center" },
  columns: { flexDirection: "row", alignItems: "flex-start", gap: 64 },
  verseColumn: { flex: 1.15 },
  introColumn: { flex: 1, maxWidth: 460 },

  // Brand
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandAboveContent: { marginBottom: 28 },
  brandIcon: { width: 32, height: 32 },
  brandName: { fontFamily: "Oswald_700Bold", fontSize: 22, letterSpacing: 0.5 },

  // Verse
  card: { borderWidth: 1, borderRadius: 16, padding: 24, marginBottom: 36 },
  cardTablet: { padding: 36, borderRadius: 20, marginBottom: 44 },
  cardDesktop: { borderWidth: 0, padding: 0, marginBottom: 0 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  date: { fontSize: 13, marginTop: 4, marginBottom: 18 },
  verseText: { fontSize: 20, lineHeight: 31, fontFamily: "Georgia" },
  verseTextTablet: { fontSize: 24, lineHeight: 37 },
  verseTextDesktop: { fontSize: 34, lineHeight: 50, marginTop: 8 },
  referenceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  referenceRule: { width: 28, height: 2 },
  reference: { fontSize: 15, fontWeight: "700" },
  referenceDesktop: { fontSize: 17 },

  // Devotional
  devotional: { marginBottom: 40 },
  devotionalTablet: { marginBottom: 48 },
  devotionalDesktop: { marginTop: 36, paddingTop: 32, borderTopWidth: 1, marginBottom: 0 },
  devotionalTitle: { fontFamily: "Oswald_700Bold", fontSize: 22, marginTop: 6, marginBottom: 10 },
  devotionalBody: { fontSize: 16, lineHeight: 26 },
  question: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 20 },
  questionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  questionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  questionText: { fontSize: 15, lineHeight: 23, fontWeight: "600" },

  // Intro
  panel: { borderWidth: 1, borderRadius: 20, padding: 32 },
  heading: { fontFamily: "Oswald_700Bold", fontSize: 24, marginBottom: 6 },
  headingLarge: { fontSize: 28 },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  features: { gap: 18, marginBottom: 32 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 24, rowGap: 22 },
  feature: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  featureGridItem: { width: "47%" },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  featureBody: { fontSize: 14, lineHeight: 20 },

  // Buttons
  buttons: { gap: 12 },
  buttonsRow: { flexDirection: "row" },
  btnInRow: { flex: 1 },
  primaryBtn: { borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },

  footnote: { fontSize: 12, textAlign: "center", marginTop: 28 },
});
