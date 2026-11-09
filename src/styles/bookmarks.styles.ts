import { LIST_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── List ─────────────────────────────────────────────────
  list: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 48,
    gap: 12,
  },

  // ── Bookmark Row ─────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  rowRef: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  rowText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
    opacity: 0.72,
  },
  // Newest bookmark in the desktop bento grid
  rowTextFeatured: {
    fontSize: 19,
    lineHeight: 29,
    opacity: 0.9,
  },
  rowVersion: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.35,
    textTransform: "uppercase",
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
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
  verseCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  verseRef: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: "italic",
    letterSpacing: 0.1,
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
});
