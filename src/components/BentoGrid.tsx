import { ReactNode, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

export type BentoSpan = 1 | 2;

type Props<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  /** Preferred width in columns (1 or 2). Wide tiles may shrink to fit a row. */
  spanFor: (item: T, index: number) => BentoSpan;
  /** `span` is the final column span after packing. */
  renderItem: (item: T, info: { index: number; span: number }) => ReactNode;
  gap?: number;
  /** Narrowest a column may get before dropping to fewer columns. */
  minColumnWidth?: number;
  maxColumns?: number;
  /**
   * Stretch the last tile of each row so rows end flush (default). Turn off
   * for lists of same-sized items, where a stretched last item looks odd.
   */
  fillRows?: boolean;
};

type Cell<T> = { item: T; index: number; span: number };

/**
 * Bento-style grid built on flexbox (react-native-web has no CSS grid).
 * Items are packed row by row; a wide tile that doesn't fit the space left
 * in a row starts the next row, and the last tile in each row stretches to
 * fill any gap, so every row ends flush. Tiles in a row share its height.
 */
export function BentoGrid<T>({
  data,
  keyExtractor,
  spanFor,
  renderItem,
  gap = 14,
  minColumnWidth = 260,
  maxColumns = 3,
  fillRows = true,
}: Props<T>) {
  const [width, setWidth] = useState(0);

  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))),
  );
  const columnWidth = (width - gap * (columns - 1)) / columns;

  const rows = useMemo(() => {
    const out: Cell<T>[][] = [];
    let row: Cell<T>[] = [];
    let free = columns;
    data.forEach((item, index) => {
      const want = Math.min(spanFor(item, index), columns);
      if (want > free) {
        // Doesn't fit: close this row (its last tile stretches below)
        out.push(row);
        row = [];
        free = columns;
      }
      row.push({ item, index, span: want });
      free -= want;
      if (free === 0) {
        out.push(row);
        row = [];
        free = columns;
      }
    });
    if (row.length) out.push(row);
    // Stretch the last tile of each row so rows end flush
    if (fillRows) {
      for (const r of out) {
        const used = r.reduce((n, c) => n + c.span, 0);
        r[r.length - 1].span += columns - used;
      }
    }
    return out;
  }, [data, columns, spanFor, fillRows]);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.floor(e.nativeEvent.layout.width));

  return (
    <View onLayout={onLayout} style={[styles.grid, { gap }]}>
      {width > 0 &&
        rows.map((row, ri) => (
          <View key={ri} style={[styles.row, { gap }]}>
            {row.map(({ item, index, span }) => (
              <View
                key={keyExtractor(item)}
                style={{ width: span * columnWidth + (span - 1) * gap }}
              >
                {renderItem(item, { index, span })}
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
});
