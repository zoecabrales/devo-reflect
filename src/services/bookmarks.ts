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
