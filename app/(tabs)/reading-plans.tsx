import { AppModal, PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  daysBehind,
  formatReading,
  getPlan,
  loadPlanProgress,
  nextDay,
  PlanChapter,
  planSchedule,
  PlanProgress,
  READING_PLANS,
  ReadingPlan,
  setDayComplete,
  startPlan,
  stopPlan,
} from "@/src/services/readingPlans";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { formatDateKey } from "@/src/utils/dateKey";
import {
  MODAL_MAX_WIDTH,
  pageScrollMarker,
  useIsDesktop,
  useListPaddingH,
  usePageScroll,
} from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReadingPlans() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const padH = useListPaddingH();
  // Phone / tablet web: the page scrolls, not an inner box (responsive.ts)
  const pageScroll = usePageScroll();
  const uid = auth.currentUser?.uid ?? "";
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();

  const [progress, setProgress] = useState<Record<string, PlanProgress>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(planParam ?? null);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      loadPlanProgress(uid)
        .then(setProgress)
        .catch((err) => console.warn("Failed to load reading plans:", err))
        .finally(() => setLoading(false));
    }, [uid]),
  );

  const openPlan = openId ? getPlan(openId) : undefined;

  async function handleStart(plan: ReadingPlan) {
    const p = await startPlan(uid, plan.id);
    setProgress((prev) => ({ ...prev, [plan.id]: p }));
    setOpenId(plan.id);
  }

  async function handleToggleDay(plan: ReadingPlan, day: number) {
    const p = progress[plan.id];
    if (!p || busyDay !== null) return;
    const done = !p.completed[day];
    setBusyDay(day);
    try {
      const readOn = await setDayComplete(uid, plan.id, day, done);
      setProgress((prev) => {
        const completed = { ...prev[plan.id].completed };
        if (readOn) completed[day] = readOn;
        else delete completed[day];
        return { ...prev, [plan.id]: { ...prev[plan.id], completed } };
      });
    } finally {
      setBusyDay(null);
    }
  }

  async function handleStop(plan: ReadingPlan) {
    await stopPlan(uid, plan.id);
    setProgress((prev) => {
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });
    setConfirmStop(false);
    setOpenId(null);
  }

  function openChapter(c: PlanChapter) {
    router.push(
      `/(tabs)/bible-browser?bookId=${c.bookId}&chapter=${c.chapter}`,
    );
  }

  const card = { backgroundColor: theme.surface, borderColor: theme.border };

  // ── Plan list ─────────────────────────────────────────────────────────────
  function renderList() {
    return (
      <View style={styles.stack}>
        {READING_PLANS.map((plan) => {
          const p = progress[plan.id];
          const done = p ? Object.keys(p.completed).length : 0;
          const next = p ? nextDay(plan, p) : 0;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.card, card]}
              onPress={() => (p ? setOpenId(plan.id) : handleStart(plan))}
              activeOpacity={0.8}
            >
              <View style={styles.cardHead}>
                <View
                  style={[styles.planIcon, { backgroundColor: theme.background }]}
                >
                  <Ionicons name={plan.icon} size={18} color={theme.text} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.planTitle, { color: theme.text }]}>
                    {plan.title}
                  </Text>
                  <Text
                    style={[styles.planDesc, { color: theme.textSecondary }]}
                  >
                    {plan.description}
                  </Text>
                </View>
              </View>

              {p ? (
                <>
                  <ProgressBar value={done / plan.days} />
                  <View style={styles.cardFoot}>
                    <Text
                      style={[styles.meta, { color: theme.textSecondary }]}
                    >
                      {next === null
                        ? "Plan complete 🎉"
                        : `Next: Day ${next + 1} · ${formatReading(planSchedule(plan.id)[next])}`}
                    </Text>
                    <Text style={[styles.metaStrong, { color: theme.text }]}>
                      {Math.round((done / plan.days) * 100)}%
                    </Text>
                  </View>
                </>
              ) : (
                <View
                  style={[styles.startBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.startText, { color: theme.primaryText }]}>
                    Start plan
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── One plan ──────────────────────────────────────────────────────────────
  function renderPlan(plan: ReadingPlan) {
    const p = progress[plan.id];
    if (!p) {
      // Opened via link but not started yet
      return (
        <View style={[styles.card, card]}>
          <Text style={[styles.planTitle, { color: theme.text }]}>
            {plan.title}
          </Text>
          <Text style={[styles.planDesc, { color: theme.textSecondary }]}>
            {plan.description}
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: theme.primary }]}
            onPress={() => handleStart(plan)}
            activeOpacity={0.85}
          >
            <Text style={[styles.startText, { color: theme.primaryText }]}>
              Start plan
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const schedule = planSchedule(plan.id);
    const done = Object.keys(p.completed).length;
    const next = nextDay(plan, p);
    const behind = daysBehind(plan, p);

    return (
      <View style={styles.stack}>
        {/* Summary */}
        <View style={[styles.card, card]}>
          <Text style={[styles.planTitle, { color: theme.text }]}>
            {plan.title}
          </Text>
          <ProgressBar value={done / plan.days} />
          <View style={styles.cardFoot}>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {done} of {plan.days} days read · started{" "}
              {formatDateKey(p.startedOn, { month: "short", day: "numeric" })}
            </Text>
            <Text
              style={[
                styles.metaStrong,
                { color: behind > 0 ? theme.textSecondary : "#4CAF50" },
              ]}
            >
              {next === null
                ? "Complete"
                : behind > 0
                  ? `${behind} day${behind === 1 ? "" : "s"} behind`
                  : "On track"}
            </Text>
          </View>
        </View>

        {/* Next reading */}
        {next !== null && (
          <View style={[styles.card, card]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              DAY {next + 1} · NEXT READING
            </Text>
            <View style={styles.chips}>
              {schedule[next].map((c) => (
                <TouchableOpacity
                  key={`${c.bookId}-${c.chapter}`}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  onPress={() => openChapter(c)}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel={`Read ${c.bookLabel} ${c.chapter}`}
                >
                  <Ionicons
                    name="book-outline"
                    size={13}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    {c.bookLabel} {c.chapter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: theme.primary }]}
              onPress={() => handleToggleDay(plan, next)}
              activeOpacity={0.85}
              disabled={busyDay !== null}
            >
              {busyDay === next ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Text style={[styles.startText, { color: theme.primaryText }]}>
                  Mark day {next + 1} as read
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* All days */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          ALL DAYS
        </Text>
        <View style={[styles.dayList, { borderColor: theme.border }]}>
          {schedule.map((chapters, day) => {
            const readOn = p.completed[day];
            return (
              <View
                key={day}
                style={[
                  styles.dayRow,
                  { backgroundColor: theme.surface },
                  day > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.check,
                    {
                      borderColor: readOn ? "#4CAF50" : theme.textSecondary,
                      backgroundColor: readOn ? "#4CAF50" : "transparent",
                    },
                  ]}
                  onPress={() => handleToggleDay(plan, day)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!readOn }}
                  accessibilityLabel={`Day ${day + 1}`}
                >
                  {readOn && <Ionicons name="checkmark" size={12} color="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.flex}
                  onPress={() => openChapter(chapters[0])}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.dayTitle, { color: theme.text }]}>
                    <Text style={{ color: theme.textSecondary }}>
                      Day {day + 1}
                      {"  "}
                    </Text>
                    {formatReading(chapters)}
                  </Text>
                  {readOn && (
                    <Text style={[styles.dayMeta, { color: "#4CAF50" }]}>
                      Read{" "}
                      {formatDateKey(readOn, { month: "short", day: "numeric" })}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={() => setConfirmStop(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.stopText, { color: theme.textSecondary }]}>
            Stop this plan
          </Text>
        </TouchableOpacity>

        <AppModal
          visible={confirmStop}
          onClose={() => setConfirmStop(false)}
          overlayStyle={styles.overlay}
          cardStyle={[styles.modalCard, card]}
        >
          <Text style={[styles.planTitle, { color: theme.text }]}>
            Stop {plan.title}?
          </Text>
          <Text style={[styles.planDesc, { color: theme.textSecondary }]}>
            Your progress on this plan will be cleared. You can start it again
            any time.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setConfirmStop(false)}
            >
              <Text style={[styles.modalBtnText, { color: theme.text }]}>
                Keep reading
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#e53e3e" }]}
              onPress={() => handleStop(plan)}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                Stop plan
              </Text>
            </TouchableOpacity>
          </View>
        </AppModal>
      </View>
    );
  }

  return (
    <SafeAreaView
      {...pageScrollMarker(pageScroll)}
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Reading Plans"
        subtitle="Read through Scripture, a little each day"
      />
      <ScrollView
        {...pageScrollMarker(pageScroll, "pageScrollList")}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padH },
          isDesktop && desktopPage.content,
        ]}
      >
        {/* Desktop: a readable column, left-aligned under the page title */}
        <View style={isDesktop && styles.desktopColumn}>
        {openPlan && (
          <TouchableOpacity
            style={styles.back}
            onPress={() => setOpenId(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>
              All plans
            </Text>
          </TouchableOpacity>
        )}
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loader} />
        ) : openPlan ? (
          renderPlan(openPlan)
        ) : (
          renderList()
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: theme.primary, width: `${Math.round(value * 100)}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 48 },
  desktopColumn: { width: "100%", maxWidth: 760 },
  flex: { flex: 1 },
  stack: { gap: 12 },
  loader: { marginTop: 40 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 14, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
  planDesc: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  meta: { fontSize: 12, flexShrink: 1 },
  metaStrong: { fontSize: 12, fontWeight: "700" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  startText: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  dayList: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitle: { fontSize: 14, lineHeight: 20 },
  dayMeta: { fontSize: 12, marginTop: 1 },
  stopBtn: { alignSelf: "center", paddingVertical: 12 },
  stopText: { fontSize: 13, textDecorationLine: "underline" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 13, fontWeight: "700" },
});
