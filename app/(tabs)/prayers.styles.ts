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

  // ── Add Prayer Input ─────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── List ─────────────────────────────────────────────────
  list: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 48,
    gap: 8,
  },

  // ── Prayer Row ───────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowText: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  rowTextAnswered: {
    opacity: 0.4,
    textDecorationLine: "line-through",
  },
  rowDate: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.35,
    textTransform: "uppercase",
    marginTop: 2,
  },
  answeredBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#4CAF50",
    marginTop: 2,
  },
  editBtn: {
    padding: 4,
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

  // ── Lord's Prayer Card ───────────────────────────────────
  lordsPrayerCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  lordsPrayerRef: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 2,
  },
  lordsPrayerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  lordsPrayerVerseNum: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.45,
    marginTop: 3,
    minWidth: 14,
    textAlign: "right",
  },
  lordsPrayerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    fontStyle: "italic",
    letterSpacing: 0.1,
  },

  // ── Edit Modal ────────────────────────────────────────────
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    maxHeight: 160,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  editCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  editSaveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Delete Modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalRef: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  modalDismissBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalDismissText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Loading ───────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
