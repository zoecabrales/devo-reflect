import { fs, LIST_PADDING_H, MODAL_MAX_WIDTH } from "@/src/utils/responsive";
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
  // Desktop bento grid: the page container already provides side padding
  groupHeaderDesktop: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 12,
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

  // ── Help Button ───────────────────────────────────────────
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── SOAP Guide Modal ─────────────────────────────────────
  guideModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  guideModalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  guideModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.35,
  },
  guideModalTitle: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  guideModalIntro: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.6,
    letterSpacing: 0.1,
    marginBottom: 20,
  },
  guideModalDivider: {
    height: 1,
    opacity: 0.1,
    marginBottom: 20,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 18,
  },
  guideStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  guideStepLetter: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.5,
  },
  guideStepBody: {
    flex: 1,
    gap: 3,
  },
  guideStepName: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  guideStepDesc: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  guideStepPrompt: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.5,
    fontStyle: "italic",
    marginTop: 3,
    letterSpacing: 0.1,
  },
  guideModalCTA: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  guideModalCTAText: {
    fontSize: 14,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Delete Confirmation Modal ────────────────────────────
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  deleteModalCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 8,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  deleteModalBody: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.6,
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  deleteModalCancel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  deleteModalConfirm: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteModalConfirmText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
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
