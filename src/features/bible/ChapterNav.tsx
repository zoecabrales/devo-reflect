import { Theme } from "@/src/constants/theme";
import { PlanChapter } from "@/src/services/readingPlans";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GREEN = "#4CAF50";


/**
 * Below the last verse on phones and tablets: previous / next chapter
 * buttons (the same moves as swiping), so turning chapters is easy to find.
 */
export function ChapterFooterNav({
  theme,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  theme: Theme;
  /** null: no chapter that way. */
  prevLabel: string | null;
  nextLabel: string | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (prevLabel === null && nextLabel === null) return null;
  const btn = (label: string, dir: "prev" | "next") => (
    <TouchableOpacity
      key={dir}
      onPress={dir === "prev" ? onPrev : onNext}
      style={[
        styles.navBtn,
        dir === "next" && styles.navBtnNext,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
      accessibilityRole="button"
      accessibilityLabel={dir === "prev" ? `Previous: ${label}` : `Next: ${label}`}
      activeOpacity={0.7}
    >
      {dir === "prev" && (
        <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
      )}
      <View style={[styles.navTextWrap, dir === "next" && styles.alignEnd]}>
        <Text style={[styles.navHint, { color: theme.textSecondary }]}>
          {dir === "prev" ? "PREVIOUS" : "NEXT"}
        </Text>
        <Text style={[styles.navLabel, { color: theme.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {dir === "next" && (
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );
  return (
    <View style={styles.navRow}>
      {prevLabel !== null ? btn(prevLabel, "prev") : <View style={styles.flex} />}
      {nextLabel !== null ? btn(nextLabel, "next") : <View style={styles.flex} />}
    </View>
  );
}

/**
 * Shown after swiping past the last chapter of a plan day: whether the day
 * is done (or which chapters are still unopened), then back to the plan or
 * on to the next day.
 */
export function PlanDayEndCard({
  theme,
  planTitle,
  day,
  missing,
  nextReading,
  onOpenChapter,
  onBack,
  onContinue,
  padH,
}: {
  theme: Theme;
  planTitle: string;
  /** 0-based day index. */
  day: number;
  /** Chapters of the day not opened yet; null while loading. */
  missing: PlanChapter[] | null;
  /** The next day's reading, e.g. "Genesis 4–6"; null on the last day. */
  nextReading: string | null;
  onOpenChapter: (c: PlanChapter) => void;
  onBack: () => void;
  onContinue: () => void;
  padH: number;
}) {
  const done = missing !== null && missing.length === 0;
  return (
    <ScrollView
      contentContainerStyle={[styles.endWrap, { paddingHorizontal: padH }]}
    >
      <View
        style={[
          styles.endCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.endLabel, { color: theme.textSecondary }]}>
          {planTitle.toUpperCase()} · DAY {day + 1}
        </Text>
        {missing === null ? (
          <ActivityIndicator color={theme.textSecondary} />
        ) : done ? (
          <>
            <Ionicons name="checkmark-circle" size={40} color={GREEN} />
            <Text style={[styles.endTitle, { color: theme.text }]}>
              Day {day + 1} complete
            </Text>
            <Text style={[styles.endBody, { color: theme.textSecondary }]}>
              {nextReading
                ? "Well done. Come back tomorrow, or keep reading now."
                : "That was the last day. You've finished the plan!"}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.endTitle, { color: theme.text }]}>
              End of Day {day + 1}
            </Text>
            <Text style={[styles.endBody, { color: theme.textSecondary }]}>
              {missing.length === 1
                ? "One chapter hasn't been opened yet:"
                : `${missing.length} chapters haven't been opened yet:`}
            </Text>
            <View style={styles.chips}>
              {missing.map((c) => (
                <TouchableOpacity
                  key={`${c.bookId}-${c.chapter}`}
                  onPress={() => onOpenChapter(c)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`Read ${c.bookLabel} ${c.chapter}`}
                  activeOpacity={0.7}
                >
                  <Ionicons name="book-outline" size={13} color={theme.textSecondary} />
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    {c.bookLabel} {c.chapter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.endActions}>
          {nextReading && (
            <TouchableOpacity
              onPress={onContinue}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryText, { color: theme.primaryText }]}>
                Continue to Day {day + 2}
              </Text>
              <Text style={[styles.primarySub, { color: theme.primaryText }]}>
                {nextReading}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onBack}
            style={[styles.outlineBtn, { borderColor: theme.border }]}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineText, { color: theme.text }]}>
              Back to plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.endHint, { color: theme.textSecondary }]}>
        Swipe right to go back to the last chapter.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  alignEnd: { alignItems: "flex-end" },

  // Footer
  navRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  navBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navBtnNext: { justifyContent: "flex-end" },
  navTextWrap: { flexShrink: 1, minWidth: 0 },
  navHint: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  navLabel: { fontSize: 14, fontWeight: "600" },

  // Day end
  endWrap: { paddingTop: 24, paddingBottom: 48, gap: 12 },
  endCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  endLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  endTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  endBody: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  endHint: { fontSize: 12, textAlign: "center" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  endActions: { alignSelf: "stretch", gap: 10, marginTop: 4 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryText: { fontSize: 15, fontWeight: "700" },
  primarySub: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  outlineText: { fontSize: 15, fontWeight: "700" },
});
