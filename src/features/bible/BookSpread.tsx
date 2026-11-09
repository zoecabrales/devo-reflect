import { Theme } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** Widest the open book gets; spreads beyond this would be hard to read. */
export const BOOK_MAX_WIDTH = 1240;
/** Side padding around the book inside the content area. */
export const BOOK_SIDE_PADDING = 24;
/** Space between verses on a page (included in measurement). */
const ITEM_SPACING = 14;

// One id per items array (i.e. per chapter), so measurements keyed by item
// key (verse number) never leak between chapters.
const generations = new WeakMap<object, number>();
let lastGeneration = 0;
function generationOf(items: object): number {
  let g = generations.get(items);
  if (g === undefined) {
    g = ++lastGeneration;
    generations.set(items, g);
  }
  return g;
}

function focusToIndex(focus: number | "end" | null | undefined, count: number) {
  if (focus === "end") return Math.max(0, count - 1);
  return focus ?? 0;
}

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  theme: Theme;
  /**
   * Item index to bring into view (its spread opens), or "end" for the last
   * spread. Changing it turns to that spread.
   */
  focus?: number | "end" | null;
  /** Called when turning past the first / last spread. */
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
};

/**
 * Desktop "open book" reader: items are paginated onto two facing pages with
 * a spine between them, and the reader turns pages (buttons / arrow keys)
 * instead of scrolling.
 *
 * react-native-web has no CSS columns, so pagination is measured: every item
 * is rendered invisibly at the page's width, its height recorded, and items
 * are packed into pages that never split an item.
 */
