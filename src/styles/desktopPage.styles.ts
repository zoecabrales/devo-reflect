import { StyleSheet } from "react-native";

/** Widest the bento-grid pages (Bookmarks, Journal) get on desktop. */
const PAGE_MAX_WIDTH = 1200;
const PAGE_PADDING_H = 32;

/**
 * Desktop overrides for list tabs that switch to a bento grid. Applied on top
 * of each screen's own header / list styles so the header and grid line up.
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
