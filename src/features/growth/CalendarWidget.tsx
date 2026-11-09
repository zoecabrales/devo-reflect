import { AppModal } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { BookmarkedVerse, loadBookmarks } from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { JournalEntry, loadEntries } from "@/src/services/journal";
import { dateKeyOf } from "@/src/utils/dateKey";
import { MODAL_MAX_WIDTH } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
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
const CIRCLE_D = 32; // day circle diameter — strips are centred around this

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


/**
 * Month calendar of journal entries and bookmarks.
 * `inline` (desktop dashboard): the selected day's details show in a panel
 * below the calendar instead of a modal, with today selected initially.
 */
export function CalendarWidget({ inline = false }: { inline?: boolean } = {}) {
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

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<number | null>(
    inline ? today.getDate() : null,
  );
  const [showModal, setShowModal] = useState(false);

  // ── Journal data — keyed "YYYY-MM-DD" ────────────────────────────────────
  const [journalByDate, setJournalByDate] = useState<
    Record<string, JournalEntry[]>
  >({});

  // ── Bookmark data — keyed "YYYY-MM-DD" ───────────────────────────────────
  const [bookmarksByDate, setBookmarksByDate] = useState<
    Record<string, BookmarkedVerse[]>
  >({});

  // ── Reload both journal entries and bookmarks whenever the Growth tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      Promise.all([loadEntries(uid), loadBookmarks(uid)])
        .then(([entries, bookmarks]) => {
          // Build journal date map
          const jMap: Record<string, JournalEntry[]> = {};
          for (const entry of entries) {
            // The calendar day it was added for, else the day it was written
            const key = entry.forDate ?? dateKeyOf(entry.createdAt);
            if (!jMap[key]) jMap[key] = [];
            jMap[key].push(entry);
          }
          setJournalByDate(jMap);

          // Build bookmark date map
          const bMap: Record<string, BookmarkedVerse[]> = {};
          for (const bm of bookmarks) {
            const key = bm.forDate ?? dateKeyOf(bm.createdAt);
            if (!bMap[key]) bMap[key] = [];
            bMap[key].push(bm);
          }
          setBookmarksByDate(bMap);
        })
        .catch((err) => console.warn("Failed to load calendar data:", err));
    }, [uid]),
  );

  // ── Visual helpers ───────────────────────────────────────────────────────
  function isToday(d: number) {
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  // ── Date key helper — uniquely identifies a calendar day ─────────────────
  function dateKey(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // True when the date has at least one journal entry
  function hasJournalEntries(d: number): boolean {
    return (journalByDate[dateKey(year, month, d)]?.length ?? 0) > 0;
  }

  // True when the date has at least one bookmark
  function hasBookmarks(d: number): boolean {
    return (bookmarksByDate[dateKey(year, month, d)]?.length ?? 0) > 0;
  }

  // True when a date has content (journal OR bookmark) but is NOT selected/today
  function hasContentOnly(d: number): boolean {
    return (
      (hasJournalEntries(d) || hasBookmarks(d)) &&
      d !== selectedDay &&
      !isToday(d)
    );
  }

  // Circle background
  function cellBg(day: number): string | undefined {
    if (day === selectedDay) return theme.primary;
    if (isToday(day)) return theme.primary;
    return undefined;
  }

  // Text colour
  function cellTextColor(day: number): string {
    if (hasContentOnly(day)) return theme.primary; // matches the border
    return day === selectedDay || isToday(day) ? theme.primaryText : theme.text;
  }

  // ── Formatting ───────────────────────────────────────────────────────────
  function fmtDay(d: number) {
    return new Date(year, month, d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  // Changing month clears the selected day
  function prevMonth() {
    setSelectedDay(null);
    setViewDate(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }
  function nextMonth() {
    setSelectedDay(null);
    setViewDate(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  // ── Day tap ──────────────────────────────────────────────────────────────
  function handleDayPress(day: number) {
    setSelectedDay(day);
    if (!inline) setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedDay(null);
  }

  /** Before navigating away from a day's details (inline keeps the selection). */
  function leaveDetails() {
    if (!inline) closeModal();
  }

  // Content for the currently selected date
  const selectedKey = selectedDay ? dateKey(year, month, selectedDay) : null;
  // Future days can only have a verse planned, not a journal entry
  const selectedIsFuture =
    !!selectedKey &&
    selectedKey > dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedJournalEntries = selectedKey
    ? (journalByDate[selectedKey] ?? [])
    : [];
  const selectedBookmarks = selectedKey
    ? (bookmarksByDate[selectedKey] ?? [])
    : [];
  const dateHasJournal = selectedJournalEntries.length > 0;
  const dateHasBookmark = selectedBookmarks.length > 0;

  // Selected day's entries / bookmarks, or add-actions for an empty day.
  // Shown in the modal (mobile) or the inline details panel (desktop).
  const dayBody = (
    <>
      {/* ── Action rows ─────────────────────────────────────── */}
      {!dateHasJournal && !dateHasBookmark ? (
        /* Empty date — offer to add content for this day */
        <>
          {!selectedIsFuture && (
            <TouchableOpacity
              style={[
                styles.actionRow,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              onPress={() => {
                leaveDetails();
                router.push({
                  pathname: "/(tabs)/journal-compose",
                  params: { forDate: selectedKey ?? undefined },
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="book-outline"
                size={16}
                color={theme.primary}
              />
              <Text
                style={[styles.actionRowText, { color: theme.text }]}
              >
                Add a Journal
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionRow,
              {
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            onPress={() => {
              leaveDetails();
              router.push({
                pathname: "/(tabs)/bible-browser",
                params: {
                  forDate: selectedKey ?? undefined,
                  // New id per tap, so re-opening for the same day re-arms it
                  forDateId: Date.now().toString(),
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={selectedIsFuture ? "calendar-outline" : "bookmark-outline"}
              size={16}
              color={theme.primary}
            />
            <Text
              style={[styles.actionRowText, { color: theme.text }]}
            >
              {selectedIsFuture ? "Plan a Verse" : "Bookmark a Verse"}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </>
      ) : (
        /* Populated date — show entries filtered to this date */
        <ScrollView
          style={styles.contentList}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Journal entries ── */}
          {dateHasJournal && (
            <>
              <Text
                style={[
                  styles.sectionSubLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Journal
              </Text>
              {selectedJournalEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.entryCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      borderLeftColor: theme.primary,
                    },
                  ]}
                  onPress={() => {
                    leaveDetails();
                    router.push({
                      pathname: "/(tabs)/journal-compose",
                      params: { id: entry.id },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.entryTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {entry.title ||
                      entry.observation.split("\n")[0] ||
                      "Untitled"}
                  </Text>
                  {entry.scripture.length > 0 && (
                    <Text
                      style={[
                        styles.entryRef,
                        { color: theme.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.scripture[0].ref}
                      {entry.scripture.length > 1
                        ? ` +${entry.scripture.length - 1} more`
                        : ""}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ── Bookmarks ── */}
          {dateHasBookmark && (
            <>
              <Text
                style={[
                  styles.sectionSubLabel,
                  {
                    color: theme.textSecondary,
                    marginTop: dateHasJournal ? 12 : 0,
                  },
                ]}
              >
                Bookmarks
              </Text>
              {selectedBookmarks.map((bm) => (
                <View
                  key={bm.id}
                  style={[
                    styles.entryCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      borderLeftColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.entryRef,
                      { color: theme.primary },
                    ]}
                  >
                    {bm.bookLabel} {bm.chapter}:{bm.verse} ·{" "}
                    {bm.version}
                  </Text>
                  <Text
                    style={[styles.entryTitle, { color: theme.text }]}
                  >
                    {bm.text}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </>
  );

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

        {/* Date grid — each cell is individually tappable */}
        <View>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((day, ci) =>
                day === null ? (
                  <View key={ci} style={styles.cell} />
                ) : (
                  <TouchableOpacity
                    key={ci}
                    style={styles.cell}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
                  >
                    {/* ── Day circle ── */}
                    <View
                      style={[
                        styles.dayCircle,
                        { backgroundColor: cellBg(day) },
                        hasContentOnly(day) && {
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

                    {/* Dot — shown when date has journal entries or bookmarks */}
                    {(hasJournalEntries(day) || hasBookmarks(day)) && (
                      <View
                        style={[
                          styles.savedDot,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                ),
              )}
            </View>
          ))}
        </View>

        {/* Hint */}
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {inline
            ? "Select a date to see what you saved that day"
            : "Tap a date to view or add journal entries"}
        </Text>
      </View>

      {/* ── Inline day details (desktop dashboard) ── */}
      {inline && (
        <View
          style={[
            styles.card,
            styles.detailsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {selectedDay ? (
            <>
              <Text
                style={[styles.modalLabel, { color: theme.textSecondary }]}
              >
                {fmtDay(selectedDay)}
              </Text>
              {dayBody}
            </>
          ) : (
            <Text style={[styles.hint, styles.detailsEmpty, { color: theme.textSecondary }]}>
              Select a date to see its journal entries and bookmarks
            </Text>
          )}
        </View>
      )}

      {/* ── Journal entries modal ─────────────────────────────────────────── */}
      <AppModal
        visible={!inline && showModal}
        onClose={closeModal}
        overlayStyle={styles.overlay}
        cardStyle={[
          styles.modalCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text
          style={[styles.modalLabel, { color: theme.textSecondary }]}
        >
          {selectedDay ? fmtDay(selectedDay) : ""}
        </Text>
        {dayBody}

        {/* ── Close ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.closeBtn, { borderColor: theme.border }]}
          onPress={closeModal}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.closeBtnText,
              { color: theme.textSecondary },
            ]}
          >
            Close
          </Text>
        </TouchableOpacity>
      </AppModal>
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
    padding: 4,
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
    fontSize: 11,
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
    height: ROW_H,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: CIRCLE_D,
    height: CIRCLE_D,
    borderRadius: CIRCLE_D / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    opacity: 0.45,
    letterSpacing: 0.3,
  },
  // ── Dot indicator — sits below the date circle ───────────────────────────
  savedDot: {
    position: "absolute",
    bottom: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // ── Inline details panel (desktop) ───────────────────────────────────────
  detailsCard: {
    gap: 12,
  },
  detailsEmpty: {
    marginTop: 0,
    paddingVertical: 12,
  },
  // ── Modal ────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.55,
  },
  // ── Populated-date content list ──────────────────────────────────────────
  contentList: {
    maxHeight: 420,
  },
  sectionSubLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 6,
  },
  entryCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 4,
  },
  entryTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  entryRef: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // ── Action rows ──────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  // ── Close button ─────────────────────────────────────────────────────────
  closeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
});
