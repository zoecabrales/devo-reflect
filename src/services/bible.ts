import AsyncStorage from "@react-native-async-storage/async-storage";
import { BIBLE_BOOKS } from "@/src/constants/bibleBooks";
import { DAILY_VERSES } from "@/src/constants/dailyVerses";
import { BIBLE_DATA } from "./bibleData";
import { auth } from "./firebase";
import { reportFumsView } from "./fums";

// ── Reading Position ─────────────────────────────────────────────────────────

export interface ReadingPosition {
  bookId: string;
  bookLabel: string;
  chapter: number;
}

const READING_POSITION_KEY = "@reading_position";

export async function saveReadingPosition(pos: ReadingPosition): Promise<void> {
  await AsyncStorage.setItem(READING_POSITION_KEY, JSON.stringify(pos));
}

export async function loadReadingPosition(): Promise<ReadingPosition | null> {
  const raw = await AsyncStorage.getItem(READING_POSITION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReadingPosition;
  } catch {
    return null;
  }
}

export const BIBLE_VERSION = "en-asv";

// ── Bible Versions ───────────────────────────────────────────────────────────

export interface BibleVersion {
  id: string; // CDN path segment, e.g. "en-asv"
  label: string; // short name shown in the picker, e.g. "ASV"
  description: string; // full name shown beneath the label
  /** Fetched from the publisher through /api/chapter, not bundled. */
  online?: boolean;
  /** Notice the publisher requires shown with its text, word for word. */
  copyright?: string;
  /** Served through API.Bible, whose free plan requires a link to it. */
  viaApiBible?: boolean;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: "en-asv",
    label: "ASV",
    description: "American Standard Version (1901)",
  },
  { id: "en-kjv", label: "KJV", description: "King James Version (1611)" },
  { id: "en-web", label: "WEB", description: "World English Bible" },
  { id: "en-bbe", label: "BBE", description: "Bible in Basic English (1949)" },
  {
    id: "en-ylt",
    label: "YLT",
    description: "Young's Literal Translation (1898)",
  },
  {
    id: "esv",
    label: "ESV",
    description: "English Standard Version",
    online: true,
    copyright:
      "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.",
  },
  {
    id: "nasb",
    label: "NASB",
    description: "New American Standard Bible (1995)",
    online: true,
    viaApiBible: true,
    copyright:
      "NEW AMERICAN STANDARD BIBLE® NASB® Copyright © 1960,1962,1963,1968,1971,1972,1973,1975,1977,1995 by The Lockman Foundation A Corporation Not for Profit La Habra, CA All Rights Reserved www.lockman.org",
  },
  {
    id: "nkjv",
    label: "NKJV",
    description: "New King James Version",
    online: true,
    viaApiBible: true,
    copyright:
      "New King James Version®, Copyright© 1982, Thomas Nelson. All rights reserved.",
  },
  {
    id: "nlt",
    label: "NLT",
    description: "New Living Translation",
    online: true,
    viaApiBible: true,
    copyright:
      "Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. All rights reserved. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.",
  },
];

// ── Chosen version (remembered on this device) ──────────────────────────────

const VERSION_KEY = "@bible_version";
let chosenVersion: Promise<BibleVersion> | null = null;

/** The version the reader last used on this device (ASV the first time). */
export function getChosenVersion(): Promise<BibleVersion> {
  chosenVersion ??= AsyncStorage.getItem(VERSION_KEY)
    .then((id) => BIBLE_VERSIONS.find((v) => v.id === id) ?? BIBLE_VERSIONS[0])
    .catch(() => BIBLE_VERSIONS[0]);
  return chosenVersion;
}

/** Remembers the version picked in the reader for next time. */
export function setChosenVersion(version: BibleVersion): void {
  chosenVersion = Promise.resolve(version);
  AsyncStorage.setItem(VERSION_KEY, version.id).catch(() => {
    // Not remembered next time; the reader still uses it now
  });
}

// ── Bible Book Catalogue ────────────────────────────────────────────────────

export { BIBLE_BOOKS } from "@/src/constants/bibleBooks";
export type { BibleBook } from "@/src/constants/bibleBooks";

// ── Chapter Fetch ───────────────────────────────────────────────────────────

export interface ChapterVerse {
  verse: number;
  text: string;
}

/**
 * Returns all verses for a given book + chapter from the Bible data bundled
 * with the app, so it works offline and does not hit the network.
 */
export async function fetchChapter(
  bookId: string,
  chapter: number,
  version: string = BIBLE_VERSION,
): Promise<ChapterVerse[]> {
  if (BIBLE_VERSIONS.find((v) => v.id === version)?.online) {
    return fetchOnlineChapter(version, bookId, chapter);
  }
  const verses = loadChapter(version, bookId, chapter);
  return verses.map((text, i) => ({ verse: i + 1, text }));
}

