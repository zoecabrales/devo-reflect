import { AppModal, BentoGrid, PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  chapterKey,
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
import { dateKeyOf, formatDateKey } from "@/src/utils/dateKey";
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
  Platform,
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
  // Web (any width): bento grid layout; BentoGrid drops to one column on
  // phones. The native app keeps the simple stacked list.
  const gridLayout = Platform.OS === "web";
  const uid = auth.currentUser?.uid ?? "";
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();

  const [progress, setProgress] = useState<Record<string, PlanProgress>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(planParam ?? null);
  // Coming back from the Bible with ?plan= reopens that plan, even if this
  // screen stayed mounted. State derived from params, updated during render.
  const [lastPlanParam, setLastPlanParam] = useState(planParam);
  if (lastPlanParam !== planParam) {
    setLastPlanParam(planParam);
    if (planParam) setOpenId(planParam);
  }
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
        const chaptersRead = { ...prev[plan.id].chaptersRead };
        if (readOn) completed[day] = readOn;
        else {
          delete completed[day];
          for (const c of planSchedule(plan.id)[day]) {
            delete chaptersRead[chapterKey(c.bookId, c.chapter)];
          }
        }
        return {
          ...prev,
          [plan.id]: { ...prev[plan.id], completed, chaptersRead },
        };
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

  function openChapter(plan: ReadingPlan, c: PlanChapter) {
    const returnTo = encodeURIComponent(
      `/(tabs)/reading-plans?plan=${plan.id}`,
    );
    router.push(
      `/(tabs)/bible-browser?bookId=${c.bookId}&chapter=${c.chapter}&returnTo=${returnTo}`,
    );
  }

  // Phones and tablets: tighter cards and type
  const compact = !isDesktop;
  const surface = { backgroundColor: theme.surface, borderColor: theme.border };
  const card = [surface, compact && styles.cardCompact];
  const active = READING_PLANS.filter((plan) => progress[plan.id]);

  // ── Shared pieces ─────────────────────────────────────────────────────────
  /** Next day's chapters (ticked once opened) and the mark-as-read button. */
  function renderNextReading(plan: ReadingPlan, p: PlanProgress, next: number) {
    const schedule = planSchedule(plan.id);
    return (
      <>
        <View style={styles.chips}>
          {schedule[next].map((c) => {
            const read = !!p.chaptersRead[chapterKey(c.bookId, c.chapter)];
            return (
              <TouchableOpacity
                key={`${c.bookId}-${c.chapter}`}
                style={[
                  styles.chip, compact && styles.chipCompact,
                  {
                    borderColor: read ? GREEN : theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                onPress={() => openChapter(plan, c)}
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel={`Read ${c.bookLabel} ${c.chapter}${read ? " (read)" : ""}`}
              >
                <Ionicons
                  name={read ? "checkmark-circle" : "book-outline"}
                  size={13}
                  color={read ? GREEN : theme.textSecondary}
                />
                <Text style={[styles.chipText, compact && styles.chipTextCompact, { color: theme.text }]}>
                  {c.bookLabel} {c.chapter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          Chapters you open in the Bible are ticked off, and the day is marked
          read once you&apos;ve opened them all.
        </Text>
        <View style={styles.grow} />
        <TouchableOpacity
          style={[styles.startBtn, compact && styles.startBtnCompact, { backgroundColor: theme.primary }]}
          onPress={() => handleToggleDay(plan, next)}
          activeOpacity={0.85}
          disabled={busyDay !== null}
        >
          {busyDay === next ? (
            <ActivityIndicator size="small" color={theme.primaryText} />
          ) : (
            <Text style={[styles.startText, compact && styles.startTextCompact, { color: theme.primaryText }]}>
              Mark day {next + 1} as read
            </Text>
          )}
        </TouchableOpacity>
      </>
    );
  }

  /** A plan's card in the list: progress if started, otherwise Start. */
  function renderPlanCard(plan: ReadingPlan, tile = false) {
    const p = progress[plan.id];
    const done = p ? Object.keys(p.completed).length : 0;
    const next = p ? nextDay(plan, p) : 0;
    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.card, card, tile && desktopPage.tileFill]}
        onPress={() => (p ? setOpenId(plan.id) : handleStart(plan))}
        activeOpacity={0.8}
      >
        <View style={styles.cardHead}>
          <View style={[styles.planIcon, compact && styles.planIconCompact, { backgroundColor: theme.background }]}>
            <Ionicons name={plan.icon} size={18} color={theme.text} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.planTitle, compact && styles.planTitleCompact, { color: theme.text }]}>
              {plan.title}
            </Text>
            <Text style={[styles.planDesc, compact && styles.planDescCompact, { color: theme.textSecondary }]}>
              {plan.description}
            </Text>
          </View>
        </View>

        {/* Tiles: push the footer to the bottom so a row lines up */}
        {tile && <View style={styles.grow} />}
        {p ? (
          <>
            <ProgressBar value={done / plan.days} />
            <View style={styles.cardFoot}>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
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
          <View style={[styles.startBtn, compact && styles.startBtnCompact, { backgroundColor: theme.primary }]}>
            <Text style={[styles.startText, compact && styles.startTextCompact, { color: theme.primaryText }]}>
              Start plan
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ── Plan list ─────────────────────────────────────────────────────────────
  function renderList() {
    if (!gridLayout) {
      return (
        <View style={styles.stack}>
          {READING_PLANS.map((plan) => renderPlanCard(plan))}
        </View>
      );
    }

    // Web: a "continue reading" tile and stats above the plans grid
    const current = active.find((plan) => nextDay(plan, progress[plan.id]) !== null);
    const daysRead = active.reduce(
      (n, plan) => n + Object.keys(progress[plan.id].completed).length,
      0,
    );
    const topTiles = [
      ...(current ? ["continue"] : []),
      ...(active.length > 0 ? ["stats"] : []),
    ];

    return (
      <View style={compact ? styles.sectionsCompact : styles.sections}>
        {topTiles.length > 0 && (
          <BentoGrid
            gap={compact ? 10 : 14}
            data={topTiles}
            keyExtractor={(k) => k}
            spanFor={(k) => (k === "continue" ? 2 : 1)}
            renderItem={(k) =>
              k === "continue" && current
                ? renderContinue(current)
                : (
                  <View style={[styles.card, card, desktopPage.tileFill]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                      YOUR READING
                    </Text>
                    <Stat
                      icon="flame-outline"
                      value={readingStreak(progress)}
                      label="Day streak"
                    />
                    <Stat
                      icon="checkmark-done-outline"
                      value={daysRead}
                      label={daysRead === 1 ? "Day read" : "Days read"}
                    />
                    <Stat
                      icon="library-outline"
                      value={active.length}
                      label={active.length === 1 ? "Active plan" : "Active plans"}
                    />
                  </View>
                )
            }
          />
        )}

        <View style={styles.stack}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {active.length > 0 ? "ALL PLANS" : "CHOOSE A PLAN"}
          </Text>
          <BentoGrid
            gap={compact ? 10 : 14}
            data={READING_PLANS}
            keyExtractor={(plan) => plan.id}
            spanFor={() => 1}
            minColumnWidth={240}
            renderItem={(plan) => renderPlanCard(plan, true)}
          />
        </View>
      </View>
    );
  }

  /** Web list: the next reading in your first unfinished plan. */
  function renderContinue(plan: ReadingPlan) {
    const p = progress[plan.id];
    const next = nextDay(plan, p)!;
    const done = Object.keys(p.completed).length;
    return (
      <View style={[styles.card, card, desktopPage.tileFill]}>
        <View style={styles.cardFoot}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            CONTINUE · DAY {next + 1} OF {plan.days}
          </Text>
          <TouchableOpacity onPress={() => setOpenId(plan.id)} hitSlop={8}>
            <Text style={[styles.metaStrong, { color: theme.text }]}>
              Open plan ›
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.heroTitle, compact && styles.heroTitleCompact, { color: theme.text }]}>
          {formatReading(planSchedule(plan.id)[next])}
        </Text>
        <View style={styles.heroProgress}>
          <View style={styles.flex}>
            <ProgressBar value={done / plan.days} />
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {plan.title} · {Math.round((done / plan.days) * 100)}%
          </Text>
        </View>
        {renderNextReading(plan, p, next)}
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
          <Text style={[styles.planTitle, compact && styles.planTitleCompact, { color: theme.text }]}>
            {plan.title}
          </Text>
          <Text style={[styles.planDesc, compact && styles.planDescCompact, { color: theme.textSecondary }]}>
            {plan.description}
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, compact && styles.startBtnCompact, { backgroundColor: theme.primary }]}
            onPress={() => handleStart(plan)}
            activeOpacity={0.85}
          >
            <Text style={[styles.startText, compact && styles.startTextCompact, { color: theme.primaryText }]}>
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

    const summary = (
      <View style={[styles.card, card, gridLayout && desktopPage.tileFill]}>
        <View style={styles.cardHead}>
          <View style={[styles.planIcon, compact && styles.planIconCompact, { backgroundColor: theme.background }]}>
            <Ionicons name={plan.icon} size={18} color={theme.text} />
          </View>
          <Text style={[styles.planTitle, compact && styles.planTitleCompact, styles.flex, { color: theme.text }]}>
            {plan.title}
          </Text>
        </View>
        {gridLayout && (
          <Text style={[styles.bigNumber, compact && styles.bigNumberCompact, { color: theme.text }]}>
            {Math.round((done / plan.days) * 100)}%
          </Text>
        )}
        {gridLayout && <View style={styles.grow} />}
        <ProgressBar value={done / plan.days} />
        <View style={styles.cardFoot}>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {done} of {plan.days} days read · started{" "}
            {formatDateKey(p.startedOn, { month: "short", day: "numeric" })}
          </Text>
          <Text
            style={[
              styles.metaStrong,
              { color: behind > 0 ? theme.textSecondary : GREEN },
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
    );

    const nextCard =
      next === null ? null : (
        <View style={[styles.card, card, gridLayout && desktopPage.tileFill]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            DAY {next + 1} · NEXT READING
          </Text>
          {gridLayout && (
            <Text style={[styles.heroTitle, compact && styles.heroTitleCompact, { color: theme.text }]}>
              {formatReading(schedule[next])}
            </Text>
          )}
          {renderNextReading(plan, p, next)}
        </View>
      );

    function renderDay(chapters: PlanChapter[], day: number, tile: boolean) {
      const readOn = p.completed[day];
      return (
        <View
          key={day}
          style={
            tile
              ? [
                  styles.dayTile, compact && styles.dayTileCompact,
                  {
                    backgroundColor: theme.surface,
                    borderColor: readOn ? GREEN : theme.border,
                  },
                  day === next && { borderColor: theme.text },
                ]
              : [
                  styles.dayRow,
                  { backgroundColor: theme.surface },
                  day > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                  },
                ]
          }
        >
          <TouchableOpacity
            style={[
              styles.check,
              {
                borderColor: readOn ? GREEN : theme.textSecondary,
                backgroundColor: readOn ? GREEN : "transparent",
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
            onPress={() => openChapter(plan, chapters[0])}
            activeOpacity={0.6}
          >
            {tile ? (
              <>
                <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                  DAY {day + 1}
                  {readOn
                    ? ` · READ ${formatDateKey(readOn, { month: "short", day: "numeric" }).toUpperCase()}`
                    : day === next
                      ? " · NEXT"
                      : ""}
                </Text>
                <Text
                  style={[styles.dayTitle, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {formatReading(chapters)}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.dayTitle, { color: theme.text }]}>
                  <Text style={{ color: theme.textSecondary }}>
                    Day {day + 1}
                    {"  "}
                  </Text>
                  {formatReading(chapters)}
                </Text>
                {readOn && (
                  <Text style={[styles.dayMeta, { color: GREEN }]}>
                    Read{" "}
                    {formatDateKey(readOn, { month: "short", day: "numeric" })}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={gridLayout ? compact ? styles.sectionsCompact : styles.sections : styles.stack}>
        {gridLayout ? (
          /* Web: summary beside the next reading */
          <BentoGrid
            gap={compact ? 10 : 14}
            data={nextCard ? ["summary", "next"] : ["summary"]}
            keyExtractor={(k) => k}
            spanFor={(k) => (k === "next" ? 2 : 1)}
            renderItem={(k) => (k === "next" ? nextCard : summary)}
          />
        ) : (
          <>
            {summary}
            {nextCard}
          </>
        )}

        <View style={styles.stack}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            ALL DAYS
          </Text>
          {gridLayout ? (
            /* Web: days as a grid of small tiles */
            <BentoGrid
              data={schedule.map((chapters, day) => ({ chapters, day }))}
              keyExtractor={({ day }) => String(day)}
              spanFor={() => 1}
              gap={compact ? 8 : 10}
              minColumnWidth={210}
              maxColumns={4}
              renderItem={({ chapters, day }) => renderDay(chapters, day, true)}
            />
          ) : (
            <View style={[styles.dayList, { borderColor: theme.border }]}>
              {schedule.map((chapters, day) => renderDay(chapters, day, false))}
            </View>
          )}
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
          cardStyle={[styles.modalCard, surface]}
        >
          <Text style={[styles.planTitle, compact && styles.planTitleCompact, { color: theme.text }]}>
            Stop {plan.title}?
          </Text>
          <Text style={[styles.planDesc, compact && styles.planDescCompact, { color: theme.textSecondary }]}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = "#4CAF50";

/** Consecutive days, ending today or yesterday, with any plan reading. */
function readingStreak(progress: Record<string, PlanProgress>): number {
  const dates = new Set<string>();
  for (const p of Object.values(progress)) {
    Object.values(p.completed).forEach((d) => dates.add(d));
    Object.values(p.chaptersRead).forEach((d) => dates.add(d));
  }
  const day = new Date();
  if (!dates.has(dateKeyOf(day.getTime()))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (dates.has(dateKeyOf(day.getTime()))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.meta, { color: theme.textSecondary }]}>{label}</Text>
    </View>
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
  // ── Phones and tablets (compact) ──
  cardCompact: { padding: 12, gap: 8, borderRadius: 12 },
  sectionsCompact: { gap: 20 },
  heroTitleCompact: { fontSize: 19 },
  bigNumberCompact: { fontSize: 30, lineHeight: 36 },
  planTitleCompact: { fontSize: 15 },
  planDescCompact: { fontSize: 12, lineHeight: 17 },
  dayTileCompact: { paddingHorizontal: 11, paddingVertical: 9, gap: 10, borderRadius: 10 },
  chipCompact: { paddingHorizontal: 10, paddingVertical: 5 },
  chipTextCompact: { fontSize: 12 },
  startBtnCompact: { paddingVertical: 9 },
  startTextCompact: { fontSize: 13 },
  planIconCompact: { width: 30, height: 30, borderRadius: 8 },

  container: { flex: 1 },
  content: { paddingBottom: 48 },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  stack: { gap: 12 },
  sections: { gap: 28 },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
  heroProgress: { flexDirection: "row", alignItems: "center", gap: 12 },
  bigNumber: {
    fontSize: 40,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 48,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 10 },
  statValue: {
    fontSize: 22,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    minWidth: 28,
  },
  dayTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
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
