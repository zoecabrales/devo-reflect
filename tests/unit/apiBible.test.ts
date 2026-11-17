import AsyncStorage from "@react-native-async-storage/async-storage";
import { GET, parseVerses, usfmCode } from "@/api/chapter";
import { fetchChapter } from "@/src/services/bible";
import { auth } from "@/src/services/firebase";

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  headers: { get: () => "application/json" },
  json: async () => body,
});

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("usfmCode", () => {
  it("maps every book to API.Bible's code", () => {
    expect(usfmCode("genesis")).toBe("GEN");
    expect(usfmCode("song-of-solomon")).toBe("SNG");
    expect(usfmCode("psalms")).toBe("PSA");
    expect(usfmCode("john")).toBe("JHN");
    expect(usfmCode("1john")).toBe("1JN");
    expect(usfmCode("jude")).toBe("JUD");
    expect(usfmCode("revelation")).toBe("REV");
    expect(usfmCode("nope")).toBeUndefined();
  });
});

describe("parseVerses with API.Bible text", () => {
  it("keeps the NASB's bracketed text as part of the verse", () => {
    const text =
      "[20] And He *said to them… [21] [But this kind does not go out except by prayer and fasting.”]\n [22] And while";
    expect(parseVerses(text).map((v) => v.verse)).toEqual([20, 21, 22]);
    expect(parseVerses(text)[1].text).toBe(
      "[But this kind does not go out except by prayer and fasting.”]",
    );
  });

  it("joins poetry lines", () => {
    expect(parseVerses("   [1] O Lord, I have so many enemies;\n    so many are against me.\n")).toEqual([
      { verse: 1, text: "O Lord, I have so many enemies; so many are against me." },
    ]);
  });
});

describe("/api/chapter for API.Bible versions", () => {
  const request = (query: string, signedIn = true) =>
    new Request(`https://example.com/api/chapter?${query}`, {
      headers: signedIn ? { authorization: "Bearer id-token" } : {},
    });

  beforeEach(() => {
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "firebase-web-key";
    process.env.API_BIBLE_KEY = "test-api-bible-key";
  });

  it("fetches the chapter with the key on the server and returns the FUMS token", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ users: [{ localId: "u1" }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: { content: " [1] There was a man named Nicodemus.  [2] After dark…" },
          meta: { fumsToken: "fums-123" },
        }),
      );

    const res = await GET(request("version=nlt&book=john&chapter=3"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      verses: [
        { verse: 1, text: "There was a man named Nicodemus." },
        { verse: 2, text: "After dark…" },
      ],
      fumsToken: "fums-123",
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toMatch(
      /^https:\/\/rest\.api\.bible\/v1\/bibles\/d6e14a625393b4da-01\/chapters\/JHN\.3\?/,
    );
    expect(url).toContain("content-type=text");
    expect(url).toContain("include-titles=false");
    expect(init.headers["api-key"]).toBe("test-api-bible-key");
  });

  it("refuses requests without a sign-in", async () => {
    const res = await GET(request("version=nkjv&book=john&chapter=3", false));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses versions and chapters it doesn't know", async () => {
    expect((await GET(request("version=niv&book=john&chapter=3"))).status).toBe(400);
    expect((await GET(request("version=nasb&book=john&chapter=22"))).status).toBe(400);
  });

  it("says unavailable when API.Bible fails (e.g. the monthly limit)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ users: [{}] }))
      .mockResolvedValueOnce(jsonResponse({ error: "quota" }, false));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect((await GET(request("version=nasb&book=john&chapter=3"))).status).toBe(502);
    spy.mockRestore();
  });
});

describe("device cache for online versions", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (auth as { currentUser: unknown }).currentUser = {
      getIdToken: async () => "id-token",
    };
  });
  afterAll(() => {
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("fetches again once a cached chapter is 14 days old", async () => {
    const old = Date.now() - 15 * 86_400_000;
    await AsyncStorage.setItem(
      "@online_chapters",
      JSON.stringify([
        { key: "nlt/john/3", verses: [{ verse: 1, text: "old" }], savedAt: old },
      ]),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ verses: [{ verse: 1, text: "fresh" }] }),
    );
    expect((await fetchChapter("john", 3, "nlt"))[0].text).toBe("fresh");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses a cached chapter that is still fresh", async () => {
    await AsyncStorage.setItem(
      "@online_chapters",
      JSON.stringify([
        { key: "nlt/john/3", verses: [{ verse: 1, text: "cached" }], savedAt: Date.now() },
      ]),
    );
    expect((await fetchChapter("john", 3, "nlt"))[0].text).toBe("cached");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("FUMS usage reporting", () => {
  const appended: { src: string }[] = [];
  const fakeWindow: Record<string, unknown> = {};

  beforeAll(() => {
    Object.assign(globalThis, {
      window: fakeWindow,
      document: {
        createElement: () => ({}) as { src: string },
        head: { appendChild: (el: { src: string }) => appended.push(el) },
      },
    });
  });
  afterAll(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  });

  it("loads API.Bible's script once and reports each view", () => {
    let report!: typeof import("@/src/services/fums").reportFumsView;
    jest.isolateModules(() => {
      report = require("@/src/services/fums").reportFumsView;
    });
    report("token-a");
    report("token-b");
    report(undefined);

    expect(appended.map((s) => s.src)).toEqual([
      "https://pkg.api.bible/fumsV3.min.js",
    ]);
    const queued = (fakeWindow.fumsData as IArguments[]).map((a) => [...a]);
    expect(queued).toEqual([
      ["trackView", "token-a"],
      ["trackView", "token-b"],
    ]);
  });
});
