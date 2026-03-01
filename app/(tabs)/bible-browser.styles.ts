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
  headerTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0.3,
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
  verseNum: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 24,
    paddingTop: 3,
    opacity: 0.4,
    textAlign: "right",
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    letterSpacing: 0.15,
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
