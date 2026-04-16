import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  type CalendarVerse,
  loadGrowthCalendar,
  saveCalendarVerse,
} from "@/src/services/growthCalendar";
import { MODAL_MAX_WIDTH } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ROW_H = 50; // must match cell height in styles

function daysIn(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDow(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function buildGrid(y: number, m: number): (number | null)[][] {
  const cells: (number | null)[] = [
    ...Array(firstDow(y, m)).fill(null),
    ...Array.from({ length: daysIn(y, m) }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export interface PickedVerse {
  text: string;
  ref: string;
  target: "day" | "series";
  sessionId: string; // unique per pick — prevents stale params reopening modal
}

export function CalendarWidget({
  pickedVerse,
}: {
  pickedVerse?: PickedVerse | null;
}) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const today = new Date();
  const uid = auth.currentUser?.uid ?? "";

  // ── View navigation ──────────────────────────────────────────────────────
  const [viewDate, setViewDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const { year, month } = viewDate;
  const rows = buildGrid(year, month);

  // ── Selection state (drives visual rendering) ────────────────────────────
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  // ── Modal + field state ──────────────────────────────────────────────────
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [verseText, setVerseText] = useState("");
  const [verseRef, setVerseRef] = useState(""); // populated by Bible picker
  const [seriesTitle, setSeriesTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Saved verses — 1 per date, keyed "YYYY-MM-DD" ────────────────────────
  const [savedVerses, setSavedVerses] = useState<Record<string, CalendarVerse>>(
    {},
  );

  // Flag: modal was opened by the Bible picker (don't overwrite with saved verse)
  const isFromPickerR = useRef(false);

  // ── Load saved verses from Firestore on mount ─────────────────────────────
  useEffect(() => {
    if (!uid) return;
    loadGrowthCalendar(uid)
      .then((data) => setSavedVerses(data))
      .catch((err) => console.warn("Failed to load growth calendar:", err));
  }, [uid]);

  // ── Stable refs for PanResponder (no stale-closure issues) ───────────────
  const gridW = useRef(0);
  const isLpR = useRef(false);
  const timerR = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tDayR = useRef<number | null>(null);
  const rsR = useRef<number | null>(null); // rangeStart
  const reR = useRef<number | null>(null); // rangeEnd
  const fdR = useRef(firstDow(year, month));
  const dimR = useRef(daysIn(year, month));

  // Tracks which pick session has already been consumed (prevents stale params)
  const lastPickSessionR = useRef<string | null>(null);

  useEffect(() => {
    fdR.current = firstDow(year, month);
    dimR.current = daysIn(year, month);
    setSelectedDay(null);
    setRangeStart(null);
    setRangeEnd(null);
    rsR.current = null;
    reR.current = null;
  }, [year, month]);

  // ── Receive a verse picked from the Bible browser ────────────────────────
  useEffect(() => {
    if (!pickedVerse) return;
    if (pickedVerse.sessionId === lastPickSessionR.current) return; // already used
    lastPickSessionR.current = pickedVerse.sessionId;

    if (pickedVerse.target === "day") {
      isFromPickerR.current = true; // mark so pre-fill effect doesn't overwrite
      setVerseText(pickedVerse.text);
      setVerseRef(pickedVerse.ref);
      setShowDayModal(true);
    } else {
      setSeriesTitle(pickedVerse.text);
      setShowSeriesModal(true);
    }
  }, [pickedVerse]);

  // ── Pre-fill modal with existing saved verse when a date is tapped ────────
  // Skipped when the modal was opened by the Bible picker (flag prevents clash).
   
  useEffect(() => {
    if (!showDayModal || selectedDay === null) return;
    if (isFromPickerR.current) {
      isFromPickerR.current = false; // consume the flag
      return;
    }
    const key = dateKey(year, month, selectedDay);
    setVerseText(savedVerses[key]?.text ?? "");
    setVerseRef(savedVerses[key]?.ref ?? "");
  }, [showDayModal]);

  // Maps a touch position (relative to the grid View) → day number or null
  function dayAt(lx: number, ly: number): number | null {
    if (gridW.current === 0) return null;
    const col = Math.min(6, Math.max(0, Math.floor(lx / (gridW.current / 7))));
    const row = Math.max(0, Math.floor(ly / ROW_H));
    const day = row * 7 + col - fdR.current + 1;
    return day >= 1 && day <= dimR.current ? day : null;
  }

  // ── PanResponder (created once, refs keep handlers current) ─────────────
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => isLpR.current,

      onPanResponderGrant: (e) => {
        const day = dayAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        tDayR.current = day;
        isLpR.current = false;
        timerR.current = setTimeout(() => {
          if (tDayR.current === null) return;
          isLpR.current = true;
          rsR.current = tDayR.current;
          reR.current = null;
          setRangeStart(tDayR.current);
          setRangeEnd(null);
          setSelectedDay(null);
        }, 400);
      },

      onPanResponderMove: (e) => {
        if (!isLpR.current || rsR.current === null) return;
        const day = dayAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        if (day !== null && day >= rsR.current) {
          reR.current = day;
          setRangeEnd(day);
        }
      },

      onPanResponderRelease: () => {
        if (timerR.current) clearTimeout(timerR.current);
        if (!isLpR.current && tDayR.current !== null) {
          // Single tap
          setSelectedDay(tDayR.current);
          setRangeStart(null);
          setRangeEnd(null);
          setShowDayModal(true);
        } else if (isLpR.current && rsR.current !== null) {
          if (reR.current !== null && reR.current !== rsR.current) {
            setShowSeriesModal(true); // Long-press + drag → series
          } else {
            setRangeStart(null);
            setRangeEnd(null);
            rsR.current = null;
            reR.current = null;
          }
        }
        isLpR.current = false;
        tDayR.current = null;
      },

      onPanResponderTerminate: () => {
        if (timerR.current) clearTimeout(timerR.current);
        isLpR.current = false;
        setRangeStart(null);
        setRangeEnd(null);
        rsR.current = null;
        reR.current = null;
      },
    }),
  ).current;

  // ── Visual helpers ───────────────────────────────────────────────────────
  function isToday(d: number) {
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  // ── Cell colouring helpers ───────────────────────────────────────────────
  const hasRange =
    rangeStart !== null && rangeEnd !== null && rangeStart !== rangeEnd;

  function isRangeStart(d: number) {
    return hasRange && d === rangeStart;
  }
  function isRangeMid(d: number) {
    return (
      hasRange &&
      rangeStart !== null &&
      rangeEnd !== null &&
      d > rangeStart &&
      d < rangeEnd
    );
  }
  function isRangeEnd(d: number) {
    return hasRange && d === rangeEnd;
  }

  // True when a date has a saved verse and is NOT in an active state
  // (active = selected / today / range endpoint — those keep the solid fill)
  function hasSavedVerseOnly(d: number): boolean {
    return (
      !!savedVerses[dateKey(year, month, d)] &&
      d !== selectedDay &&
      !isRangeStart(d) &&
      !isRangeEnd(d) &&
      !isToday(d)
    );
  }

  // Circle background — middle range days have no circle (strip handles colouring)
  function cellBg(day: number): string | undefined {
    if (day === selectedDay) return theme.primary;
    if (isRangeStart(day)) return theme.primary;
    if (isRangeEnd(day)) return theme.primary;
    if (isToday(day)) return theme.primary;
    return undefined; // saved-verse-only & mid-range days: transparent, no fill
  }

  // Text colour — mid-range days sit on the tinted strip, use normal text
  function cellTextColor(day: number): string {
    if (isRangeMid(day)) return theme.text;
    if (hasSavedVerseOnly(day)) return theme.primary; // matches the border
    return day === selectedDay ||
      isRangeStart(day) ||
      isRangeEnd(day) ||
      isToday(day)
      ? theme.primaryText
      : theme.text;
  }

  // ── Formatting ───────────────────────────────────────────────────────────
  function fmtDay(d: number) {
    return new Date(year, month, d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }
  function fmtRange() {
    return rangeStart && rangeEnd
      ? `${fmtDay(rangeStart)} → ${fmtDay(rangeEnd)}`
      : "";
  }

  // ── Date key helper — uniquely identifies a calendar day ─────────────────
  function dateKey(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function prevMonth() {
    setViewDate(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }
  function nextMonth() {
    setViewDate(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  // ── Open Bible picker ────────────────────────────────────────────────────
  function handlePickFromBible(target: "day" | "series") {
    // Close the modal while the user browses — state (selectedDay / range) is
    // preserved because the Growth tab stays mounted in the background.
    if (target === "day") setShowDayModal(false);
    else setShowSeriesModal(false);

    router.push({
      pathname: "/(tabs)/bible-browser",
      params: { pickMode: "verse", pickTarget: target },
    });
  }

  // ── Save handlers ─────────────────────────────────────────────────────────
  async function handleSaveVerse() {
    if (!verseText.trim() || selectedDay === null || !uid) return;
    setSaving(true);
    const key = dateKey(year, month, selectedDay);
    const text = verseText.trim();
    const ref = verseRef.trim();
    try {
      // Persist to Firestore (upsert — enforces 1 verse per date)
      await saveCalendarVerse(uid, key, text, ref);
      // Update local state to reflect immediately without a re-fetch
      setSavedVerses((prev) => ({
        ...prev,
        [key]: { dateKey: key, text, ref, updatedAt: Date.now() },
      }));
    } catch (err) {
      console.warn("Failed to save calendar verse:", err);
    } finally {
      setSaving(false);
      setShowDayModal(false);
      setVerseText("");
      setVerseRef("");
      setSelectedDay(null);
    }
  }
  async function handleSaveSeries() {
    setSaving(true);
    // TODO: persist to Firestore
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    setShowSeriesModal(false);
    setSeriesTitle("");
    setRangeStart(null);
    setRangeEnd(null);
    rsR.current = null;
    reR.current = null;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Calendar card ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Month header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={prevMonth}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week labels */}
        <View style={styles.dayLabelsRow}>
          {DAY_LABELS.map((l) => (
            <Text
              key={l}
              style={[styles.dayLabel, { color: theme.textSecondary }]}
            >
              {l}
            </Text>
          ))}
        </View>

        {/* Date grid — PanResponder lives here */}
        <View
          {...pan.panHandlers}
          onLayout={(e) => {
            gridW.current = e.nativeEvent.layout.width;
          }}
        >
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((day, ci) =>
                day === null ? (
                  <View key={ci} style={styles.cell} />
                ) : (
                  <View key={ci} style={styles.cell}>
                    {/* ── Oblong range strips (drawn behind the circle) ── */}
                    {isRangeStart(day) && (
                      <View
                        style={[
                          styles.stripRight,
                          { backgroundColor: theme.primary + "40" },
                        ]}
                      />
                    )}
                    {isRangeMid(day) && (
                      <View
                        style={[
                          styles.stripFull,
                          { backgroundColor: theme.primary + "40" },
                        ]}
                      />
                    )}
                    {isRangeEnd(day) && (
                      <View
                        style={[
                          styles.stripLeft,
                          { backgroundColor: theme.primary + "40" },
                        ]}
                      />
                    )}

                    {/* ── Day circle (sits on top of strip) ── */}
                    <View
                      style={[
                        styles.dayCircle,
                        { backgroundColor: cellBg(day) },
                        hasSavedVerseOnly(day) && {
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.dayText, { color: cellTextColor(day) }]}
                      >
                        {day}
                      </Text>
                    </View>

                    {/* Dot indicator — shown below the circle when a verse is saved */}
                    {savedVerses[dateKey(year, month, day)] && (
                      <View
                        style={[
                          styles.savedDot,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </View>
                ),
              )}
            </View>
          ))}
        </View>

        {/* Hint */}
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Tap a date · Hold &amp; drag to select a range
        </Text>
      </View>

      {/* ── Single-day modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showDayModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDayModal(false);
          setSelectedDay(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowDayModal(false);
            setSelectedDay(null);
            setVerseText("");
          }}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.modalLabel, { color: theme.textSecondary }]}
                >
                  {selectedDay ? fmtDay(selectedDay) : ""}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Save your Verse of the Day
                </Text>
                <TouchableOpacity
                  style={[
                    styles.versePicker,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  onPress={() => handlePickFromBible("day")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      verseText
                        ? styles.versePickerValue
                        : styles.versePickerPlaceholder,
                      { color: verseText ? theme.text : theme.textSecondary },
                    ]}
                    numberOfLines={4}
                  >
                    {verseText || "Tap to pick a verse from the Bible…"}
                  </Text>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.versePickerIcon}
                  />
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowDayModal(false);
                      setSelectedDay(null);
                      setVerseText("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cancelText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveVerse}
                    activeOpacity={0.8}
                    disabled={saving || !verseText.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primaryText}
                      />
                    ) : (
                      <Text
                        style={[styles.saveText, { color: theme.primaryText }]}
                      >
                        Save
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Series (range) modal ──────────────────────────────────────────── */}
      <Modal
        visible={showSeriesModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSeriesModal(false);
          setRangeStart(null);
          setRangeEnd(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowSeriesModal(false);
            setRangeStart(null);
            setRangeEnd(null);
            setSeriesTitle("");
          }}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.modalLabel, { color: theme.textSecondary }]}
                >
                  {fmtRange()}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Are you in for a good series?
                </Text>
                <TouchableOpacity
                  style={[
                    styles.versePicker,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  onPress={() => handlePickFromBible("series")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      seriesTitle
                        ? styles.versePickerValue
                        : styles.versePickerPlaceholder,
                      { color: seriesTitle ? theme.text : theme.textSecondary },
                    ]}
                    numberOfLines={4}
                  >
                    {seriesTitle || "Tap to pick a verse from the Bible…"}
                  </Text>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.versePickerIcon}
                  />
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowSeriesModal(false);
                      setRangeStart(null);
                      setRangeEnd(null);
                      setSeriesTitle("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cancelText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveSeries}
                    activeOpacity={0.8}
                    disabled={saving || !seriesTitle.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primaryText}
                      />
                    ) : (
                      <Text
                        style={[styles.saveText, { color: theme.primaryText }]}
                      >
                        Save
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  navBtn: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.55,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    height: ROW_H, // explicit height so absolute strips align correctly
    alignItems: "center",
    justifyContent: "center",
  },
  // Range oblong strips — positioned absolute, centered vertically in the cell
  stripRight: {
    position: "absolute",
    left: "50%",
    right: 0,
    top: (ROW_H - 32) / 2, // vertically centres the 32 px strip in ROW_H
    bottom: (ROW_H - 32) / 2,
  },
  stripFull: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (ROW_H - 32) / 2,
    bottom: (ROW_H - 32) / 2,
  },
  stripLeft: {
    position: "absolute",
    left: 0,
    right: "50%",
    top: (ROW_H - 32) / 2,
    bottom: (ROW_H - 32) / 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 10,
    opacity: 0.45,
    letterSpacing: 0.3,
  },
  // ── Modal shared ──────────────────────────────────────────
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
  modalLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.55,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    maxHeight: 140,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  // ── Verse picker (replaces TextInput) ────────────────────────────────────
  versePicker: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  versePickerPlaceholder: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.5,
    fontStyle: "italic",
  },
  versePickerValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  versePickerIcon: {
    marginTop: 2,
  },
  // ── Saved-verse dot indicator — sits below the date circle ───────────────
  // ROW_H=50, circle=32px centered → circle bottom = 9px from cell bottom.
  // bottom:2 → dot top = 50-2-5 = 43px from top → 2px gap below the circle.
  savedDot: {
    position: "absolute",
    bottom: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
