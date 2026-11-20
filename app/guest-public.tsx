// /guest-public — the public page people land on from the church management
// system's "Eager to be encouraged?" button (see api/public/verse-of-the-day.ts).
// No sign-in needed: it shows the church Verse of the Day and its short
// devotional, the same ones the endpoint serves, and invites people to create
// an account. ?date=YYYY-MM-DD shows that day's verse (the endpoint's links
// include it); without it, today's.
//
// A bento grid of three tiles (verse, devotional, group question) and a slim
// sign-up strip, using the app's breakpoints (src/utils/responsive.ts):
//   phone   < 768    tiles stacked
//   tablet  768+     verse full width; devotional and group side by side
//   desktop 1024+    top bar; verse on the left, devotional over group on the right

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
const TOP_BAR_H = 64;
const GAP = 16;

type Layout = "phone" | "tablet" | "desktop";

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
  const isWide = isDesktop || isTablet;

  const openApp = () => router.replace("/");
  const signUp = () => router.push("/(auth)/sign-in?mode=signup");
  const signIn = () => router.push("/(auth)/sign-in");

  const tile = [
    styles.tile,
    isWide && styles.tileWide,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];
  const eyebrow = [styles.eyebrow, { color: theme.textSecondary }];

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

  // ── Tiles ────────────────────────────────────────────────────────────────
  const verseTile = (
    <View style={[tile, isDesktop && styles.verseTileDesktop]}>
      <View style={styles.tileHeader}>
        <Ionicons name="sunny-outline" size={16} color={theme.textSecondary} />
        <Text style={eyebrow}>Verse of the Day · {verse.theme}</Text>
      </View>
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
        <View style={[styles.referenceRule, { backgroundColor: theme.text }]} />
        <Text style={[styles.reference, isWide && styles.referenceWide, { color: theme.text }]}>
          {verse.reference}
          <Text style={{ color: theme.textSecondary, fontWeight: "400" }}> · WEB</Text>
        </Text>
      </View>
    </View>
  );

  const devotionalTile = (
    <View style={[tile, isWide && styles.flexTile]}>
      <View style={styles.tileHeader}>
        <Ionicons name="book-outline" size={16} color={theme.textSecondary} />
        <Text style={eyebrow}>Devotional</Text>
      </View>
      <Text style={[styles.devotionalTitle, { color: theme.text }]}>{verse.devotional.title}</Text>
      <Text style={[styles.devotionalBody, { color: theme.text }]}>{verse.devotional.body}</Text>
    </View>
  );

  const groupTile = (
    <View style={[tile, isTablet && styles.flexTile]}>
      <View style={styles.tileHeader}>
        <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
        <Text style={eyebrow}>For your group</Text>
      </View>
      <Text style={[styles.questionText, isWide && styles.questionTextWide, { color: theme.text }]}>
        {verse.devotional.question}
      </Text>
    </View>
  );

  // ── Sign-up strip ────────────────────────────────────────────────────────
  const buttons = signedIn ? (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
      onPress={openApp}
      activeOpacity={0.8}
    >
      <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>Open Devo Reflect</Text>
    </TouchableOpacity>
  ) : (
    <View style={[styles.buttons, isWide && styles.buttonsRow]}>
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        onPress={signUp}
        activeOpacity={0.8}
      >
        <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
          Create a free account
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: theme.border }]}
        onPress={signIn}
        activeOpacity={0.8}
      >
        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
          I already have an account
        </Text>
      </TouchableOpacity>
    </View>
  );

  const strip = (
    <View
      style={[
        styles.strip,
        isWide && styles.stripWide,
        { borderColor: theme.border },
      ]}
    >
      <View style={isWide && styles.stripText}>
        <Text style={[styles.stripHeading, { color: theme.text }]}>
          Grow in God&apos;s Word, every day
        </Text>
        <Text style={[styles.stripLead, { color: theme.textSecondary }]}>
          A free space for your personal time with God.
        </Text>
      </View>
      {buttons}
    </View>
  );

  // ── Grid ─────────────────────────────────────────────────────────────────
  let grid: React.ReactNode;
  if (isDesktop) {
    grid = (
      <View style={styles.row}>
        <View style={styles.verseColumn}>{verseTile}</View>
        <View style={styles.sideColumn}>
          {devotionalTile}
          {groupTile}
        </View>
      </View>
    );
  } else if (isTablet) {
    grid = (
      <>
        {verseTile}
        <View style={styles.row}>
          {devotionalTile}
          {groupTile}
        </View>
      </>
    );
  } else {
    grid = (
      <>
        {verseTile}
        {devotionalTile}
        {groupTile}
      </>
    );
  }

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
          isDesktop && styles.scrollDesktop,
        ]}
        {...pageScrollMarker(pageScroll, "pageScrollList")}
      >
        <View style={[styles.inner, isTablet && styles.innerTablet, isDesktop && styles.innerDesktop]}>
          {!isDesktop && brand}
          <View style={styles.grid}>
            {grid}
            {strip}
          </View>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Scripture from the World English Bible (public domain).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar (desktop)
  topBar: { height: TOP_BAR_H, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: "center" },
  topBarInner: {
    width: "100%",
    // The page content's 1120 plus this bar's own 40 + 40 side padding, so the
    // logo and "Sign in" line up with the grid below
    maxWidth: 1120 + 80,
    alignSelf: "center",
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarLink: { fontSize: 15, fontWeight: "600" },

  // Page
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 28 },
  scrollTablet: { paddingHorizontal: 40, paddingVertical: 40 },
  scrollDesktop: { paddingHorizontal: 40, paddingVertical: 40 },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center" },
  innerTablet: { maxWidth: 760 },
  innerDesktop: { maxWidth: 1120 },
  grid: { gap: GAP },
  row: { flexDirection: "row", gap: GAP, alignItems: "stretch" },
  verseColumn: { flex: 1.5 },
  sideColumn: { flex: 1, gap: GAP },

  // Brand
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandAboveContent: { marginBottom: 24 },
  brandIcon: { width: 32, height: 32 },
  brandName: { fontFamily: "Oswald_700Bold", fontSize: 22, letterSpacing: 0.5 },

  // Tiles
  tile: { borderWidth: 1, borderRadius: 20, padding: 22 },
  tileWide: { padding: 28 },
  flexTile: { flex: 1 },
  verseTileDesktop: { flex: 1, padding: 40, justifyContent: "center" },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },

  // Verse
  date: { fontSize: 13, marginTop: 6, marginBottom: 18 },
  verseText: { fontSize: 21, lineHeight: 32, fontFamily: "Georgia" },
  verseTextTablet: { fontSize: 26, lineHeight: 39 },
  verseTextDesktop: { fontSize: 32, lineHeight: 47 },
  referenceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  referenceRule: { width: 24, height: 2 },
  reference: { fontSize: 15, fontWeight: "700" },
  referenceWide: { fontSize: 17 },

  // Devotional
  devotionalTitle: { fontFamily: "Oswald_700Bold", fontSize: 22, marginTop: 12, marginBottom: 8 },
  devotionalBody: { fontSize: 15, lineHeight: 24 },

  // Group question
  questionText: { fontSize: 17, lineHeight: 26, fontWeight: "600", marginTop: 12 },
  questionTextWide: { fontSize: 19, lineHeight: 29 },

  // Sign-up strip
  strip: { borderWidth: 1, borderRadius: 20, padding: 22, gap: 16 },
  stripWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 28,
    gap: 24,
  },
  stripText: { flexShrink: 1 },
  stripHeading: { fontFamily: "Oswald_700Bold", fontSize: 20 },
  stripLead: { fontSize: 14, lineHeight: 20, marginTop: 2 },

  // Buttons
  buttons: { gap: 10 },
  buttonsRow: { flexDirection: "row" },
  primaryBtn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: "center" },
  primaryBtnText: { fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },

  footnote: { fontSize: 12, textAlign: "center", marginTop: 24 },
});
