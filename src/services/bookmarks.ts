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
  id: string; // `${bookId}-${chapter}-${verse}`
  bookId: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  text: string;
  version: string; // translation label e.g. "ASV"
  createdAt: number; // Date.now()
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
      text: data.text as string,
      version: data.version as string,
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
    text: verse.text,
    version: verse.version,
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

export async function removeHighlight(id: string): Promise<void> {
  const current = await loadHighlights();
  current.delete(id);
  await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify([...current]));
}
