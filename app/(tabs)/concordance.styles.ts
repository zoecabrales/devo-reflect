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
    paddingTop: 12,
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
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
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
    marginBottom: 10,
  },

  // ── Suggested Terms ──────────────────────────────────────
  suggestedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestedChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestedChipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Result Row ───────────────────────────────────────────
  resultRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  resultRef: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    opacity: 0.5,
    textTransform: "uppercase",
  },
  resultText: {
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Result count ─────────────────────────────────────────
  resultCount: {
    fontSize: 11,
    opacity: 0.45,
    marginHorizontal: 20,
    marginBottom: 8,
    fontStyle: "italic",
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

