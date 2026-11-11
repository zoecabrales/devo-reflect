import { dateKeyOf } from "@/src/utils/dateKey";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { BIBLE_BOOKS } from "./bible";
import { db } from "./firebase";

// ── Plan definitions ─────────────────────────────────────────────────────────
// Plans are computed from the book catalogue, so they always match the
// offline Bible. Each day is a list of chapters.

export interface PlanChapter {
  bookId: string;
  bookLabel: string;
  chapter: number;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  icon: "calendar-outline" | "sparkles-outline" | "musical-notes-outline";
  days: number;
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "bible-in-a-year",
    title: "Bible in a Year",
    description: "Genesis to Revelation in 365 days, about 3 chapters a day.",
    icon: "calendar-outline",
    days: 365,
  },
  {
    id: "nt-90-days",
    title: "New Testament in 90 Days",
    description: "Matthew to Revelation in 90 days, about 3 chapters a day.",
    icon: "sparkles-outline",
    days: 90,
  },
  {
    id: "psalms-proverbs-month",
    title: "Psalms & Proverbs in a Month",
    description: "A chapter of Proverbs and about 5 Psalms each day for 31 days.",
    icon: "musical-notes-outline",
    days: 31,
  },
];

function chaptersOf(bookIds?: string[], testament?: "OT" | "NT"): PlanChapter[] {
  const out: PlanChapter[] = [];
  for (const b of BIBLE_BOOKS) {
    if (bookIds && !bookIds.includes(b.id)) continue;
    if (testament && b.testament !== testament) continue;
    for (let c = 1; c <= b.chapters; c++) {
      out.push({ bookId: b.id, bookLabel: b.label, chapter: c });
    }
  }
  return out;
}

/** Splits chapters as evenly as possible across `days` days, in order. */
function spread(chapters: PlanChapter[], days: number): PlanChapter[][] {
  return Array.from({ length: days }, (_, i) =>
    chapters.slice(
      Math.floor((i * chapters.length) / days),
      Math.floor(((i + 1) * chapters.length) / days),
    ),
  );
}

const scheduleCache: Record<string, PlanChapter[][]> = {};

/** The chapters to read on each day of a plan (index 0 = day 1). */
export function planSchedule(planId: string): PlanChapter[][] {
  if (scheduleCache[planId]) return scheduleCache[planId];
  let days: PlanChapter[][];
  switch (planId) {
    case "bible-in-a-year":
      days = spread(chaptersOf(), 365);
      break;
    case "nt-90-days":
      days = spread(chaptersOf(undefined, "NT"), 90);
      break;
    case "psalms-proverbs-month": {
      // Day n: ~5 Psalms, then Proverbs n (Proverbs has 31 chapters)
      const psalms = spread(chaptersOf(["psalms"]), 31);
      const proverbs = chaptersOf(["proverbs"]);
      days = psalms.map((p, i) => [...p, proverbs[i]]);
      break;
    }
    default:
      days = [];
  }
  scheduleCache[planId] = days;
  return days;
}

/** "Genesis 1–3", "Psalms 1–5 · Proverbs 1" */
export function formatReading(chapters: PlanChapter[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < chapters.length) {
    const start = chapters[i];
    let end = start;
    while (
      i + 1 < chapters.length &&
      chapters[i + 1].bookId === start.bookId &&
      chapters[i + 1].chapter === end.chapter + 1
    ) {
      i++;
      end = chapters[i];
    }
    parts.push(
      end.chapter === start.chapter
        ? `${start.bookLabel} ${start.chapter}`
        : `${start.bookLabel} ${start.chapter}–${end.chapter}`,
    );
    i++;
  }
  return parts.join(" · ");
}

export function getPlan(planId: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === planId);
}

// ── Progress (Firestore) ─────────────────────────────────────────────────────
// Path: users/{uid}/reading-plans/{planId}

export interface PlanProgress {
  planId: string;
  /** Day the plan was started ("YYYY-MM-DD"). */
  startedOn: string;
  /** Completed days: day index (0-based) → date it was read ("YYYY-MM-DD"). */
  completed: Record<number, string>;
  /** Chapters opened in the Bible: chapterKey → date it was read. */
  chaptersRead: Record<string, string>;
}

/** Key of a chapter in `chaptersRead`, e.g. "genesis-1". */
export function chapterKey(bookId: string, chapter: number): string {
  return `${bookId}-${chapter}`;
}

// Chapter reads recorded from the Bible are written in the background; plan
// loads wait for them so a plan opened right after reading is up to date.
let pendingRecord: Promise<void> = Promise.resolve();

function plansCol(uid: string) {
  return collection(db, "users", uid, "reading-plans");
}

