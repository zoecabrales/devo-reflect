import { GET, OPTIONS } from "@/api/public/verse-of-the-day";
import { COMMUNITY_VERSES } from "@/src/constants/communityVerses";
import {
  getCommunityVerse,
  isValidDate,
  secondsUntilPHTMidnight,
} from "@/src/utils/communityVerse";

describe("COMMUNITY_VERSES", () => {
  it("has clean text: no inline footnotes and balanced double quotes", () => {
    for (const v of COMMUNITY_VERSES) {
      expect(v.text).not.toMatch(/\d+:\d+/);
      expect(v.text.split("“").length).toBe(v.text.split("”").length);
    }
  });

  it("has a devotional with a title, body and group question for every verse", () => {
    for (const v of COMMUNITY_VERSES) {
      expect(v.devotional.title.trim()).not.toBe("");
      expect(v.devotional.body.trim()).not.toBe("");
      expect(v.devotional.question.trim()).toMatch(/\?$/);
    }
  });

  it("lists every reference once", () => {
    const refs = COMMUNITY_VERSES.map((v) => v.reference);
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe("getCommunityVerse", () => {
  it("is the same for everyone on a given day", () => {
    expect(getCommunityVerse("2026-11-20")).toBe(getCommunityVerse("2026-11-20"));
  });

  it("goes through every verse before one comes back", () => {
    const n = COMMUNITY_VERSES.length;
    const start = Date.parse("2026-01-01T00:00:00Z");
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      seen.add(getCommunityVerse(date).reference);
    }
    expect(seen.size).toBe(n);
  });
});

describe("isValidDate", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    expect(isValidDate("2026-11-20")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-1-5")).toBe(false);
    expect(isValidDate("today")).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });
});

describe("secondsUntilPHTMidnight", () => {
  it("counts down to midnight in the Philippines", () => {
    // 2026-11-20 23:00 PHT = 15:00 UTC → one hour left
    expect(secondsUntilPHTMidnight(Date.parse("2026-11-20T15:00:00Z"))).toBe(3600);
    // Exactly midnight PHT → a full day
    expect(secondsUntilPHTMidnight(Date.parse("2026-11-20T16:00:00Z"))).toBe(86_400);
  });
});

describe("GET /api/public/verse-of-the-day", () => {
  const CMS_KEY = "dr_test-church-cms-key-0123456789";
  const LUMEN_KEY = "dr_test-lumen-key-abcdefghijklmn";
  const endpoint = (key?: string, origin = "https://devo.example.com") =>
    new Request(`${origin}/api/public/verse-of-the-day${key ? `?key=${key}` : ""}`);

  beforeEach(() => {
    process.env.VOTD_API_KEYS = `church-cms:${CMS_KEY}, lumen:${LUMEN_KEY}`;
  });
  afterEach(() => {
    delete process.env.PUBLIC_APP_URL;
    delete process.env.VOTD_API_KEYS;
  });

  it("returns today's verse with the button, open CORS and CDN caching", async () => {
    const res = await GET(endpoint(CMS_KEY));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toMatch(/^public, max-age=\d+, s-maxage=\d+$/);
    const body = await res.json();
    expect(body).toEqual({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      reference: expect.any(String),
      text: expect.any(String),
      version: "WEB",
      theme: expect.any(String),
      devotional: { title: expect.any(String), body: expect.any(String), question: expect.any(String) },
      url: `https://devo.example.com/guest-public?date=${body.date}&ref=church-cms`,
      cta: { label: "Eager to be encouraged?", url: body.url },
    });
    expect(body).toMatchObject(getCommunityVerse(body.date));
  });

  it("tags the links with the app the key belongs to", async () => {
    const body = await (await GET(endpoint(LUMEN_KEY))).json();
    expect(body.url).toBe(`https://devo.example.com/guest-public?date=${body.date}&ref=lumen`);
  });

  it("refuses a missing or unknown key, without caching the refusal", async () => {
    for (const key of [undefined, "dr_not-a-real-key-000000000000", CMS_KEY.slice(0, -1)]) {
      const res = await GET(endpoint(key));
      expect(res.status).toBe(401);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(await res.json()).toEqual({ error: expect.any(String) });
    }
  });

  it("refuses everything when no keys are configured", async () => {
    delete process.env.VOTD_API_KEYS;
    expect((await GET(endpoint(CMS_KEY))).status).toBe(401);
  });

  it("ignores malformed key entries", async () => {
    process.env.VOTD_API_KEYS = "no-colon-here,short:abc,Bad Name:dr_valid-length-key-0123456789";
    expect((await GET(endpoint("abc"))).status).toBe(401);
    expect((await GET(endpoint("dr_valid-length-key-0123456789"))).status).toBe(401);
  });

  it("links to PUBLIC_APP_URL when it is set", async () => {
    process.env.PUBLIC_APP_URL = "https://app.example.org";
    const body = await (await GET(endpoint(CMS_KEY, "https://preview.example.com"))).json();
    expect(body.url).toBe(`https://app.example.org/guest-public?date=${body.date}&ref=church-cms`);
  });

  it("answers CORS preflight", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
  });
});
