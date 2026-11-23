import { BIBLE_BOOKS } from "@/src/constants/bibleBooks";
import {
  chapterKey,
  chapterReadUpdate,
  daysBehind,
  formatReading,
  getPlan,
  nextDay,
  PlanProgress,
  planSchedule,
  READING_PLANS,
  withRecoveredDays,
} from "@/src/services/readingPlans";
import { dateKeyOf } from "@/src/utils/dateKey";

const chaptersIn = (ids: string[]) =>
  BIBLE_BOOKS.filter((b) => ids.includes(b.id)).reduce((n, b) => n + b.chapters, 0);

/** Every chapter of a schedule, in order, as "book-chapter". */
const flatten = (planId: string) =>
  planSchedule(planId).flat().map((c) => `${c.bookId}-${c.chapter}`);

describe("planSchedule", () => {
  it("has one entry per plan day, none of them empty", () => {
    for (const plan of READING_PLANS) {
      const days = planSchedule(plan.id);
      expect(days).toHaveLength(plan.days);
      for (const day of days) expect(day.length).toBeGreaterThan(0);
    }
  });

  it("Bible in a Year covers all 1,189 chapters once, Genesis to Revelation", () => {
    const all = flatten("bible-in-a-year");
    expect(all).toHaveLength(1189);
    expect(new Set(all).size).toBe(1189);
    expect(all[0]).toBe("genesis-1");
    expect(all[all.length - 1]).toBe("revelation-22");
  });

  it("New Testament in 90 Days covers exactly the 260 NT chapters", () => {
    const all = flatten("nt-90-days");
    const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT").map((b) => b.id);
    expect(all).toHaveLength(chaptersIn(nt));
    expect(all).toHaveLength(260);
    expect(all[0]).toBe("matthew-1");
  });

  it("Psalms & Proverbs ends each day with that day's Proverbs chapter", () => {
    const days = planSchedule("psalms-proverbs-month");
    days.forEach((day, i) => {
      expect(day[day.length - 1]).toMatchObject({ bookId: "proverbs", chapter: i + 1 });
    });
    const psalms = days.flatMap((d) => d.filter((c) => c.bookId === "psalms"));
    expect(psalms).toHaveLength(150);
  });

  it("returns nothing for an unknown plan", () => {
    expect(planSchedule("no-such-plan")).toEqual([]);
  });
});

describe("formatReading", () => {
  it("joins consecutive chapters and separates books", () => {
    expect(formatReading(planSchedule("psalms-proverbs-month")[0])).toBe(
      "Psalms 1–4 · Proverbs 1",
    );
    expect(
      formatReading([
        { bookId: "genesis", bookLabel: "Genesis", chapter: 50 },
        { bookId: "exodus", bookLabel: "Exodus", chapter: 1 },
      ]),
    ).toBe("Genesis 50 · Exodus 1");
  });
});

describe("progress", () => {
  const plan = getPlan("nt-90-days")!;
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return dateKeyOf(d.getTime());
  };
  const progress = (startedOn: string, doneDays: number[]): PlanProgress => ({
    planId: plan.id,
    startedOn,
    completed: Object.fromEntries(doneDays.map((d) => [d, startedOn])),
    chaptersRead: {},
  });

  it("is not behind on the day a plan starts", () => {
    expect(daysBehind(plan, progress(daysAgo(0), []))).toBe(0);
  });

  it("counts past days that aren't done", () => {
    // Started 3 days ago: days 1–3 are due, one is done
    expect(daysBehind(plan, progress(daysAgo(3), [0]))).toBe(2);
    expect(daysBehind(plan, progress(daysAgo(3), [0, 1, 2]))).toBe(0);
  });

  it("is never behind by more than the plan's length", () => {
    expect(daysBehind(plan, progress(daysAgo(400), []))).toBe(90);
  });

  it("finds the first unread day", () => {
    expect(nextDay(plan, progress(daysAgo(0), []))).toBe(0);
    expect(nextDay(plan, progress(daysAgo(0), [0, 1, 3]))).toBe(2);
    const all = Array.from({ length: 90 }, (_, i) => i);
    expect(nextDay(plan, progress(daysAgo(0), all))).toBeNull();
  });
});

