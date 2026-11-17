import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseEsv } from "@/api/chapter";
import { DAILY_VERSES } from "@/src/constants/dailyVerses";
import {
  fetchChapter,
  getDailyVerseRef,
  OnlineChapterError,
} from "@/src/services/bible";
import { auth } from "@/src/services/firebase";

describe("Verse of the Day", () => {
  it("every verse in the list exists in the bundled Bible", async () => {
    for (const ref of DAILY_VERSES) {
      // Uses the same parsing as the app; throws on an unknown book
      const { book, chapter, verse } = getDailyVerseRefFor(ref);
      const verses = await fetchChapter(book, chapter, "en-asv");
      expect({ ref, found: verses.some((v) => v.verse === verse) }).toEqual({
        ref,
        found: true,
      });
    }
  });

  it("is the same for the same account and day", () => {
    expect(getDailyVerseRef("user-a", "2026-11-17")).toEqual(
      getDailyVerseRef("user-a", "2026-11-17"),
    );
  });

  it("doesn't repeat a verse until the whole list has been shown", () => {
    const n = DAILY_VERSES.length;
    const seen = new Set<string>();
    const start = Date.UTC(2026, 0, 1);
    for (let i = 0; i < n; i++) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      const r = getDailyVerseRef("user-a", date);
      seen.add(`${r.book} ${r.chapter}:${r.verse}`);
    }
    expect(seen.size).toBe(n);
  });

  it("gives different accounts different orders", () => {
    const dates = ["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
    const a = dates.map((d) => getDailyVerseRef("user-a", d).verse);
    const b = dates.map((d) => getDailyVerseRef("user-b", d).verse);
    expect(a).not.toEqual(b);
  });
});

/**
 * The reference getDailyVerseRef would return for a list entry: find a date
 * isn't practical, so parse it the same way (label → book id).
 */
function getDailyVerseRefFor(ref: string) {
  const { BIBLE_BOOKS } = require("@/src/constants/bibleBooks");
  const m = /^(.+) (\d+):(\d+)$/.exec(ref);
  const book = m && BIBLE_BOOKS.find((b: { label: string }) => b.label === m[1]);
  if (!m || !book) throw new Error(`Bad Verse of the Day reference: ${ref}`);
  return { book: book.id as string, chapter: Number(m[2]), verse: Number(m[3]) };
}

describe("bundled versions", () => {
  it("numbers verses from 1", async () => {
    const verses = await fetchChapter("john", 3, "en-kjv");
    expect(verses[0].verse).toBe(1);
    expect(verses[15].verse).toBe(16);
    expect(verses[15].text).toMatch(/God so loved the world/);
  });
});

describe("parseEsv", () => {
  it("splits ESV text into numbered verses", () => {
    const text =
      "John 3\n\n  [1] Now there was a man of the Pharisees named Nicodemus,\n    a ruler of the Jews. [2] This man came to Jesus by night\n\n";
    expect(parseEsv(text)).toEqual([
      { verse: 1, text: "Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews." },
      { verse: 2, text: "This man came to Jesus by night" },
    ]);
  });

  it("keeps the real numbers when the ESV leaves a verse out", () => {
    // Matthew 17:21 is not in the ESV text
    const verses = parseEsv("[20] He said to them… [22] As they were gathering");
    expect(verses.map((v) => v.verse)).toEqual([20, 22]);
  });

  it("returns nothing for text without verse numbers", () => {
    expect(parseEsv("No passage found")).toEqual([]);
  });
});

