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
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
  },
  verseReference: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 30,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
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

  // ── Loading Skeleton ─────────────────────────────────────
  loadingCard: {
    borderRadius: 16,
    padding: 24,
    gap: 14,
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
});

