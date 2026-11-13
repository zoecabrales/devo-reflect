import { LIST_PADDING_H } from "@/src/utils/responsive";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Scroll Content ────────────────────────────────────────
  content: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 48,
  },
  contentInner: {
    gap: 8,
  },
  // ── Desktop two-column layout ──
  desktopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 28,
  },
  desktopMain: {
    flex: 3,
    minWidth: 0,
  },
  desktopAside: {
    flex: 2,
    minWidth: 0,
  },

  // ── Section ───────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  // App version footer (phones / tablets; desktop shows it under About)
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },

  // ── Setting Row ───────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },

  // ── Appearance Picker ─────────────────────────────────────
  pickerBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Mode toggle (System / Light / Dark)
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Theme swatches (Default / Sepia / Ocean / Forest)
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
