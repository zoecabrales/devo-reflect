// The church Verse of the Day served by api/public/verse-of-the-day.ts. Unlike
// the app's own Verse of the Day (one shuffled order per account), everyone
// gets the same verse on a given day. It changes at midnight PHT and goes
// through the whole list before a verse comes back.

import { COMMUNITY_VERSES, CommunityVerse } from "../constants/communityVerses";
import { getPHTDateString, hashString, seededRandom } from "./dailyVerse";

/** The list in a fixed shuffled order, so neighbouring days don't share a theme. */
const ORDER: number[] = (() => {
  const order = COMMUNITY_VERSES.map((_, i) => i);
  const random = seededRandom(hashString("community-verse-of-the-day"));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();

/** The verse for a PHT calendar date ("2026-11-20"), today by default. */
export function getCommunityVerse(date = getPHTDateString()): CommunityVerse {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const n = ORDER.length;
  return COMMUNITY_VERSES[ORDER[((day % n) + n) % n]];
}

/** True for a real calendar date written "YYYY-MM-DD". */
export function isValidDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(`${date}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === date;
}

/** Seconds until the next midnight in the Philippines (UTC+8, no DST). */
export function secondsUntilPHTMidnight(now = Date.now()): number {
  const day = 86_400_000;
  const pht = now + 8 * 3_600_000;
  return Math.ceil((day - (pht % day)) / 1000);
}
