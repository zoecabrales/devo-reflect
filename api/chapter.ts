// GET /api/chapter?version=esv&book=john&chapter=3
//
// Fetches one chapter of a licensed Bible version:
//   esv              → Crossway's ESV API (Vercel env var ESV_API_KEY)
//   nasb, nkjv, nlt  → API.Bible (Vercel env var API_BIBLE_KEY)
// The keys stay here on the server and are never sent to the app. Only
// signed-in users may call this, so the public URL can't be used to run down
// the keys' limits (API.Bible's free plan: 5,000 requests a month).
//
// Responds with { verses: [{ verse, text }], fumsToken? }. fumsToken is
// API.Bible's usage-reporting token, which the app reports when the chapter
// is shown. Nothing is cached or stored here; the app keeps a small cache on
// the device (at most 500 verses, cleared after 14 days).

import { BIBLE_BOOKS } from "../src/constants/bibleBooks";

interface Verse {
  verse: number;
  text: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Per-user and licensed text: never keep it in a shared cache
      "Cache-Control": "private, no-store",
    },
  });
}

/** True if the Firebase ID token belongs to a current account. */
async function isSignedIn(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!idToken || !apiKey) return false;
  // Firebase checks the token's signature and expiry and returns the account
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { users?: unknown[] };
  return Array.isArray(data.users) && data.users.length > 0;
}

/** API.Bible's id for each version on our plan. */
const API_BIBLE_IDS: Record<string, string> = {
  nasb: "b8ee27bcd1cae43a-01", // New American Standard Bible 1995
  nkjv: "63097d2a0a2f7db3-01", // New King James Version
  nlt: "d6e14a625393b4da-01", // New Living Translation
};

/** USFM book codes (API.Bible's book ids), in the order of BIBLE_BOOKS. */
const USFM_CODES = (
  "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB " +
  "PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP " +
  "HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI " +
  "2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split(" ");

/** API.Bible's code for one of our book ids, e.g. "john" → "JHN". */
export function usfmCode(bookId: string): string | undefined {
  const i = BIBLE_BOOKS.findIndex((b) => b.id === bookId);
  return i >= 0 ? USFM_CODES[i] : undefined;
}

/**
 * Plain text with verse numbers in brackets, "[1] In the beginning… [2] The
 * earth…", as both the ESV API and API.Bible return it → verses. Verses a
 * version leaves out (e.g. Matthew 17:21) are simply missing.
 */
export function parseVerses(passage: string): Verse[] {
  const parts = passage.split(/\[(\d+)\]/);
  const verses: Verse[] = [];
  // parts: [before, num, text, num, text, …]
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const text = parts[i + 1].replace(/\s+/g, " ").trim();
    if (text) verses.push({ verse: Number(parts[i]), text });
  }
  return verses;
}

async function fetchEsv(bookLabel: string, chapter: number, single: boolean) {
  const key = process.env.ESV_API_KEY;
  if (!key) throw new Error("ESV_API_KEY is not set");
  // A one-chapter book is asked for by name: "Jude 1" would mean verse 1
  const q = single ? bookLabel : `${bookLabel} ${chapter}`;
  const params = new URLSearchParams({
    q,
    "include-passage-references": "false",
    "include-verse-numbers": "true",
    "include-first-verse-numbers": "true",
    "include-footnotes": "false",
    "include-footnote-body": "false",
    "include-headings": "false",
    "include-short-copyright": "false",
    "include-copyright": "false",
    "include-passage-horizontal-lines": "false",
    "include-heading-horizontal-lines": "false",
    "include-selahs": "true",
    "indent-paragraphs": "0",
    "indent-poetry": "false",
    "indent-declares": "0",
    "indent-psalm-doxology": "0",
    "line-length": "0",
  });
  const res = await fetch(`https://api.esv.org/v3/passage/text/?${params}`, {
    headers: { Authorization: `Token ${key}` },
  });
  if (!res.ok) throw new Error(`ESV API ${res.status}`);
  const data = (await res.json()) as { passages?: string[] };
  return parseVerses((data.passages ?? []).join(" "));
}

async function fetchApiBible(bibleId: string, bookId: string, chapter: number) {
  const key = process.env.API_BIBLE_KEY;
  if (!key) throw new Error("API_BIBLE_KEY is not set");
  const code = usfmCode(bookId);
  if (!code) throw new Error(`No USFM code for ${bookId}`);
  const params = new URLSearchParams({
    "content-type": "text",
    "include-notes": "false",
    "include-titles": "false",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
    "include-verse-spans": "false",
  });
  const res = await fetch(
    `https://rest.api.bible/v1/bibles/${bibleId}/chapters/${code}.${chapter}?${params}`,
    { headers: { "api-key": key } },
  );
  if (!res.ok) throw new Error(`API.Bible ${res.status}`);
  const data = (await res.json()) as {
    data?: { content?: string };
    meta?: { fumsToken?: string };
  };
  return {
    verses: parseVerses(data.data?.content ?? ""),
    fumsToken: data.meta?.fumsToken,
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const version = url.searchParams.get("version");
  const book = BIBLE_BOOKS.find((b) => b.id === url.searchParams.get("book"));
  const chapter = Number(url.searchParams.get("chapter"));

  if (version !== "esv" && !(version && API_BIBLE_IDS[version])) {
    return json(400, { error: "unknown version" });
  }
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return json(400, { error: "unknown chapter" });
  }
  if (!(await isSignedIn(request))) return json(401, { error: "sign in" });

  try {
    const { verses, fumsToken } =
      version === "esv"
        ? { verses: await fetchEsv(book.label, chapter, book.chapters === 1), fumsToken: undefined }
        : await fetchApiBible(API_BIBLE_IDS[version!], book.id, chapter);
    if (verses.length === 0) return json(502, { error: "empty passage" });
    return json(200, fumsToken ? { verses, fumsToken } : { verses });
  } catch (e) {
    console.error(e);
    return json(502, { error: "unavailable" });
  }
}
