import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { db } from "./firebase";

// ── Bookmarks (Firestore) ─────────────────────────────────────────────────────
// Firestore path: users/{uid}/bookmarks/{bookmarkId}

export interface BookmarkedVerse {
  /**
   * `${bookId}-${chapter}-${verse}` for one verse;
   * `${bookId}-${chapter}-${v1}_${v2}_…` for several bookmarked as one.
   */
  id: string;
  bookId: string;
  bookLabel: string;
  chapter: number;
  /** First (or only) verse. */
  verse: number;
  /**
   * Every verse in the bookmark, ascending, when several were saved as one.
   * Missing on single-verse bookmarks (including all saved before this field).
   */
  verses?: number[] | null;
  /** Verse text; several verses are joined with spaces. */
  text: string;
  version: string; // translation label e.g. "ASV"
  /**
   * Calendar day this bookmark is for ("YYYY-MM-DD"), when added or planned
   * from Growth's calendar. null / missing = the day it was saved.
   */
  forDate?: string | null;
  createdAt: number; // Date.now()
}

/** Verse numbers a bookmark covers, ascending. */
export function versesOf(v: { verse: number; verses?: number[] | null }): number[] {
  return v.verses && v.verses.length > 0 ? v.verses : [v.verse];
}

/** "16", "16–18", "16–18, 20" — runs of consecutive verses collapsed. */
export function formatVerseNumbers(nums: number[]): string {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(
      j === i ? `${sorted[i]}` : `${sorted[i]}\u2013${sorted[j]}`,
    );
    i = j + 1;
  }
  return parts.join(", ");
}

/** "John 3:16" or "John 3:16–18". */
export function bookmarkRef(v: {
  bookLabel: string;
  chapter: number;
  verse: number;
  verses?: number[] | null;
}): string {
  return `${v.bookLabel} ${v.chapter}:${formatVerseNumbers(versesOf(v))}`;
}

/** Document id for a bookmark of one or more verses. */
export function bookmarkId(bookId: string, chapter: number, nums: number[]): string {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  return `${bookId}-${chapter}-${sorted.join("_")}`;
}

function bookmarksRef(uid: string) {
  return collection(db, "users", uid, "bookmarks");
}

export async function loadBookmarks(uid: string): Promise<BookmarkedVerse[]> {
  if (!uid) return [];
  const q = query(bookmarksRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
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
      version: data.version as string,
      forDate: (data.forDate as string | null) ?? null,
      createdAt: data.createdAt as number,
    };
  });
}

export async function addBookmark(
  uid: string,
  verse: BookmarkedVerse,
): Promise<void> {
  if (!uid) return;
  await setDoc(doc(bookmarksRef(uid), verse.id), {
    bookId: verse.bookId,
    bookLabel: verse.bookLabel,
    chapter: verse.chapter,
    verse: verse.verse,
    // Only written for multi-verse bookmarks, so single-verse documents keep
    // the shape the live app has always saved
    ...(verse.verses && verse.verses.length > 1 ? { verses: verse.verses } : {}),
    text: verse.text,
    version: verse.version,
    forDate: verse.forDate ?? null,
    createdAt: verse.createdAt,
    createdAtServer: serverTimestamp(),
  });
}

export async function removeBookmark(uid: string, id: string): Promise<void> {
  if (!uid) return;
  await deleteDoc(doc(bookmarksRef(uid), id));
}

// ── Highlights ────────────────────────────────────────────────────────────────

const HIGHLIGHTS_KEY = "@highlighted_verses";

/** Returns a map of verseKey → hex color string */
export async function loadHighlights(): Promise<Map<string, string>> {
  const raw = await AsyncStorage.getItem(HIGHLIGHTS_KEY);
  if (!raw) return new Map();
  try {
    return new Map(JSON.parse(raw) as [string, string][]);
  } catch {
    return new Map();
  }
}

export async function saveHighlight(id: string, color: string): Promise<void> {
  const current = await loadHighlights();
  current.set(id, color);
  await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify([...current]));
}

// ── Underlines ────────────────────────────────────────────────────────────────
// A plain underline mark, separate from colour highlights (a verse can have
// both). Stored on this device like highlights.

const UNDERLINES_KEY = "@underlined_verses";

/** Returns the set of underlined verse keys. */
export async function loadUnderlines(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(UNDERLINES_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

// Writes run one after another so quick taps on several verses can't
// overwrite each other's changes (each write reads the saved set first).
let underlineWrites: Promise<void> = Promise.resolve();

/** Underlines (on = true) or clears the underline of the given verse keys. */
export function setUnderlines(ids: string[], on: boolean): Promise<void> {
  const write = underlineWrites.then(async () => {
    const current = await loadUnderlines();
    for (const id of ids) {
      if (on) current.add(id);
      else current.delete(id);
    }
    await AsyncStorage.setItem(UNDERLINES_KEY, JSON.stringify([...current]));
  });
  underlineWrites = write.catch(() => {});
  return write;
}

export async function removeHighlight(id: string): Promise<void> {
  const current = await loadHighlights();
  current.delete(id);
  await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify([...current]));
}
