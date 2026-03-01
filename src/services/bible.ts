const BASE_URL = "https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles";

export const BIBLE_VERSION = "en-asv";

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
 * Fetches all verses for a given book + chapter.
 * Requests are made in parallel batches of 30 until an empty batch is returned.
 */
export async function fetchChapter(
  bookId: string,
  chapter: number,
): Promise<ChapterVerse[]> {
  const BATCH = 30;
  const all: ChapterVerse[] = [];
  let offset = 0;

  while (true) {
    const batch = await Promise.all(
      Array.from({ length: BATCH }, async (_, i) => {
        const v = offset + i + 1;
        const url = `${BASE_URL}/${BIBLE_VERSION}/books/${bookId}/chapters/${chapter}/verses/${v}.json`;
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          const d = (await r.json()) as { text: string };
          return { verse: v, text: d.text };
        } catch {
          return null;
        }
      }),
    );

    const valid = batch.filter(Boolean) as ChapterVerse[];
    all.push(...valid);
    if (valid.length === 0) break;
    offset += BATCH;
  }

  return all;
}

export interface BibleVerse {
  book: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

interface ApiVerseResponse {
  text: string;
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

/**
 * Returns a deterministic verse index based on the current day of the year.
 * All users see the same verse on the same calendar day.
 */
export function getDailyVerseIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % CURATED_VERSES.length;
}

/**
 * Fetches the Verse of the Day from the Bible API CDN.
 */
export async function fetchDailyVerse(): Promise<BibleVerse> {
  const ref = CURATED_VERSES[getDailyVerseIndex()];
  const url = `${BASE_URL}/${BIBLE_VERSION}/books/${ref.book}/chapters/${ref.chapter}/verses/${ref.verse}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Bible API error: ${response.status}`);
  }

  const data: ApiVerseResponse = await response.json();

  return {
    ...ref,
    text: data.text,
    version: "ASV",
  };
}
