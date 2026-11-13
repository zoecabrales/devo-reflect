import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { bookmarkRef, type BookmarkedVerse } from "./bookmarks";
import { db } from "./firebase";

// ── Memory verses (Firestore) ────────────────────────────────────────────────
// Path: users/{uid}/memory-verses/{id} — id matches the bookmark it came from
// (`${bookId}-${chapter}-${verse}`, or `…-${v1}_${v2}_…` for a passage), so a
// bookmark can only be added once.

/** Correct answers in a row needed to count a verse as memorised. */
export const MASTERY_STREAK = 3;

export interface MemoryVerse {
  id: string;
  bookId: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  /** All verses when the bookmark covered several; missing for one verse. */
  verses?: number[] | null;
  text: string;
  version: string;
  addedAt: number;
  /** Times practised in total. */
  practiceCount: number;
  /** Correct answers in a row; reset by a miss. */
  streak: number;
  lastPracticedAt: number | null;
}

export function verseRef(
  v: Pick<MemoryVerse, "bookLabel" | "chapter" | "verse" | "verses">,
) {
  return bookmarkRef(v);
}

export function isMastered(v: MemoryVerse): boolean {
  return v.streak >= MASTERY_STREAK;
}

function memoryCol(uid: string) {
  return collection(db, "users", uid, "memory-verses");
}

export async function loadMemoryVerses(uid: string): Promise<MemoryVerse[]> {
  if (!uid) return [];
  const snapshot = await getDocs(query(memoryCol(uid), orderBy("addedAt", "desc")));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      bookId: data.bookId as string,
      bookLabel: data.bookLabel as string,
      chapter: data.chapter as number,
      verse: data.verse as number,
      verses: (data.verses as number[] | undefined) ?? null,
      text: data.text as string,
      version: (data.version as string) ?? "",
      addedAt: data.addedAt as number,
      practiceCount: (data.practiceCount as number) ?? 0,
      streak: (data.streak as number) ?? 0,
      lastPracticedAt: (data.lastPracticedAt as number | null) ?? null,
    };
  });
}

/** Adds a bookmarked verse to the memory list. */
export async function addMemoryVerse(
  uid: string,
  bm: BookmarkedVerse,
): Promise<MemoryVerse> {
  const verse: MemoryVerse = {
    id: bm.id,
    bookId: bm.bookId,
    bookLabel: bm.bookLabel,
    chapter: bm.chapter,
    verse: bm.verse,
    verses: bm.verses && bm.verses.length > 1 ? bm.verses : null,
    text: bm.text,
    version: bm.version,
    addedAt: Date.now(),
    practiceCount: 0,
    streak: 0,
    lastPracticedAt: null,
  };
  const { id, verses, ...data } = verse;
  await setDoc(doc(memoryCol(uid), id), {
    ...data,
    ...(verses ? { verses } : {}),
    addedAtServer: serverTimestamp(),
  });
  return verse;
}

export async function removeMemoryVerse(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(memoryCol(uid), id));
}

/** Records one practice attempt and returns the updated verse. */
export async function recordPractice(
  uid: string,
  verse: MemoryVerse,
  correct: boolean,
): Promise<MemoryVerse> {
  const updated: MemoryVerse = {
    ...verse,
    practiceCount: verse.practiceCount + 1,
    streak: correct ? verse.streak + 1 : 0,
    lastPracticedAt: Date.now(),
  };
  await setDoc(
    doc(memoryCol(uid), verse.id),
    {
      practiceCount: updated.practiceCount,
      streak: updated.streak,
      lastPracticedAt: updated.lastPracticedAt,
    },
    { merge: true },
  );
  return updated;
}

// ── Fill-in-the-blank ────────────────────────────────────────────────────────

export interface ClozeToken {
  /** The word as written, punctuation included. */
  text: string;
  /** The part the reader must type (letters only), when blanked. */
  answer: string | null;
}

/** Normalises a typed answer for comparison. */
export function normalizeWord(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9']/g, "")
    .replace(/'/g, "");
}

/**
 * Splits a verse into words and blanks out about a third of the longer ones
 * (4+ letters), spread through the verse. `seed` varies which words.
 */
export function makeCloze(text: string, seed: number): ClozeToken[] {
  const words = text.split(/\s+/).filter(Boolean);
  const candidates = words
    .map((w, i) => ({ i, core: w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "") }))
    .filter((c) => c.core.length >= 4);
  const target = Math.max(1, Math.round(candidates.length / 3));
  const step = candidates.length / target;
  const offset = Math.abs(seed) % Math.max(1, Math.floor(step));
  const blanked = new Set<number>();
  for (let k = 0; k < target; k++) {
    const c = candidates[Math.min(candidates.length - 1, Math.floor(k * step) + offset)];
    if (c) blanked.add(c.i);
  }
  return words.map((w, i) => {
    if (!blanked.has(i)) return { text: w, answer: null };
    const core = w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
    return { text: w, answer: core };
  });
}
