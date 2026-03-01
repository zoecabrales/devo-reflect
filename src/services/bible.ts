const BASE_URL = "https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles";

export const BIBLE_VERSION = "en-asv";

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
