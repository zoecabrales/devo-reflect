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
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0.3,
  },

  // ── Version Pill ─────────────────────────────────────────
  versionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  // ── Version Picker Modal ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.25,
  },
  modalTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.4,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  versionOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  versionOptionLabel: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 44,
  },
  versionOptionDesc: {
    fontSize: 13,
    flex: 1,
    opacity: 0.55,
  },

  // ── Section Header ───────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    opacity: 0.45,
  },

  // ── Book List ────────────────────────────────────────────
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookLabel: {
    fontSize: 16,
    letterSpacing: 0.2,
  },

  // ── Chapter Grid ─────────────────────────────────────────
  chapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 10,
  },
  chapterBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chapterBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Verses ───────────────────────────────────────────────
  versesList: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },
  verseRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  verseNumCol: {
    alignItems: "center",
    minWidth: 24,
    gap: 3,
    paddingTop: 3,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.4,
    textAlign: "right",
  },
  verseBookmarkIcon: {
    opacity: 0.85,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    letterSpacing: 0.15,
  },
  verseTextUnderlined: {
    textDecorationLine: "underline",
  },

  // ── Bookmark Confirmation Popup ───────────────────────────
  confirmOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 100,
  },
  confirmCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  confirmTextWrap: {
    flex: 1,
    gap: 2,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  confirmRef: {
    fontSize: 12,
    opacity: 0.65,
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
    fontSize: 15,
    textAlign: "center",
    opacity: 0.55,
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
