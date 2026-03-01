import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
    marginTop: 2,
  },

  // ── List ─────────────────────────────────────────────────
  list: {
    paddingHorizontal: 20,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  rowText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
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
    gap: 12,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.5,
  },
});

