import { useAppTheme } from "@/src/contexts/ThemeContext";
import { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View } from "react-native";

// ── Base element ──────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({
  width = "100%",
  height = 14,
  borderRadius = 7,
}: SkeletonProps) {
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.08,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme.text,
        opacity,
      }}
    />
  );
}

// ── Shorthand presets ─────────────────────────────────────────────────────────

type LineSize = "short" | "medium" | "long" | "full";
const LINE_WIDTHS: Record<LineSize, DimensionValue> = {
  short: "35%",
  medium: "55%",
  long: "85%",
  full: "100%",
};

export function SkeletonLine({ size = "full" }: { size?: LineSize }) {
  return <Skeleton width={LINE_WIDTHS[size]} height={14} />;
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

// ── Screen-level skeletons ────────────────────────────────────────────────────

/** Home screen – Verse of the Day card while loading */
export function VerseCardSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        sk.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <SkeletonLine size="short" />
      <Skeleton width="55%" height={16} borderRadius={8} />
      <SkeletonLine size="full" />
      <SkeletonLine size="long" />
      <Skeleton width="90%" height={14} />
    </View>
  );
}

/** Journal list – replaces the centred ActivityIndicator */
export function JournalListSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View style={sk.list}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            sk.journalCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderLeftColor: theme.primary,
            },
          ]}
        >
          <View style={sk.row}>
            <View style={sk.dateBadge}>
              <Skeleton width={28} height={8} borderRadius={4} />
              <Skeleton width={20} height={20} borderRadius={4} />
            </View>
            <View style={sk.lines}>
              <SkeletonLine size="medium" />
              <SkeletonLine size="full" />
              <SkeletonLine size="long" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Prayers list – replaces the centred ActivityIndicator */
export function PrayerListSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View style={sk.list}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            sk.rowCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SkeletonCircle size={32} />
          <View style={sk.lines}>
            <SkeletonLine size="medium" />
            <SkeletonLine size="long" />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Bible Browser – replaces the centred ActivityIndicator while a chapter loads */
export function ChapterSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View
          key={i}
          style={[sk.verseRow, { borderBottomColor: theme.border }]}
        >
          <Skeleton width={24} height={14} borderRadius={4} />
          <View style={sk.lines}>
            <SkeletonLine size={i % 3 === 0 ? "full" : "long"} />
            <SkeletonLine size={i % 3 === 2 ? "medium" : "full"} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Concordance – replaces the centred ActivityIndicator while search results load */
export function ConcordanceSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View style={sk.list}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            sk.rowCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SkeletonLine size="short" />
          <SkeletonLine size={i % 2 === 0 ? "full" : "long"} />
        </View>
      ))}
    </View>
  );
}

// ── Layout styles ─────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  journalCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  dateBadge: {
    alignItems: "center",
    gap: 4,
    width: 40,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 14,
  },
  verseRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
