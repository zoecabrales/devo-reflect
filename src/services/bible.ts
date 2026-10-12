import AsyncStorage from "@react-native-async-storage/async-storage";
import { BIBLE_DATA } from "./bibleData";

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
];

// ── Bible Book Catalogue ────────────────────────────────────────────────────

export interface BibleBook {
  id: string; // matches CDN path segment (e.g. "genesis", "1samuel")
  label: string; // human-readable (e.g. "1 Samuel")
  chapters: number;
  testament: "OT" | "NT";
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Old Testament ──────────────────────────────────────────────────────
  { id: "genesis", label: "Genesis", chapters: 50, testament: "OT" },
  { id: "exodus", label: "Exodus", chapters: 40, testament: "OT" },
  { id: "leviticus", label: "Leviticus", chapters: 27, testament: "OT" },
  { id: "numbers", label: "Numbers", chapters: 36, testament: "OT" },
  { id: "deuteronomy", label: "Deuteronomy", chapters: 34, testament: "OT" },
  { id: "joshua", label: "Joshua", chapters: 24, testament: "OT" },
  { id: "judges", label: "Judges", chapters: 21, testament: "OT" },
  { id: "ruth", label: "Ruth", chapters: 4, testament: "OT" },
  { id: "1samuel", label: "1 Samuel", chapters: 31, testament: "OT" },
  { id: "2samuel", label: "2 Samuel", chapters: 24, testament: "OT" },
  { id: "1kings", label: "1 Kings", chapters: 22, testament: "OT" },
  { id: "2kings", label: "2 Kings", chapters: 25, testament: "OT" },
  { id: "1chronicles", label: "1 Chronicles", chapters: 29, testament: "OT" },
  { id: "2chronicles", label: "2 Chronicles", chapters: 36, testament: "OT" },
  { id: "ezra", label: "Ezra", chapters: 10, testament: "OT" },
  { id: "nehemiah", label: "Nehemiah", chapters: 13, testament: "OT" },
  { id: "esther", label: "Esther", chapters: 10, testament: "OT" },
  { id: "job", label: "Job", chapters: 42, testament: "OT" },
  { id: "psalms", label: "Psalms", chapters: 150, testament: "OT" },
  { id: "proverbs", label: "Proverbs", chapters: 31, testament: "OT" },
  { id: "ecclesiastes", label: "Ecclesiastes", chapters: 12, testament: "OT" },
  {
    id: "song-of-solomon",
    label: "Song of Solomon",
    chapters: 8,
    testament: "OT",
  },
  { id: "isaiah", label: "Isaiah", chapters: 66, testament: "OT" },
  { id: "jeremiah", label: "Jeremiah", chapters: 52, testament: "OT" },
  { id: "lamentations", label: "Lamentations", chapters: 5, testament: "OT" },
  { id: "ezekiel", label: "Ezekiel", chapters: 48, testament: "OT" },
  { id: "daniel", label: "Daniel", chapters: 12, testament: "OT" },
  { id: "hosea", label: "Hosea", chapters: 14, testament: "OT" },
  { id: "joel", label: "Joel", chapters: 3, testament: "OT" },
  { id: "amos", label: "Amos", chapters: 9, testament: "OT" },
  { id: "obadiah", label: "Obadiah", chapters: 1, testament: "OT" },
  { id: "jonah", label: "Jonah", chapters: 4, testament: "OT" },
  { id: "micah", label: "Micah", chapters: 7, testament: "OT" },
  { id: "nahum", label: "Nahum", chapters: 3, testament: "OT" },
  { id: "habakkuk", label: "Habakkuk", chapters: 3, testament: "OT" },
  { id: "zephaniah", label: "Zephaniah", chapters: 3, testament: "OT" },
  { id: "haggai", label: "Haggai", chapters: 2, testament: "OT" },
  { id: "zechariah", label: "Zechariah", chapters: 14, testament: "OT" },
  { id: "malachi", label: "Malachi", chapters: 4, testament: "OT" },
  // ── New Testament ──────────────────────────────────────────────────────
  { id: "matthew", label: "Matthew", chapters: 28, testament: "NT" },
  { id: "mark", label: "Mark", chapters: 16, testament: "NT" },
  { id: "luke", label: "Luke", chapters: 24, testament: "NT" },
  { id: "john", label: "John", chapters: 21, testament: "NT" },
  { id: "acts", label: "Acts", chapters: 28, testament: "NT" },
  { id: "romans", label: "Romans", chapters: 16, testament: "NT" },
  { id: "1corinthians", label: "1 Corinthians", chapters: 16, testament: "NT" },
  { id: "2corinthians", label: "2 Corinthians", chapters: 13, testament: "NT" },
  { id: "galatians", label: "Galatians", chapters: 6, testament: "NT" },
  { id: "ephesians", label: "Ephesians", chapters: 6, testament: "NT" },
  { id: "philippians", label: "Philippians", chapters: 4, testament: "NT" },
  { id: "colossians", label: "Colossians", chapters: 4, testament: "NT" },
  {
    id: "1thessalonians",
    label: "1 Thessalonians",
    chapters: 5,
    testament: "NT",
  },
  {
    id: "2thessalonians",
    label: "2 Thessalonians",
    chapters: 3,
    testament: "NT",
  },
  { id: "1timothy", label: "1 Timothy", chapters: 6, testament: "NT" },
  { id: "2timothy", label: "2 Timothy", chapters: 4, testament: "NT" },
  { id: "titus", label: "Titus", chapters: 3, testament: "NT" },
  { id: "philemon", label: "Philemon", chapters: 1, testament: "NT" },
  { id: "hebrews", label: "Hebrews", chapters: 13, testament: "NT" },
  { id: "james", label: "James", chapters: 5, testament: "NT" },
  { id: "1peter", label: "1 Peter", chapters: 5, testament: "NT" },
  { id: "2peter", label: "2 Peter", chapters: 3, testament: "NT" },
  { id: "1john", label: "1 John", chapters: 5, testament: "NT" },
  { id: "2john", label: "2 John", chapters: 1, testament: "NT" },
  { id: "3john", label: "3 John", chapters: 1, testament: "NT" },
  { id: "jude", label: "Jude", chapters: 1, testament: "NT" },
  { id: "revelation", label: "Revelation", chapters: 22, testament: "NT" },
];

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
  const verses = loadChapter(version, bookId, chapter);
  return verses.map((text, i) => ({ verse: i + 1, text }));
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

