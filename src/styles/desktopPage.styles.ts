import { StyleSheet } from "react-native";

/** Widest any main tab's content gets on desktop. */
const PAGE_MAX_WIDTH = 1200;
const PAGE_PADDING_H = 32;

/**
 * The shared desktop page frame: every main tab's header (PageHeader) and
 * content use the same max width and side padding, so titles and content
 * start at the same left edge on every tab. Values are in zoomed layout
 * units (tabs render at DESKTOP_CONTENT_ZOOM).
 */
export const desktopPage = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: PAGE_MAX_WIDTH + PAGE_PADDING_H * 2,
    alignSelf: "center",
    paddingHorizontal: PAGE_PADDING_H,
  },
  content: {
    width: "100%",
    maxWidth: PAGE_MAX_WIDTH + PAGE_PADDING_H * 2,
    alignSelf: "center",
    paddingHorizontal: PAGE_PADDING_H,
    paddingBottom: 48,
  },
  /** Makes a card fill its bento tile so cards in a row match heights. */
  tileFill: {
    flex: 1,
  },
});
