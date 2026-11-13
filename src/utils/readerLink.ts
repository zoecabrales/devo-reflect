/**
 * Link that opens the Bible reader at a verse "in context": the verse (or
 * all verses of a passage) is marked, the verses around it are shaded, and
 * a banner gives the book's setting. Nothing is saved to the user's data.
 */
export function contextHref(opts: {
  bookId: string;
  chapter: number;
  verse: number;
  /** Every verse of a multi-verse passage, if more than one. */
  verses?: number[] | null;
  /** Extra query, e.g. "&highlight=true". */
  extra?: string;
}): `/(tabs)/bible-browser?${string}` {
  const verses =
    opts.verses && opts.verses.length > 1
      ? `&verses=${opts.verses.join(",")}`
      : "";
  return `/(tabs)/bible-browser?bookId=${opts.bookId}&chapter=${opts.chapter}&verse=${opts.verse}${verses}&context=1${opts.extra ?? ""}`;
}

/** "Genesis 12:1–3" → chapter 12, verse 1 (for opening the reader). */
export function passageTarget(passage: string): { chapter: number; verse?: number } {
  // Skip the book name (which may start with a digit, e.g. "1 John")
  const m = passage.match(/(\d+)(?::(\d+))?(?:[–-].*)?$/);
  if (!m) return { chapter: 1 };
  return {
    chapter: parseInt(m[1], 10),
    verse: m[2] ? parseInt(m[2], 10) : undefined,
  };
}

