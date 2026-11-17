// Verse of the Day choice, shared by the app and the reminder server
// (api/cron/reminders.ts), so it must not import anything app-only.

import { BIBLE_BOOKS } from "../constants/bibleBooks";
import { DAILY_VERSES } from "../constants/dailyVerses";

const PHT = "Asia/Manila";

/** Returns today's date string in PHT timezone (e.g. "2026-03-02"). */
export function getPHTDateString(): string {
  // en-CA locale formats as YYYY-MM-DD — exactly what we need for the hash key
  return new Intl.DateTimeFormat("en-CA", { timeZone: PHT }).format(new Date());
}

/** 32-bit string hash (FNV-1a). */
function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Small seeded random number generator (mulberry32), returns 0 ≤ n < 1. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "John 3:16" → { book: "john", bookLabel: "John", chapter: 3, verse: 16 } */
function parseDailyRef(ref: string) {
  const m = /^(.+) (\d+):(\d+)$/.exec(ref);
  const book = m && BIBLE_BOOKS.find((b) => b.label === m[1]);
  if (!m || !book) throw new Error(`Bad Verse of the Day reference: ${ref}`);
  return {
    book: book.id,
    bookLabel: book.label,
    chapter: Number(m[2]),
    verse: Number(m[3]),
  };
}

/**
 * Today's Verse of the Day for one account. Each account goes through the
 * whole list in its own shuffled order, so people get different verses and a
 * verse only comes back after all the others (a year with 365 verses). It is worked out
 * from the account and the date alone, so it's the same on every device and
 * changes at midnight PHT.
 */
export function getDailyVerseRef(uid: string, date = getPHTDateString()) {
  const n = DAILY_VERSES.length;
  // Days since 1970-01-01 for the PHT calendar date
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  // This account's own order of the list (the same every time, so a verse
  // only comes back after all the others)
  const order = DAILY_VERSES.map((_, i) => i);
  const random = seededRandom(hashString(uid));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return parseDailyRef(DAILY_VERSES[order[day % n]]);
}

