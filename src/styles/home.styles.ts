import { fs, MODAL_MAX_WIDTH, SCROLL_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SCROLL_PADDING_H,
    paddingTop: 56,
    gap: 24,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    gap: 6,
  },
  greeting: {
    fontSize: fs(30),
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 13,
    opacity: 0.55,
    letterSpacing: 0.3,
  },

  // ── Verse Card (Hero) ────────────────────────────────────
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    // Android shadow
    elevation: 4,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
  },
  verseReference: {
    fontSize: fs(16),
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: fs(17),
    lineHeight: fs(27),
    fontStyle: "italic",
    letterSpacing: 0.2,
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

  // ── Quick Access Label ───────────────────────────────────
  quickAccessLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
    marginBottom: -12,
  },

  // ── Browse / Utility Cards ───────────────────────────────
  browseCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
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
  browseLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    opacity: 0.45,
    textTransform: "uppercase",
    marginBottom: 1,
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
    marginHorizontal: -SCROLL_PADDING_H, // bleed to screen edges
  },
  collectionScrollContent: {
    paddingHorizontal: SCROLL_PADDING_H,
    gap: 10,
  },
  collectionCard: {
    width: 168,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    alignItems: "flex-start",
  },
  collectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionLabel: {
    fontSize: 12,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  collectionSubtitle: {
    fontSize: 10,
    opacity: 0.5,
    letterSpacing: 0.1,
    lineHeight: 13,
    marginTop: -2,
  },
  collectionDescription: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.65,
    letterSpacing: 0.1,
    marginTop: 2,
  },

  // ── Collection Info Modal ────────────────────────────────
  collectionModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  collectionModalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  collectionModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.35,
  },
  collectionModalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  collectionModalLabel: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  collectionModalSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  collectionModalDivider: {
    height: 1,
    opacity: 0.12,
    marginBottom: 16,
  },
  collectionModalDescription: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.75,
    letterSpacing: 0.1,
    marginBottom: 28,
  },
  collectionModalCTA: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  collectionModalCTAText: {
    fontSize: 14,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
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

  // ── Verse Greeting Modal ──────────────────────────────────
  verseGreetingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  verseGreetingCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  verseGreetingRef: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  verseGreetingDivider: {
    height: 1,
    width: "100%",
    opacity: 0.12,
  },
  verseGreetingText: {
    fontSize: fs(18),
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: fs(18) * 1.5,
    textAlign: "center",
  },
  verseGreetingBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  verseGreetingBtnText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
