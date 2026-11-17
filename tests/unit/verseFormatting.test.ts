import {
  bookmarkId,
  bookmarkRef,
  formatVerseNumbers,
  versesOf,
} from "@/src/services/bookmarks";
import { isValidEmail, normaliseEmail } from "@/src/services/connections";
import { contextHref, passageTarget } from "@/src/utils/readerLink";
import { dateFromKey, dateKeyOf } from "@/src/utils/dateKey";

describe("formatVerseNumbers", () => {
  it("shows a single verse", () => {
    expect(formatVerseNumbers([16])).toBe("16");
  });

  it("collapses consecutive verses into a range", () => {
    expect(formatVerseNumbers([16, 17, 18])).toBe("16–18");
  });

  it("sorts, removes duplicates and keeps gaps", () => {
    expect(formatVerseNumbers([20, 16, 18, 17, 17])).toBe("16–18, 20");
  });
});

describe("bookmarks", () => {
  it("uses the verses list when there is one, else the single verse", () => {
    expect(versesOf({ verse: 3, verses: [3, 4] })).toEqual([3, 4]);
    expect(versesOf({ verse: 3, verses: [] })).toEqual([3]);
    expect(versesOf({ verse: 3 })).toEqual([3]);
  });

  it("formats a reference", () => {
    expect(
      bookmarkRef({ bookLabel: "John", chapter: 3, verse: 16, verses: [16, 17, 18] }),
    ).toBe("John 3:16–18");
  });

  it("gives the same id whatever order the verses were picked in", () => {
    expect(bookmarkId("john", 3, [18, 16, 17])).toBe("john-3-16_17_18");
    expect(bookmarkId("john", 3, [16, 17, 18, 16])).toBe("john-3-16_17_18");
  });
});

describe("readerLink", () => {
  it("finds the chapter and verse of a passage", () => {
    expect(passageTarget("Genesis 12:1–3")).toEqual({ chapter: 12, verse: 1 });
    expect(passageTarget("1 John 4:8")).toEqual({ chapter: 4, verse: 8 });
    expect(passageTarget("Psalm 23")).toEqual({ chapter: 23, verse: undefined });
    expect(passageTarget("nonsense")).toEqual({ chapter: 1 });
  });

  it("builds a read-in-context link", () => {
    expect(contextHref({ bookId: "john", chapter: 3, verse: 16 })).toBe(
      "/(tabs)/bible-browser?bookId=john&chapter=3&verse=16&context=1",
    );
    expect(
      contextHref({ bookId: "john", chapter: 3, verse: 16, verses: [16, 17], extra: "&x=1" }),
    ).toBe(
      "/(tabs)/bible-browser?bookId=john&chapter=3&verse=16&verses=16,17&context=1&x=1",
    );
  });
});

describe("dateKey", () => {
  it("round-trips a day key", () => {
    expect(dateKeyOf(dateFromKey("2026-03-09").getTime())).toBe("2026-03-09");
  });

  it("pads months and days", () => {
    expect(dateKeyOf(new Date(2026, 0, 5, 23, 59).getTime())).toBe("2026-01-05");
  });
});

describe("Brethren email checks", () => {
  it("normalises email addresses", () => {
    expect(normaliseEmail("  Friend@Example.COM ")).toBe("friend@example.com");
  });

  it("accepts real-looking addresses and rejects others", () => {
    expect(isValidEmail("friend@example.com")).toBe(true);
    expect(isValidEmail("friend@example")).toBe(false);
    expect(isValidEmail("friend example@x.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
