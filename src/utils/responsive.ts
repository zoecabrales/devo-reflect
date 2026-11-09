import { Dimensions, Platform, useWindowDimensions } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Desktop web ────────────────────────────────────────────────────────────
/** Web windows at least this wide get the desktop shell (top bar + sidebar). */
export const DESKTOP_BREAKPOINT = 1024;
/** Width of the desktop sidebar menu. */
export const SIDEBAR_WIDTH = 200;
/** Height of the desktop top bar. */
export const TOP_BAR_HEIGHT = 56;
/**
 * Scale applied (CSS zoom) to tabs that still use their mobile layout inside
 * the desktop shell, so they match the more compact desktop Home.
 */
export const DESKTOP_CONTENT_ZOOM = 0.85;

const isDesktopWidth = (width: number) =>
  Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;

/** Desktop shell at first load. Use useIsDesktop() in components so they react to resizing. */
export const IS_DESKTOP_WEB = isDesktopWidth(SCREEN_W);

/** True while the app is showing the desktop web shell; updates on window resize. */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return isDesktopWidth(width);
}

// Width available to screen content (the sidebar takes the rest on desktop)
const CONTENT_AREA_W = IS_DESKTOP_WEB ? SCREEN_W - SIDEBAR_WIDTH : SCREEN_W;

// ── Device detection ───────────────────────────────────────────────────────
// iPad 11th Gen (M4) logical portrait width = 834 pt
export const IS_TABLET =
  Platform.OS === "ios"
    ? Platform.isPad
    : SCREEN_W >= 768;

// ── Layout constants ───────────────────────────────────────────────────────
/** Maximum content width in the centered "content well" */
export const CONTENT_MAX_WIDTH = 720;

/**
 * Horizontal padding for list screens (headers, FlatList contentContainerStyle,
 * section headers, empty states).
 * On iPad 11 (834 pt): (834 - 720) / 2 = 57 pt → content fills the well exactly.
 * Falls back to 20 pt on phones.
 */
export const LIST_PADDING_H = IS_TABLET
  ? Math.max(32, Math.round((CONTENT_AREA_W - CONTENT_MAX_WIDTH) / 2))
  : 20;

/**
 * Horizontal padding used by the Home ScrollView (currently 24 on phone).
 * On tablet this matches LIST_PADDING_H so the content aligns across screens.
 */
export const SCROLL_PADDING_H = IS_TABLET
  ? Math.max(32, Math.round((CONTENT_AREA_W - CONTENT_MAX_WIDTH) / 2))
  : 24;

/**
 * Maximum width for centred dialog / bottom-sheet modals on tablet
 * so they don't span the full 834 pt wide screen.
 */
export const MODAL_MAX_WIDTH = 520;

// ── Font scale helper ──────────────────────────────────────────────────────
/**
 * Scale `size` by 1.15 on tablet, leave unchanged on phone.
 * Usage: `fontSize: fs(16)` → 16 on phone, 18 on tablet.
 */
export const fs = (size: number): number =>
  IS_TABLET ? Math.round(size * 1.15) : size;