// Curated list of well-known, encouraging Bible verses
const CURATED_VERSES: {
  book: string;
  bookLabel: string;
  chapter: number;
  verse: number;
}[] = [
  { book: "john", bookLabel: "John", chapter: 3, verse: 16 },
  { book: "psalms", bookLabel: "Psalms", chapter: 23, verse: 1 },
  { book: "philippians", bookLabel: "Philippians", chapter: 4, verse: 13 },
  { book: "jeremiah", bookLabel: "Jeremiah", chapter: 29, verse: 11 },
  { book: "romans", bookLabel: "Romans", chapter: 8, verse: 28 },
  { book: "isaiah", bookLabel: "Isaiah", chapter: 40, verse: 31 },
  { book: "psalms", bookLabel: "Psalms", chapter: 46, verse: 1 },
  { book: "matthew", bookLabel: "Matthew", chapter: 11, verse: 28 },
  { book: "joshua", bookLabel: "Joshua", chapter: 1, verse: 9 },
  { book: "proverbs", bookLabel: "Proverbs", chapter: 3, verse: 5 },
  { book: "romans", bookLabel: "Romans", chapter: 15, verse: 13 },
  { book: "isaiah", bookLabel: "Isaiah", chapter: 41, verse: 10 },
  { book: "matthew", bookLabel: "Matthew", chapter: 6, verse: 33 },
  { book: "psalms", bookLabel: "Psalms", chapter: 119, verse: 105 },
  { book: "john", bookLabel: "John", chapter: 14, verse: 6 },
  { book: "ephesians", bookLabel: "Ephesians", chapter: 2, verse: 8 },
  { book: "hebrews", bookLabel: "Hebrews", chapter: 11, verse: 1 },
  { book: "james", bookLabel: "James", chapter: 1, verse: 5 },
  { book: "psalms", bookLabel: "Psalms", chapter: 27, verse: 1 },
  { book: "john", bookLabel: "John", chapter: 15, verse: 5 },
  { book: "romans", bookLabel: "Romans", chapter: 12, verse: 2 },
  { book: "colossians", bookLabel: "Colossians", chapter: 3, verse: 23 },
  { book: "proverbs", bookLabel: "Proverbs", chapter: 18, verse: 10 },
  { book: "luke", bookLabel: "Luke", chapter: 1, verse: 37 },
  { book: "john", bookLabel: "John", chapter: 16, verse: 33 },
  { book: "genesis", bookLabel: "Genesis", chapter: 1, verse: 1 },
  { book: "psalms", bookLabel: "Psalms", chapter: 34, verse: 8 },
  { book: "isaiah", bookLabel: "Isaiah", chapter: 26, verse: 3 },
  { book: "matthew", bookLabel: "Matthew", chapter: 5, verse: 9 },
  { book: "galatians", bookLabel: "Galatians", chapter: 6, verse: 9 },
  { book: "psalms", bookLabel: "Psalms", chapter: 91, verse: 1 },
  { book: "proverbs", bookLabel: "Proverbs", chapter: 22, verse: 6 },
  { book: "john", bookLabel: "John", chapter: 8, verse: 32 },
  { book: "romans", bookLabel: "Romans", chapter: 5, verse: 8 },
  { book: "mark", bookLabel: "Mark", chapter: 10, verse: 27 },
];

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
  verse: BibleVerse;
}

