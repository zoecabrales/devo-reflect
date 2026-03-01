import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Bookmarks ─────────────────────────────────────────────────────────────────

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

const BOOKMARKS_KEY = "@bookmarks";

export async function loadBookmarks(): Promise<BookmarkedVerse[]> {
  const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BookmarkedVerse[];
  } catch {
    return [];
  }
}

export async function addBookmark(verse: BookmarkedVerse): Promise<void> {
  const existing = await loadBookmarks();
  // Replace if same verse already bookmarked (different version is fine to overwrite)
  const filtered = existing.filter((b) => b.id !== verse.id);
  await AsyncStorage.setItem(
    BOOKMARKS_KEY,
    JSON.stringify([verse, ...filtered]),
  );
}

export async function removeBookmark(id: string): Promise<void> {
  const existing = await loadBookmarks();
  const filtered = existing.filter((b) => b.id !== id);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

// ── Underlines ────────────────────────────────────────────────────────────────

const UNDERLINES_KEY = "@underlined_verses";

export async function loadUnderlines(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(UNDERLINES_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function toggleUnderline(id: string): Promise<Set<string>> {
  const current = await loadUnderlines();
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  await AsyncStorage.setItem(UNDERLINES_KEY, JSON.stringify([...current]));
  return current;
}

