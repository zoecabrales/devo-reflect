import { Platform } from "react-native";

// ── Verse image (web) ────────────────────────────────────────────────────────
// Draws a shareable verse card on a <canvas>: the verse, its reference, an
// optional personal line, and a "Devo Reflect" watermark with the site's
// address. Used for sharing to Facebook / Instagram / TikTok and the like.

export type ImageFormat = "square" | "story";
export type ImageStyle = "dark" | "light" | "paper";

export interface VerseImageInput {
  text: string;
  /** When several verses are shared, each one (drawn with verse numbers). */
  verses?: { verse: number; text: string }[];
  /** e.g. "John 3:16–18" */
  reference: string;
  /** e.g. "ASV" */
  version: string;
  /** Optional personal line, shown under the reference. */
  note?: string;
  format: ImageFormat;
  style: ImageStyle;
}

export const IMAGE_SIZES: Record<ImageFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 }, // feed posts
  story: { w: 1080, h: 1920 }, // stories / TikTok photo mode
};

export const IMAGE_STYLES: Record<
  ImageStyle,
  { label: string; bg: [string, string]; text: string; muted: string; rule: string }
> = {
  dark: {
    label: "Dark",
    bg: ["#1c1c1e", "#0b0b0c"],
    text: "#f5f5f5",
    muted: "#a1a1a6",
    rule: "rgba(255,255,255,0.18)",
  },
  light: {
    label: "Light",
    bg: ["#ffffff", "#eef0f3"],
    text: "#111111",
    muted: "#5f6368",
    rule: "rgba(0,0,0,0.12)",
  },
  paper: {
    label: "Paper",
    bg: ["#f7efdf", "#eadcc0"],
    text: "#2b2116",
    muted: "#7a6650",
    rule: "rgba(60,40,20,0.18)",
  },
};

/** Sharing as an image needs a browser canvas (the web app). */
export const CAN_MAKE_IMAGES = Platform.OS === "web";

/**
 * Address shown in the watermark: EXPO_PUBLIC_SITE_URL if set, otherwise the
 * address the web app is open at (so the live site shows its own domain).
 * Local addresses are left out.
 */
export function watermarkSite(): string | null {
  const configured = process.env.EXPO_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (typeof window === "undefined") return null;
  const host = window.location.host;
  if (!host || /^(localhost|127\.|192\.168\.|10\.)/.test(host)) return null;
  return host.replace(/^www\./, "");
}

const VERSE_FONT = '"Georgia", "Times New Roman", serif';
const UI_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const BRAND_FONT = '"Oswald_700Bold", "Oswald", Impact, sans-serif';

/** A word on the image; a verse number is glued to the word after it. */
type Part = { text: string; num: boolean };
type Word = Part[];

/** Verses → words. Verse numbers are only shown for more than one verse. */
function toWords(input: VerseImageInput): Word[] {
  const words: Word[] = [];
  const split = (t: string) => t.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (input.verses && input.verses.length > 1) {
    for (const v of input.verses) {
      const ws = split(v.text);
      if (!ws.length) continue;
      words.push([{ text: String(v.verse), num: true }, { text: ws[0], num: false }]);
      for (const w of ws.slice(1)) words.push([{ text: w, num: false }]);
    }
  } else {
    for (const w of split(input.text)) words.push([{ text: w, num: false }]);
  }
  return words;
}

/** Fonts for a verse size: the text, and the smaller raised verse number. */
function verseFonts(size: number) {
  return {
    text: `400 ${size}px ${VERSE_FONT}`,
    num: `700 ${Math.round(size * 0.55)}px ${UI_FONT}`,
    numGap: size * 0.18,
  };
}

function wordWidth(ctx: CanvasRenderingContext2D, word: Word, size: number) {
  const f = verseFonts(size);
  let w = 0;
  for (const p of word) {
    ctx.font = p.num ? f.num : f.text;
    w += ctx.measureText(p.text).width + (p.num ? f.numGap : 0);
  }
  return w;
}