// ── Online versions (ESV) ───────────────────────────────────────────────────

// Web calls its own site; a native build needs the site's address.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const ONLINE_CACHE_KEY = "@online_chapters";
/** ESV and API.Bible terms: no more than 500 verses kept on the device. */
const ONLINE_CACHE_MAX_VERSES = 500;
/** API.Bible asks that cached text is cleared every 14 days or less. */
const ONLINE_CACHE_MAX_AGE_MS = 14 * 86_400_000;

interface OnlineCacheEntry {
  key: string; // "esv/john/3"
  verses: ChapterVerse[];
  /** When it was fetched (Date.now()); older entries have none. */
  savedAt?: number;
  /** API.Bible's usage-reporting token for this chapter. */
  fumsToken?: string;
}

/** Cached chapters, newest first, without any older than 14 days. */
async function readOnlineCache(): Promise<OnlineCacheEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ONLINE_CACHE_KEY);
    const parsed: OnlineCacheEntry[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (e) => e.savedAt !== undefined && now - e.savedAt < ONLINE_CACHE_MAX_AGE_MS,
    );
  } catch {
    return [];
  }
}

/** Puts a chapter at the front, dropping the oldest past 500 verses. */
async function writeOnlineCache(entry: OnlineCacheEntry): Promise<void> {
  const entries = (await readOnlineCache()).filter((e) => e.key !== entry.key);
  entries.unshift(entry);
  let total = 0;
  const kept = entries.filter((e) => {
    total += e.verses.length;
    return total <= ONLINE_CACHE_MAX_VERSES;
  });
  try {
    await AsyncStorage.setItem(ONLINE_CACHE_KEY, JSON.stringify(kept));
  } catch {
    // Cache write failure is non-fatal
  }
}

/** Why an online chapter didn't load, so the reader can say the right thing. */
export class OnlineChapterError extends Error {
  constructor(public reason: "offline" | "unavailable") {
    super(reason);
  }
}

/** One chapter of an online version: from the device cache, else the server. */
async function fetchOnlineChapter(
  version: string,
  bookId: string,
  chapter: number,
): Promise<ChapterVerse[]> {
  const key = `${version}/${bookId}/${chapter}`;
  const cached = (await readOnlineCache()).find((e) => e.key === key);
  if (cached) {
    reportFumsView(cached.fumsToken);
    return cached.verses;
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to read this version");
  const token = await user.getIdToken();
  const params = new URLSearchParams({
    version,
    book: bookId,
    chapter: String(chapter),
  });
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/chapter?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // The request never got a reply: no connection
    throw new OnlineChapterError("offline");
  }
  // Not JSON (e.g. the local dev server, which has no /api) or an error reply
  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok || !isJson) throw new OnlineChapterError("unavailable");
  const data = (await res.json()) as {
    verses?: ChapterVerse[];
    fumsToken?: string;
  };
  const verses = data.verses ?? [];
  if (verses.length === 0) throw new OnlineChapterError("unavailable");
  await writeOnlineCache({
    key,
    verses,
    savedAt: Date.now(),
    fumsToken: data.fumsToken,
  });
  reportFumsView(data.fumsToken);
  return verses;
}

/** Reads one chapter (array of verse texts, verse 1 first) from bundled data. */
function loadChapter(version: string, bookId: string, chapter: number): string[] {
  const loadBook = BIBLE_DATA[version]?.[bookId];
  if (!loadBook) return [];
  return loadBook()[chapter - 1] ?? [];
}

