// ── Types ────────────────────────────────────────────────────────────────────

export interface ConcordanceResult {
  pk: number;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  bookLabel: string;
}

// ── Book name map (1-indexed, Protestant canon 66 books) ─────────────────────

const BOOK_NAMES: Record<number, string> = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
  15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
  20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
  24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
  28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
  33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
  38: "Zechariah", 39: "Malachi", 40: "Matthew", 41: "Mark", 42: "Luke",
  43: "John", 44: "Acts", 45: "Romans", 46: "1 Corinthians",
  47: "2 Corinthians", 48: "Galatians", 49: "Ephesians", 50: "Philippians",
  51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians",
  54: "1 Timothy", 55: "2 Timothy", 56: "Titus", 57: "Philemon",
  58: "Hebrews", 59: "James", 60: "1 Peter", 61: "2 Peter", 62: "1 John",
  63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation",
};

// ── Suggested search terms for the landing state ─────────────────────────────

export const SUGGESTED_TERMS = [
  "faith", "grace", "love", "peace", "hope", "mercy", "truth", "salvation",
  "prayer", "wisdom", "righteousness", "covenant", "glory", "blessing",
  "forgiveness", "holy", "eternal", "light", "shepherd", "redemption",
];

// ── API ──────────────────────────────────────────────────────────────────────

const TRANSLATION = "ASV";
const SEARCH_BASE = `https://bolls.life/search/${TRANSLATION}`;

/** Search the ASV Bible for all verses containing `word`. */
export async function searchConcordance(
  word: string,
): Promise<ConcordanceResult[]> {
  const encoded = encodeURIComponent(word.trim().toLowerCase());
  const res = await fetch(`${SEARCH_BASE}/${encoded}/`);
  if (!res.ok) throw new Error(`Concordance API error: ${res.status}`);
  const raw: { pk: number; book: number; chapter: number; verse: number; text: string }[] =
    await res.json();
  return raw.map((v) => ({
    ...v,
    bookLabel: BOOK_NAMES[v.book] ?? `Book ${v.book}`,
  }));
}