/** Returns today's date string in PHT timezone (e.g. "2026-03-02"). */
function getPHTDateString(): string {
  // en-CA locale formats as YYYY-MM-DD — exactly what we need for the hash key
  return new Intl.DateTimeFormat("en-CA", { timeZone: PHT }).format(new Date());
}

/**
 * Returns a deterministic-but-unpredictable verse index based on today's PHT date.
 * The same date always produces the same index; a new calendar day produces a
 * different one — so the verse changes once every 24 hours (midnight PHT).
 */
export function getDailyVerseIndex(): number {
  const today = getPHTDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0; // unsigned 32-bit int
  }
  return hash % CURATED_VERSES.length;
}

/**
 * Returns the Verse of the Day, using an AsyncStorage cache keyed by today's
 * PHT date. The network is only hit once per calendar day (PHT midnight).
 */
export async function fetchDailyVerse(): Promise<BibleVerse> {
  const today = getPHTDateString();

  // Return cached verse if it belongs to today
  try {
    const raw = await AsyncStorage.getItem(DAILY_VERSE_KEY);
    if (raw) {
      const cached: CachedDailyVerse = JSON.parse(raw);
      if (cached.date === today) return cached.verse;
    }
  } catch {
    // Cache unreadable — fall through to fetch
  }

  const ref = CURATED_VERSES[getDailyVerseIndex()];
  const text = loadChapter(BIBLE_VERSION, ref.book, ref.chapter)[ref.verse - 1];
  if (!text) {
    throw new Error(`Verse not found: ${ref.bookLabel} ${ref.chapter}:${ref.verse}`);
  }
  const verse: BibleVerse = { ...ref, text, version: "ASV" };

  // Persist for the rest of today
  try {
    await AsyncStorage.setItem(
      DAILY_VERSE_KEY,
      JSON.stringify({ date: today, verse } satisfies CachedDailyVerse),
    );
  } catch {
    // Cache write failure is non-fatal
  }

  return verse;
}