export interface BibleVerse {
  book: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

// ── Bible Collections ───────────────────────────────────────────────────────

export interface BibleCollection {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  icon: string; // Ionicons glyph name
  bookIds: string[];
}

export const BIBLE_COLLECTIONS: BibleCollection[] = [
  {
    id: "pentateuch",
    label: "Pentateuch",
    subtitle: "The Law · 5 books",
    description:
      "Records the creation of the world, the fall of humanity, God's covenant with Abraham, and the formation of Israel as God's chosen nation, including the Law given through Moses.",
    icon: "library-outline",
    bookIds: ["genesis", "exodus", "leviticus", "numbers", "deuteronomy"],
  },
  {
    id: "historical",
    label: "Historical Books",
    subtitle: "Israel's story · 12 books",
    description:
      "Recounts Israel's history in the Promised Land — conquest, judges, kings, exile, and restoration — showing God's faithfulness and Israel's repeated cycles of obedience and disobedience.",
    icon: "time-outline",
    bookIds: [
      "joshua",
      "judges",
      "ruth",
      "1samuel",
      "2samuel",
      "1kings",
      "2kings",
      "1chronicles",
      "2chronicles",
      "ezra",
      "nehemiah",
      "esther",
    ],
  },
  {
    id: "wisdom",
    label: "Wisdom & Poetry",
    subtitle: "Psalms, Proverbs & more · 5 books",
    description:
      "Contains poetic reflections on life, suffering, wisdom, worship, and human relationships, teaching how to fear God and live righteously in everyday life.",
    icon: "star-outline",
    bookIds: ["job", "psalms", "proverbs", "ecclesiastes", "song-of-solomon"],
  },
  {
    id: "prophets",
    label: "The Prophets",
    subtitle: "Major & Minor · 17 books",
    description:
      "God's messengers call Israel to repentance, warn of judgment for sin, and give hope through promises of restoration and the coming Messiah.",
    icon: "megaphone-outline",
    bookIds: [
      "isaiah",
      "jeremiah",
      "lamentations",
      "ezekiel",
      "daniel",
      "hosea",
      "joel",
      "amos",
      "obadiah",
      "jonah",
      "micah",
      "nahum",
      "habakkuk",
      "zephaniah",
      "haggai",
      "zechariah",
      "malachi",
    ],
  },
  {
    id: "gospels",
    label: "The Gospels",
    subtitle: "Life of Jesus · 4 books",
    description:
      "Records the life, teachings, miracles, death, and resurrection of Jesus Christ, revealing Him as the promised Messiah and Savior of the world.",
    icon: "heart-outline",
    bookIds: ["matthew", "mark", "luke", "john"],
  },
  {
    id: "epistles",
    label: "The Epistles",
    subtitle: "Letters · 21 books",
    description:
      "Letters written to churches and believers explaining the gospel, Christian doctrine, and practical instructions for living faithfully in Christ.",
    icon: "mail-outline",
    bookIds: [
      "acts",
      "romans",
      "1corinthians",
      "2corinthians",
      "galatians",
      "ephesians",
      "philippians",
      "colossians",
      "1thessalonians",
      "2thessalonians",
      "1timothy",
      "2timothy",
      "titus",
      "philemon",
      "hebrews",
      "james",
      "1peter",
      "2peter",
      "1john",
      "2john",
      "3john",
      "jude",
    ],
  },
  {
    id: "revelation",
    label: "Revelation",
    subtitle: "The Apocalypse · 1 book",
    description:
      "Reveals Jesus Christ's ultimate victory over evil, the final judgment, and the establishment of God's eternal kingdom with a new heaven and new earth.",
    icon: "flash-outline",
    bookIds: ["revelation"],
  },
];

const PHT = "Asia/Manila";
const DAILY_VERSE_KEY = "@daily_verse";

interface CachedDailyVerse {
  date: string; // "YYYY-MM-DD" in PHT
  /** The account the verse was picked for */
  uid?: string;
  verse: BibleVerse;
}

/** Returns today's date string in PHT timezone (e.g. "2026-03-02"). */
function getPHTDateString(): string {
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

/**
 * Returns the signed-in account's Verse of the Day in the version the reader
 * last used (ASV if that version can't be reached, e.g. the ESV offline),
 * cached on the device for the rest of the day (PHT).
 */
export async function fetchDailyVerse(uid: string): Promise<BibleVerse> {
  const today = getPHTDateString();
  const chosen = await getChosenVersion();

  // Return the cached verse if it is today's, for this account and version
  try {
    const raw = await AsyncStorage.getItem(DAILY_VERSE_KEY);
    if (raw) {
      const cached: CachedDailyVerse = JSON.parse(raw);
      if (
        cached.date === today &&
        cached.uid === uid &&
        cached.verse.version === chosen.label
      ) {
        return cached.verse;
      }
    }
  } catch {
    // Cache unreadable — fall through
  }

  const ref = getDailyVerseRef(uid, today);
  let verse: BibleVerse | null = null;
  if (chosen.id !== BIBLE_VERSION) {
    try {
      const verses = await fetchChapter(ref.book, ref.chapter, chosen.id);
      const text = verses.find((v) => v.verse === ref.verse)?.text;
      if (text) verse = { ...ref, text, version: chosen.label };
    } catch {
      // Not available right now (e.g. offline): use the ASV below
    }
  }
  if (!verse) {
    const text = loadChapter(BIBLE_VERSION, ref.book, ref.chapter)[ref.verse - 1];
    if (!text) {
      throw new Error(`Verse not found: ${ref.bookLabel} ${ref.chapter}:${ref.verse}`);
    }
    verse = { ...ref, text, version: "ASV" };
  }

  // Keep for the rest of today. An ASV stand-in is replaced by the chosen
  // version next time, as its version won't match.
  try {
    await AsyncStorage.setItem(
      DAILY_VERSE_KEY,
      JSON.stringify({ date: today, uid, verse } satisfies CachedDailyVerse),
    );
  } catch {
    // Cache write failure is non-fatal
  }

  return verse;
}
