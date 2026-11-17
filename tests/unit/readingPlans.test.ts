import { BIBLE_BOOKS } from "@/src/constants/bibleBooks";
import {
  daysBehind,
  formatReading,
  getPlan,
  nextDay,
  PlanProgress,
  planSchedule,
  READING_PLANS,
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