describe("chapterReadUpdate", () => {
  const PLAN = "psalms-proverbs-month";
  const days = planSchedule(PLAN);
  const today = "2026-11-22";
  const progress = (
    completed: Record<number, string> = {},
    chaptersRead: Record<string, string> = {},
  ): PlanProgress => ({ planId: PLAN, startedOn: "2026-11-17", completed, chaptersRead });
  const keyOf = (c: { bookId: string; chapter: number }) => chapterKey(c.bookId, c.chapter);
  const open = (p: PlanProgress, c: { bookId: string; chapter: number }) =>
    chapterReadUpdate(p, c.bookId, c.chapter, today);

  it("ticks the chapter and sends no `completed` when the day isn't finished", () => {
    const update = open(progress({ 0: "2026-11-17" }), days[1][0]);
    expect(update).toEqual({ chaptersRead: { [keyOf(days[1][0])]: today } });
    // Firestore replaces a map with nothing if a merge write carries `{}`
    expect(update).not.toHaveProperty("completed");
  });

  it("never sends an empty map anywhere in the write", () => {
    for (const c of days[2]) {
      const update = open(progress(), c);
      for (const value of Object.values(update ?? {})) {
        if (typeof value === "object") expect(Object.keys(value).length).toBeGreaterThan(0);
      }
    }
  });

  it("marks the day read when its last chapter is opened", () => {
    const day = days[1];
    const readSoFar = Object.fromEntries(day.slice(0, -1).map((c) => [keyOf(c), "2026-11-21"]));
    const update = open(progress({}, readSoFar), day[day.length - 1]);
    expect(update).toEqual({
      chaptersRead: { [keyOf(day[day.length - 1])]: today },
      completed: { 1: today },
    });
  });

  it("keeps the original date of a chapter that was already read", () => {
    const day = days[1];
    const all = Object.fromEntries(day.map((c) => [keyOf(c), "2026-11-20"]));
    // The day is fully read but not marked: opening a chapter again finishes it
    const update = open(progress({}, all), day[0]);
    expect(update?.chaptersRead[keyOf(day[0])]).toBe("2026-11-20");
    expect(update?.completed).toEqual({ 1: today });
  });

  it("does nothing for a chapter that was already recorded and finishes nothing", () => {
    const c = days[1][0];
    expect(open(progress({}, { [keyOf(c)]: "2026-11-21" }), c)).toBeNull();
  });

  it("does nothing for chapters outside the plan or in a finished day", () => {
    expect(chapterReadUpdate(progress(), "genesis", 1, today)).toBeNull();
    expect(open(progress({ 0: "2026-11-17" }), days[0][0])).toBeNull();
  });
});

describe("withRecoveredDays", () => {
  const PLAN = "psalms-proverbs-month";
  const days = planSchedule(PLAN);
  const readOn = (day: number, date: string) =>
    Object.fromEntries(days[day].map((c) => [chapterKey(c.bookId, c.chapter), date]));
  const progress = (
    completed: Record<number, string>,
    chaptersRead: Record<string, string>,
  ): PlanProgress => ({ planId: PLAN, startedOn: "2026-11-17", completed, chaptersRead });

  it("restores days whose chapters were all read, dated by the last chapter", () => {
    const chaptersRead = { ...readOn(0, "2026-11-17"), ...readOn(1, "2026-11-18") };
    // One chapter of day 1 was read a day later than the rest
    const lastOfDay1 = days[1][days[1].length - 1];
    chaptersRead[chapterKey(lastOfDay1.bookId, lastOfDay1.chapter)] = "2026-11-19";
    expect(withRecoveredDays(progress({}, chaptersRead)).completed).toEqual({
      0: "2026-11-17",
      1: "2026-11-19",
    });
  });

  it("keeps days marked read by hand, which have no chapters recorded", () => {
    expect(withRecoveredDays(progress({ 4: "2026-11-20" }, {})).completed).toEqual({
      4: "2026-11-20",
    });
  });

  it("keeps the stored date when a day is already marked", () => {
    const result = withRecoveredDays(progress({ 0: "2026-11-30" }, readOn(0, "2026-11-17")));
    expect(result.completed[0]).toBe("2026-11-30");
  });

  it("leaves a partly read day alone", () => {
    const [first] = days[0];
    const result = withRecoveredDays(
      progress({}, { [chapterKey(first.bookId, first.chapter)]: "2026-11-17" }),
    );
    expect(result.completed).toEqual({});
  });

  it("returns the same object when there is nothing to restore", () => {
    const p = progress({ 0: "2026-11-17" }, readOn(0, "2026-11-17"));
    expect(withRecoveredDays(p)).toBe(p);
  });

  it("doesn't change the input", () => {
    const p = progress({}, readOn(0, "2026-11-17"));
    withRecoveredDays(p);
    expect(p.completed).toEqual({});
  });

  it("ignores a plan it doesn't know", () => {
    const p: PlanProgress = { planId: "retired-plan", startedOn: "2026-11-17", completed: {}, chaptersRead: { "genesis-1": "2026-11-17" } };
    expect(withRecoveredDays(p)).toBe(p);
  });
});
