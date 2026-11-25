// How a highlighted verse is drawn: the letters keep the reader's text colour,
// the highlight colour wraps their edges, and a darker side underneath gives
// them depth. Only the drawing lives here; the saved highlight is still just
// one of the HIGHLIGHT_COLORS.

/** Outline thickness in pixels. */
const EDGE_WIDTH = 0.9;
/** Points around each letter the outline is drawn from. */
const EDGE_STEPS = 16;

/** Lightness of the outline and of the side below it, for each kind of page. */
const SHADES = {
  dark: { edge: 0.45, depth: 0.24 },
  light: { edge: 0.64, depth: 0.43 },
};
/** Pale colours are strengthened so the thin outline still reads. */
const MIN_SATURATION = 0.75;
/** A paler colour stays paler than the others, so two blues look different. */
const TYPICAL_LIGHTNESS = 0.7;
const LIGHTNESS_CARRIED = 0.8;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** True for a dark page colour such as a dark theme's background. */
export function isDarkColor(hex: string): boolean {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

function hsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const sector =
    max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round(sector * 60), s: Math.min(1, s), l };
}

/** The outline and side colours for a highlight colour on this page. */
export function highlightShades(color: string, darkPage: boolean) {
  const { h, s, l } = hsl(color);
  const offset = (l - TYPICAL_LIGHTNESS) * LIGHTNESS_CARRIED;
  const saturation = Math.round(Math.max(s, MIN_SATURATION) * 100);
  const shade = (base: number) =>
    `hsl(${h}, ${saturation}%, ${Math.round((base + offset) * 100)}%)`;
  const { edge, depth } = darkPage ? SHADES.dark : SHADES.light;
  return { edge: shade(edge), depth: shade(depth) };
}

/** The CSS `text-shadow` that draws the highlight (web). */
export function highlightTextShadow(color: string, darkPage: boolean): string {
  const { edge, depth } = highlightShades(color, darkPage);
  const px = (v: number) => `${Number(v.toFixed(2))}px`;
  const outline = Array.from({ length: EDGE_STEPS }, (_, i) => {
    const angle = (i * 2 * Math.PI) / EDGE_STEPS;
    return `${px(Math.cos(angle) * EDGE_WIDTH)} ${px(Math.sin(angle) * EDGE_WIDTH)} 0 ${edge}`;
  });
  return [
    ...outline,
    `0px 1.8px 0 ${depth}`,
    `0px 2.6px 0 ${depth}`,
    "0px 3.4px 3px rgba(0, 0, 0, 0.45)",
  ].join(", ");
}