describe("ESV chapters", () => {
  const fetchMock = jest.fn();
  const okResponse = (verses: { verse: number; text: string }[]) => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ verses }),
  });
  const versesOf = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ verse: i + 1, text: `v${i + 1}` }));

  beforeEach(async () => {
    await AsyncStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    (auth as { currentUser: unknown }).currentUser = {
      getIdToken: async () => "test-token",
    };
  });

  afterAll(() => {
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("asks the server with the sign-in token, then reads from the device", async () => {
    fetchMock.mockResolvedValue(okResponse(versesOf(36)));

    const first = await fetchChapter("john", 3, "esv");
    expect(first).toHaveLength(36);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chapter?version=esv&book=john&chapter=3");
    expect(init.headers.Authorization).toBe("Bearer test-token");

    const again = await fetchChapter("john", 3, "esv");
    expect(again).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps no more than 500 verses on the device, dropping the oldest", async () => {
    // Psalm 119 (176) + three 150-verse chapters = 626 verses read
    fetchMock.mockResolvedValueOnce(okResponse(versesOf(176)));
    await fetchChapter("psalms", 119, "esv");
    for (const ch of [1, 2, 3]) {
      fetchMock.mockResolvedValueOnce(okResponse(versesOf(150)));
      await fetchChapter("genesis", ch, "esv");
    }

    const cached = JSON.parse((await AsyncStorage.getItem("@online_chapters"))!);
    const total = cached.reduce((n: number, e: { verses: unknown[] }) => n + e.verses.length, 0);
    expect(total).toBeLessThanOrEqual(500);
    expect(cached.map((e: { key: string }) => e.key)).toEqual([
      "esv/genesis/3",
      "esv/genesis/2",
      "esv/genesis/1",
    ]);
  });

  it("says 'offline' when the request gets no reply", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(fetchChapter("john", 1, "esv")).rejects.toMatchObject({
      reason: "offline",
    });
  });

  it("says 'unavailable' when the server can't help", async () => {
    // e.g. the local dev server, which has no /api and returns the app page
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "text/html" },
      json: async () => ({}),
    });
    const err = await fetchChapter("john", 1, "esv").catch((e) => e);
    expect(err).toBeInstanceOf(OnlineChapterError);
    expect(err.reason).toBe("unavailable");
  });

  it("needs a signed-in user", async () => {
    (auth as { currentUser: unknown }).currentUser = null;
    await expect(fetchChapter("john", 1, "esv")).rejects.toThrow(/Sign in/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("chosen version", () => {
  // The choice is cached in the module, so each test loads a fresh copy
  const freshBible = () => {
    let mod!: typeof import("@/src/services/bible");
    jest.isolateModules(() => {
      mod = require("@/src/services/bible");
    });
    return mod;
  };

  beforeEach(() => AsyncStorage.clear());

  it("is ASV the first time", async () => {
    expect((await freshBible().getChosenVersion()).id).toBe("en-asv");
  });

  it("is remembered after the app restarts", async () => {
    const first = freshBible();
    first.setChosenVersion(first.BIBLE_VERSIONS.find((v) => v.id === "esv")!);
    expect((await first.getChosenVersion()).id).toBe("esv");
    await new Promise((r) => setTimeout(r, 0)); // let the save finish

    expect((await freshBible().getChosenVersion()).id).toBe("esv");
  });

  it("falls back to ASV if the saved version no longer exists", async () => {
    await AsyncStorage.setItem("@bible_version", "en-removed");
    expect((await freshBible().getChosenVersion()).id).toBe("en-asv");
  });
});

describe("Verse of the Day version", () => {
  const bible = require("@/src/services/bible") as typeof import("@/src/services/bible");
  const byId = (id: string) => bible.BIBLE_VERSIONS.find((v) => v.id === id)!;
  const fetchMock = jest.fn();

  beforeEach(async () => {
    await AsyncStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    bible.setChosenVersion(byId("en-asv"));
  });

  afterAll(() => {
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("is in the ASV by default", async () => {
    expect((await bible.fetchDailyVerse("user-a")).version).toBe("ASV");
  });

  it("follows the version chosen in the reader", async () => {
    bible.setChosenVersion(byId("en-kjv"));
    const verse = await bible.fetchDailyVerse("user-a");
    expect(verse.version).toBe("KJV");
    const kjv = await bible.fetchChapter(verse.book, verse.chapter, "en-kjv");
    expect(verse.text).toBe(kjv.find((v) => v.verse === verse.verse)!.text);
  });

  it("uses the ASV while the ESV can't be reached, then the ESV next time", async () => {
    (auth as { currentUser: unknown }).currentUser = {
      getIdToken: async () => "test-token",
    };
    bible.setChosenVersion(byId("esv"));

    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect((await bible.fetchDailyVerse("user-a")).version).toBe("ASV");

    const ref = bible.getDailyVerseRef("user-a");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ verses: [{ verse: ref.verse, text: "ESV text" }] }),
    });
    const verse = await bible.fetchDailyVerse("user-a");
    expect(verse).toMatchObject({ version: "ESV", text: "ESV text" });
  });
});