/** Splits words into lines that fit maxWidth at the given verse size. */
function wrapWords(
  ctx: CanvasRenderingContext2D,
  words: Word[],
  size: number,
  maxWidth: number,
) {
  ctx.font = verseFonts(size).text;
  const space = ctx.measureText(" ").width;
  const lines: Word[][] = [];
  let line: Word[] = [];
  let lineW = 0;
  for (const word of words) {
    const ww = wordWidth(ctx, word, size);
    const next = line.length ? lineW + space + ww : ww;
    if (next <= maxWidth || !line.length) {
      line.push(word);
      lineW = next;
    } else {
      lines.push(line);
      line = [word];
      lineW = ww;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

/** Splits plain text into lines that fit maxWidth at the context's font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export interface VerseImageResult {
  blob: Blob;
  /** True when the passage was too long and had to be cut short with "…". */
  truncated: boolean;
}

/** Smallest verse size before a passage is cut short. */
const MIN_VERSE_SIZE = 22;

/** Draws the verse card and returns it as a PNG. Web only. */
export async function renderVerseImage(
  input: VerseImageInput,
): Promise<VerseImageResult> {
  const { w, h } = IMAGE_SIZES[input.format];
  const s = IMAGE_STYLES[input.style];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  // Make sure the brand font is ready before measuring / drawing
  try {
    await document.fonts?.load(`700 40px ${BRAND_FONT}`);
  } catch {
    // Falls back to the next font in the list
  }
  const logo = await loadImage("/icon-192.png");

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, s.bg[0]);
  grad.addColorStop(1, s.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const padX = 104;
  const maxText = w - padX * 2;
  const footerH = 150;
  const top = input.format === "story" ? 260 : 120;
  const bottom = h - footerH - (input.format === "story" ? 140 : 60);

  // Big opening quote mark
  ctx.fillStyle = s.rule;
  ctx.font = `700 200px ${VERSE_FONT}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("“", padX - 16, top - 70);

  // Fit the verse: largest font size whose block fits the space. Longer
  // passages (several verses) get smaller text, down to MIN_VERSE_SIZE.
  // Reference and note shrink a little with the verse so they stay in scale
  const refSizeFor = (verse: number) => Math.min(40, Math.max(30, Math.round(verse * 1.05)));
  let refSize = 40;
  const noteSize = 34;
  const note = input.note?.trim();
  const words = toWords(input);
  const space = bottom - top - 40;
  const extraH = (noteLines: string[]) =>
    56 + // gap before reference
    refSize * 1.3 +
    (noteLines.length ? 36 + noteLines.length * noteSize * 1.4 : 0);
  ctx.font = `italic 400 ${noteSize}px ${UI_FONT}`;
  const noteLines = note ? wrap(ctx, note, maxText) : [];
  let size = input.format === "story" ? 72 : 62;
  let lines: Word[][] = [];
  for (; size >= MIN_VERSE_SIZE; size -= 2) {
    refSize = refSizeFor(size);
    lines = wrapWords(ctx, words, size, maxText);
    if (lines.length * size * 1.42 + extraH(noteLines) <= space) break;
  }
  size = Math.max(size, MIN_VERSE_SIZE);
  refSize = refSizeFor(size);
  const lineH = size * 1.42;

  // Still too long at the smallest size: keep what fits and end with "…"
  const maxLines = Math.max(1, Math.floor((space - extraH(noteLines)) / lineH));
  const truncated = lines.length > maxLines;
  if (truncated) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    const ellipsis: Word = [{ text: "…", num: false }];
    // Make room for the "…" on the last line
    const lineWidth = (ws: Word[]) => {
      ctx.font = verseFonts(size).text;
      const sp = ctx.measureText(" ").width;
      return ws.reduce((sum, w, i) => sum + wordWidth(ctx, w, size) + (i ? sp : 0), 0);
    };
    while (last.length > 1 && lineWidth([...last, ellipsis]) > maxText) {
      last.pop();
    }
    last.push(ellipsis);
  }
  const blockH = lines.length * lineH + extraH(noteLines);

  // Vertically centre the block in the space above the footer
  let y = top + 40 + Math.max(0, (space - blockH) / 2);

  const fonts = verseFonts(size);
  ctx.font = fonts.text;
  const spaceW = ctx.measureText(" ").width;
  for (const line of lines) {
    let x = padX;
    line.forEach((word, i) => {
      if (i > 0) x += spaceW;
      for (const p of word) {
        if (p.num) {
          // Verse number: small, muted and raised
          ctx.font = fonts.num;
          ctx.fillStyle = s.muted;
          ctx.fillText(p.text, x, y + size * 0.04);
          x += ctx.measureText(p.text).width + fonts.numGap;
        } else {
          ctx.font = fonts.text;
          ctx.fillStyle = s.text;
          ctx.fillText(p.text, x, y);
          x += ctx.measureText(p.text).width;
        }
      }
    });
    y += lineH;
  }

  // Reference + translation
  y += 56;
  ctx.fillStyle = s.rule;
  ctx.fillRect(padX, y - 24, 64, 4);
  ctx.font = `700 ${refSize}px ${UI_FONT}`;
  ctx.fillStyle = s.text;
  const ref = `${input.reference}`;
  ctx.fillText(ref, padX, y);
  const refW = ctx.measureText(ref).width;
  ctx.font = `500 ${refSize * 0.8}px ${UI_FONT}`;
  ctx.fillStyle = s.muted;
  ctx.fillText(`  ·  ${input.version}`, padX + refW, y + refSize * 0.12);
  y += refSize * 1.3;

  // Personal line
  if (noteLines.length) {
    y += 36;
    ctx.font = `italic 400 ${noteSize}px ${UI_FONT}`;
    ctx.fillStyle = s.muted;
    for (const line of noteLines) {
      ctx.fillText(line, padX, y);
      y += noteSize * 1.4;
    }
  }

  // Watermark: logo tile, name and site address
  const fy = h - footerH - (input.format === "story" ? 80 : 0);
  ctx.fillStyle = s.rule;
  ctx.fillRect(padX, fy, w - padX * 2, 2);
  const tile = 72;
  const ty = fy + 40;
  ctx.save();
  roundRect(ctx, padX, ty, tile, tile, 18);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.clip();
  if (logo) ctx.drawImage(logo, padX - 6, ty - 6, tile + 12, tile + 12);
  ctx.restore();
  // Thin outline so the white tile still reads on light backgrounds
  roundRect(ctx, padX, ty, tile, tile, 18);
  ctx.strokeStyle = s.rule;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `700 40px ${BRAND_FONT}`;
  ctx.fillStyle = s.text;
  ctx.textBaseline = "middle";
  ctx.fillText("Devo Reflect", padX + tile + 24, ty + tile / 2 - 2);
  const site = watermarkSite();
  if (site) {
    ctx.font = `500 30px ${UI_FONT}`;
    ctx.fillStyle = s.muted;
    ctx.textAlign = "right";
    ctx.fillText(site, w - padX, ty + tile / 2);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve({ blob, truncated })
          : reject(new Error("Could not create image.")),
      "image/png",
    ),
  );
}

/** "John 3:16–18" → "devo-reflect-john-3-16-18.png" */
export function imageFileName(reference: string): string {
  const slug = reference
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `devo-reflect-${slug}.png`;
}

/**
 * Phones and tablets have a share sheet with Facebook, Instagram, TikTok,
 * Messenger…; on computers it only offers system apps, so there the image
 * is downloaded instead.
 */
export function prefersShareSheet(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/**
 * Opens the device's share sheet with the image (Facebook, Instagram,
 * TikTok, Messenger…) on phones and tablets. On computers, or where the
 * browser can't share files, downloads it instead. Returns what happened.
 */
export async function shareOrDownload(
  blob: Blob,
  fileName: string,
  caption: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], fileName, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (prefersShareSheet() && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: caption });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // Fall through to download
    }
  }
  downloadImage(blob, fileName);
  return "downloaded";
}

export function downloadImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
