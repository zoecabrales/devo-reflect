import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },

  // ── Search Bar ───────────────────────────────────────────
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },

  // ── Section Label ────────────────────────────────────────
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    opacity: 0.45,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginBottom: 6,
  },

  // ── Entry Row ────────────────────────────────────────────
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  entryLeft: {
    flex: 1,
  },
  entryLexeme: {
    fontSize: 20,
    lineHeight: 26,
  },
  entryTranslit: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: 1,
  },
  entryRight: {
    flex: 2,
  },
  entryStrongs: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.4,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  entryShortDef: {
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Detail View ──────────────────────────────────────────
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 24,
    gap: 16,
  },
  detailLexeme: {
    fontSize: 48,
    lineHeight: 58,
    textAlign: "center",
  },
  detailTranslit: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.55,
  },
  detailPronunciation: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.4,
    fontStyle: "italic",
  },
  detailStrongsChip: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  detailStrongsText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  detailDivider: {
    height: 1,
    opacity: 0.12,
  },
  detailShortDef: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  detailDefinition: {
    fontSize: 14,
    lineHeight: 24,
    opacity: 0.75,
  },

  // ── States ───────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.5,
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    fontWeight: "700",
    fontSize: 14,
  },
});

