import { LIST_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Tablets: a finger-sized close button
  closeTablet: {
    width: 44,
    height: 44,
    margin: -11,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },

  // ── Search Bar ───────────────────────────────────────────
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
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

  // ── Section Label (same as the other main tabs) ──────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    marginBottom: 10,
  },

  // ── Suggested Terms ──────────────────────────────────────
  suggestedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    paddingHorizontal: LIST_PADDING_H,
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
  highlightText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ── Result count ─────────────────────────────────────────
  resultCount: {
    fontSize: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
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
  resultList: {
    paddingBottom: 48,
  },

  // ── Tablet / desktop: sections by book, verses as cards ──
  sectionList: {
    gap: 24,
  },
  bookSection: {
    gap: 12,
  },
  bookSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 2,
  },
  // Book heading: the section label, without its gap below (the rule
  // beside it lines up with the text)
  bookSectionLabel: {
    marginBottom: 0,
  },
  bookSectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  resultCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  resultCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resultCardRef: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  resultCardText: {
    fontSize: 15,
    lineHeight: 23,
  },
});
