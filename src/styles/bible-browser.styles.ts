import { fs, LIST_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: LIST_PADDING_H,
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

  // ── Search ───────────────────────────────────────────────
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: LIST_PADDING_H,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
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
  // (reuses drawerOverlay / drawerSheet / drawerHandle / drawerTitle styles)
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
    paddingHorizontal: LIST_PADDING_H,
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
    paddingHorizontal: LIST_PADDING_H,
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
    justifyContent: "center",
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
    paddingHorizontal: LIST_PADDING_H,
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
    fontSize: fs(16),
    lineHeight: fs(26),
    flex: 1,
    letterSpacing: 0.15,
  },
  // Desktop two-page book view: serif type for an e-reader feel
  verseTextBook: {
    fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
  },
  verseNumBook: {
    fontSize: 10,
  },
  verseNumColBook: {
    paddingTop: 2,
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

  // ── Highlight / Bookmark drawer ────────────────────────────────────────────
  drawerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  drawerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.4,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  drawerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  swatchActive: {
    transform: [{ scale: 1.2 }],
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  drawerBookmarkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  drawerBookmarkBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  shareVersePreview: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.8,
  },
});
