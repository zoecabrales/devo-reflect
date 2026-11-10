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
 * Scale (CSS zoom) applied to every main tab and to popups on desktop web,
 * so headers and content render at one consistent, compact size.
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

// ── Device detection ───────────────────────────────────────────────────────
// iPad 11th Gen (M4) logical portrait width = 834 pt. Fixed at load: only use
// for things that may stay put on resize (font scale); layout uses the hooks.
export const IS_TABLET =
  Platform.OS === "ios"
    ? Platform.isPad
    : SCREEN_W >= 768;

// ── Layout constants ───────────────────────────────────────────────────────
/** Maximum content width in the centered "content well" */
export const CONTENT_MAX_WIDTH = 720;

/** Side padding on phones for list screens (headers, lists, empty states). */
export const LIST_PADDING_H = 20;
/** Side padding on phones for the Home ScrollView. */
export const SCROLL_PADDING_H = 24;

/**
 * Side padding that centres content in a CONTENT_MAX_WIDTH well on tablets
 * and wide windows; phone value below 768pt.
 * On iPad 11 (834 pt): (834 - 720) / 2 = 57 pt → content fills the well exactly.
 */
function wellPadding(width: number, phonePadding: number): number {
  const isDesktop = isDesktopWidth(width);
  // Width available to screen content (the sidebar takes the rest on desktop)
  const contentW = isDesktop ? width - SIDEBAR_WIDTH : width;
  const isTablet =
    Platform.OS === "ios" ? Platform.isPad : width >= 768;
  return isTablet
    ? Math.max(32, Math.round((contentW - CONTENT_MAX_WIDTH) / 2))
    : phonePadding;
}

/**
 * Horizontal padding for list screens. Recomputed on resize/rotation, so
 * use this rather than a value captured at load.
 */
export function useListPaddingH(): number {
  const { width } = useWindowDimensions();
  return wellPadding(width, LIST_PADDING_H);
}

/** Horizontal padding for the Home ScrollView; recomputed on resize. */
export function useScrollPaddingH(): number {
  const { width } = useWindowDimensions();
  return wellPadding(width, SCROLL_PADDING_H);
}

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

