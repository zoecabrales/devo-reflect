import { fs, LIST_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: fs(26),
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // ── Streak Badge ─────────────────────────────────────────
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  newEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  newEntryText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Month Group Header ───────────────────────────────────
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 16,
    paddingBottom: 8,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  groupCount: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.35,
  },

  // ── List ─────────────────────────────────────────────────
  list: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 32,
    gap: 10,
  },

  // ── Entry Card ───────────────────────────────────────────
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dateBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateBadgeMonth: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dateBadgeDay: {
    fontSize: 20,
    fontFamily: "Oswald_700Bold",
    lineHeight: 24,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.6,
    letterSpacing: 0.1,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },

  // ── Verse Chip ────────────────────────────────────────────
  verseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  verseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  verseChipText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Empty State ──────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 40,
  },
  emptyPrompt: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.6,
    letterSpacing: 0.2,
  },

  // ── FAB ───────────────────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Loading ───────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