export function BookSpread<T>({
  items,
  keyOf,
  renderItem,
  theme,
  focus = null,
  onPrevChapter,
  onNextChapter,
}: Props<T>) {
  const [pageHeight, setPageHeight] = useState(0);
  // Measured heights keyed by `${generation}:${itemKey}`
  const [heights, setHeights] = useState<Map<string, number>>(new Map());
  const pending = useRef<Map<string, number>>(new Map());
  const gen = generationOf(items);
  const hKey = useCallback((item: T) => `${gen}:${keyOf(item)}`, [gen, keyOf]);
  const flushScheduled = useRef(false);
  const [fade] = useState(() => new Animated.Value(1));

  // The item kept in view: the visible spread is whichever holds it, so it
  // survives re-pagination (resize). Reset when the chapter or focus changes
  // (state derived from props, updated during render).
  const [anchor, setAnchor] = useState({
    items,
    focus,
    index: focusToIndex(focus, items.length),
  });
  if (anchor.items !== items || anchor.focus !== focus) {
    setAnchor({ items, focus, index: focusToIndex(focus, items.length) });
  }

  // Batch per-item onLayout reports into a single state update
  const record = useCallback((key: string, h: number) => {
    pending.current.set(key, h);
    if (flushScheduled.current) return;
    flushScheduled.current = true;
    requestAnimationFrame(() => {
      flushScheduled.current = false;
      const updates = pending.current;
      pending.current = new Map();
      setHeights((prev) => {
        let changed = false;
        for (const [k, v] of updates) if (prev.get(k) !== v) changed = true;
        if (!changed) return prev;
        // Keep only the current chapter's generation
        const prefix = updates.keys().next().value?.split(":")[0] + ":";
        const next = new Map([...prev].filter(([k]) => k.startsWith(prefix)));
        for (const [k, v] of updates) next.set(k, v);
        return next;
      });
    });
  }, []);

  const measured = pageHeight > 0 && items.every((it) => heights.has(hKey(it)));

  // Pack items into pages: arrays of item indices
  const pages = useMemo(() => {
    if (!measured) return [] as number[][];
    const out: number[][] = [];
    let page: number[] = [];
    let used = 0;
    items.forEach((it, i) => {
      const h = heights.get(hKey(it)) ?? 0;
      if (page.length > 0 && used + h > pageHeight) {
        out.push(page);
        page = [];
        used = 0;
      }
      page.push(i);
      used += h;
    });
    if (page.length) out.push(page);
    return out;
  }, [measured, items, heights, pageHeight, hKey]);

  const spreadCount = Math.max(1, Math.ceil(pages.length / 2));

  const anchorPage = pages.findIndex((pg) => pg.includes(anchor.index));
  const spread = anchorPage < 0 ? 0 : Math.floor(anchorPage / 2);

  const turnTo = useCallback(
    (next: number) => {
      fade.setValue(0.25);
      const first = pages[next * 2]?.[0] ?? 0;
      setAnchor((a) => ({ ...a, index: first }));
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    },
    [fade, pages],
  );

  const goNext = useCallback(() => {
    if (spread < spreadCount - 1) turnTo(spread + 1);
    else onNextChapter?.();
  }, [spread, spreadCount, turnTo, onNextChapter]);

  const goPrev = useCallback(() => {
    if (spread > 0) turnTo(spread - 1);
    else onPrevChapter?.();
  }, [spread, turnTo, onPrevChapter]);

  // Arrow keys turn pages (ignored while typing, e.g. in chapter search)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const onPageLayout = (e: LayoutChangeEvent) =>
    setPageHeight(Math.floor(e.nativeEvent.layout.height));

  const leftPage = pages[spread * 2] ?? [];
  const rightPage = pages[spread * 2 + 1] ?? [];
  const atStart = spread === 0;
  const atEnd = spread >= spreadCount - 1;

  function renderPage(
    indices: number[],
    pageNumber: number,
    side: "left" | "right",
  ) {
    return (
      <View
        style={[
          styles.page,
          side === "left" ? styles.pageLeft : styles.pageRight,
        ]}
      >
        <View
          style={styles.pageBody}
          onLayout={side === "left" ? onPageLayout : undefined}
        >
          {/* Invisible measuring copy of the whole chapter at page width */}
          {side === "left" && (
            <View key={gen} style={styles.measureLayer} pointerEvents="none">
              {items.map((it) => {
                const k = hKey(it);
                return (
                  <View
                    key={k}
                    style={styles.item}
                    onLayout={(e) => record(k, e.nativeEvent.layout.height)}
                  >
                    {renderItem(it)}
                  </View>
                );
              })}
            </View>
          )}
          <Animated.View style={{ opacity: fade }}>
            {indices.map((i) => (
              <View key={keyOf(items[i])} style={styles.item}>
                {renderItem(items[i])}
              </View>
            ))}
          </Animated.View>
        </View>
        {indices.length > 0 && (
          <Text style={[styles.pageNumber, { color: theme.textSecondary }]}>
            {pageNumber}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={bookFrame.outer}>
      <View
        style={[
          bookFrame.book,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {renderPage(leftPage, spread * 2 + 1, "left")}
        <BookSpine theme={theme} />
        {renderPage(rightPage, spread * 2 + 2, "right")}
      </View>

      {/* Page controls */}
      <View style={styles.controls}>
        <NavButton
          theme={theme}
          icon="chevron-back"
          label={atStart ? "Previous chapter" : "Previous page"}
          onPress={goPrev}
          disabled={atStart && !onPrevChapter}
        />
        <Text style={[styles.progress, { color: theme.textSecondary }]}>
          {measured
            ? `Pages ${spread * 2 + 1}${rightPage.length ? `–${spread * 2 + 2}` : ""} of ${pages.length}`
            : " "}
        </Text>
        <NavButton
          theme={theme}
          icon="chevron-forward"
          iconAfter
          label={atEnd ? "Next chapter" : "Next page"}
          onPress={goNext}
          disabled={atEnd && !onNextChapter}
        />
      </View>
    </View>
  );
}

/** The book's spine: a centre line with a soft fold on either side. */
export function BookSpine({ theme }: { theme: Theme }) {
  return (
    <View style={styles.spine}>
      <View style={[styles.fold, { backgroundColor: theme.text }]} />
      <View style={[styles.spineLine, { backgroundColor: theme.border }]} />
      <View style={[styles.fold, { backgroundColor: theme.text }]} />
    </View>
  );
}

function NavButton({
  theme,
  icon,
  label,
  onPress,
  disabled,
  iconAfter = false,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  iconAfter?: boolean;
}) {
  const glyph = <Ionicons name={icon} size={16} color={theme.text} />;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.navButton,
        {
          borderColor: theme.border,
          backgroundColor: hovered && !disabled ? theme.surface : "transparent",
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {!iconAfter && glyph}
      <Text style={[styles.navLabel, { color: theme.text }]}>{label}</Text>
      {iconAfter && glyph}
    </Pressable>
  );
}

/** Book frame styles shared with the table of contents (BookContents). */
export const bookFrame = StyleSheet.create({
  outer: {
    flex: 1,
    width: "100%",
    maxWidth: BOOK_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: BOOK_SIDE_PADDING,
    paddingBottom: 20,
  },
  book: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
});

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 20,
  },
  pageLeft: {
    paddingLeft: 52,
    paddingRight: 44,
  },
  pageRight: {
    paddingLeft: 44,
    paddingRight: 52,
  },
  pageBody: {
    flex: 1,
    overflow: "hidden",
  },
  measureLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  item: {
    paddingBottom: ITEM_SPACING,
  },
  pageNumber: {
    marginTop: 12,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
  },
  spine: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  // Faint shading either side of the centre line suggests the page fold
  fold: {
    width: 10,
    opacity: 0.025,
  },
  spineLine: {
    width: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  progress: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
