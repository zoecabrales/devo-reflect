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

  // ── Message List ─────────────────────────────────────────
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },

  // ── Message Bubbles ──────────────────────────────────────
  messageRow: {
    flexDirection: "row",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAi: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.1,
  },

  // ── Typing Indicator ─────────────────────────────────────
  typingRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: LIST_PADDING_H,
    marginBottom: 4,
  },
  typingBubble: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    opacity: 0.55,
    letterSpacing: 0.2,
  },

  // ── Empty State ──────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: LIST_PADDING_H,
    gap: 8,
    paddingBottom: 32,
  },
  emptyTitle: {
    fontSize: fs(18),
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    opacity: 0.5,
    letterSpacing: 0.2,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 8,
  },
  promptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
  },
  promptChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promptChipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },

  // ── Input Bar ────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