/** All plans the user has started, keyed by plan id. */
export async function loadPlanProgress(
  uid: string,
): Promise<Record<string, PlanProgress>> {
  if (!uid) return {};
  await pendingRecord;
  return fetchPlanProgress(uid);
}

async function fetchPlanProgress(
  uid: string,
): Promise<Record<string, PlanProgress>> {
  const snapshot = await getDocs(plansCol(uid));
  const result: Record<string, PlanProgress> = {};
  for (const d of snapshot.docs) {
    const data = d.data();
    const completed: Record<number, string> = {};
    for (const [k, v] of Object.entries(
      (data.completed as Record<string, string>) ?? {},
    )) {
      completed[Number(k)] = v;
    }
    result[d.id] = {
      planId: d.id,
      startedOn: data.startedOn as string,
      completed,
      chaptersRead: (data.chaptersRead as Record<string, string>) ?? {},
    };
  }
  return result;
}

export async function startPlan(
  uid: string,
  planId: string,
): Promise<PlanProgress> {
  const startedOn = dateKeyOf(Date.now());
  await setDoc(doc(plansCol(uid), planId), {
    startedOn,
    completed: {},
    chaptersRead: {},
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
  return { planId, startedOn, completed: {}, chaptersRead: {} };
}

/**
 * Marks a day read (today's date) or unread. Unmarking also forgets that
 * day's chapters, so opening one of them again doesn't re-complete it.
 */
export async function setDayComplete(
  uid: string,
  planId: string,
  dayIndex: number,
  done: boolean,
): Promise<string | null> {
  const readOn = done ? dateKeyOf(Date.now()) : null;
  const chaptersRead: Record<string, ReturnType<typeof deleteField>> = {};
  if (!done) {
    for (const c of planSchedule(planId)[dayIndex] ?? []) {
      chaptersRead[chapterKey(c.bookId, c.chapter)] = deleteField();
    }
  }
  await setDoc(
    doc(plansCol(uid), planId),
    {
      completed: { [dayIndex]: done ? readOn : deleteField() },
      ...(done ? {} : { chaptersRead }),
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true },
  );
  return readOn;
}

/**
 * Records that a chapter was opened in the Bible. In every started plan where
 * it's part of an unfinished day, the chapter is ticked off, and the day is
 * marked read once all its chapters have been opened.
 */
export function recordChapterRead(
  uid: string,
  bookId: string,
  chapter: number,
): Promise<void> {
  if (!uid) return Promise.resolve();
  const run = async () => {
    const all = await fetchPlanProgress(uid);
    const key = chapterKey(bookId, chapter);
    const today = dateKeyOf(Date.now());
    await Promise.all(
      Object.values(all).map(async (p) => {
        const schedule = planSchedule(p.planId);
        const days = schedule
          .map((chapters, day) => ({ chapters, day }))
          .filter(
            ({ chapters, day }) =>
              !p.completed[day] &&
              chapters.some((c) => c.bookId === bookId && c.chapter === chapter),
          );
        if (days.length === 0) return;
        const read = { ...p.chaptersRead, [key]: p.chaptersRead[key] ?? today };
        const completed: Record<number, string> = {};
        for (const { chapters, day } of days) {
          if (chapters.every((c) => read[chapterKey(c.bookId, c.chapter)])) {
            completed[day] = today;
          }
        }
        if (p.chaptersRead[key] && Object.keys(completed).length === 0) return;
        await setDoc(
          doc(plansCol(uid), p.planId),
          {
            chaptersRead: { [key]: read[key] },
            completed,
            updatedAt: Date.now(),
            updatedAtServer: serverTimestamp(),
          },
          { merge: true },
        );
      }),
    );
  };
  // One at a time, so quick chapter flips don't overwrite each other
  pendingRecord = pendingRecord
    .then(run)
    .catch((err) => console.warn("Failed to record chapter read:", err));
  return pendingRecord;
}

/** Leaves a plan and clears its progress. */
export async function stopPlan(uid: string, planId: string): Promise<void> {
  await deleteDoc(doc(plansCol(uid), planId));
}

/** First unread day (0-based), or null when every day is done. */
export function nextDay(plan: ReadingPlan, progress: PlanProgress): number | null {
  for (let i = 0; i < plan.days; i++) {
    if (!progress.completed[i]) return i;
  }
  return null;
}

/**
 * How far behind the calendar schedule the reader is (0 = on track).
 * Day 1 is the day the plan was started.
 */
export function daysBehind(plan: ReadingPlan, progress: PlanProgress): number {
  const [y, m, d] = progress.startedOn.split("-").map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scheduled = Math.min(
    plan.days,
    Math.round((today.getTime() - start) / 86_400_000) + 1,
  );
  const done = Object.keys(progress.completed).length;
  return Math.max(0, scheduled - done);
}
