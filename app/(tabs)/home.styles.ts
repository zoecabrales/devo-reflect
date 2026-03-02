import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 56,
    gap: 24,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    gap: 6,
  },
  greeting: {
    fontSize: 30,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 13,
    opacity: 0.55,
    letterSpacing: 0.3,
  },

  // ── Verse Card ───────────────────────────────────────────
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
  },
  verseReference: {
    fontSize: 14,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
    letterSpacing: 0.15,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  readInContextLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  readInContextText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Loading Skeleton ─────────────────────────────────────
  loadingCard: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  skeletonShort: {
    height: 12,
    borderRadius: 6,
    width: "35%",
    opacity: 0.12,
  },
  skeletonMedium: {
    height: 16,
    borderRadius: 8,
    width: "55%",
    opacity: 0.12,
  },
  skeletonLong: {
    height: 14,
    borderRadius: 7,
    width: "100%",
    opacity: 0.12,
  },
  skeletonLongAlt: {
    height: 14,
    borderRadius: 7,
    width: "85%",
    opacity: 0.12,
  },
  skeletonLongAlt2: {
    height: 14,
    borderRadius: 7,
    width: "90%",
    opacity: 0.12,
  },

  // ── Browse Bible Card ────────────────────────────────────
  browseCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  browseIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  browseTextWrap: {
    flex: 1,
    gap: 2,
  },
  browseTitle: {
    fontSize: 13,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  browseSubtitle: {
    fontSize: 11,
    opacity: 0.55,
    letterSpacing: 0.2,
  },

  // ── Collection Cards ─────────────────────────────────────
  collectionSectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  collectionScroll: {
    marginHorizontal: -24, // bleed to screen edges
  },
  collectionScrollContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  collectionCard: {
    width: 96,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 7,
    alignItems: "flex-start",
  },
  collectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionLabel: {
    fontSize: 10,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  collectionSubtitle: {
    fontSize: 9,
    opacity: 0.5,
    letterSpacing: 0.1,
    lineHeight: 12,
  },

  // ── Error State ──────────────────────────────────────────
  errorCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 14,
  },
  errorText: {
    textAlign: "center",
    opacity: 0.65,
    lineHeight: 22,
    fontSize: 15,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 4,
  },
  retryText: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // ── Resume Reading Card ────────────────────────────────────
  resumeCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resumeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeTextWrap: {
    flex: 1,
    gap: 2,
  },
  resumeLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    opacity: 0.45,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  resumeTitle: {
    fontSize: 13,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  resumeSubtitle: {
    fontSize: 11,
    opacity: 0.55,
    letterSpacing: 0.2,
  },
});
