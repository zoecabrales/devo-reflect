// GET /api/public/verse-of-the-day?key=<API key>
//
// A read-only Verse of the Day for other apps to show, first of all a church
// management system. The verses are about church life (discipleship, groups,
// serving, leadership, mission) rather than personal devotion; see
// scripts/build-community-verses.js. No sign-in, no Firebase, no user data.
//
// API keys: each app that uses this gets its own key, kept in the Vercel env
// var VOTD_API_KEYS as comma-separated "name:key" pairs, e.g.
//   VOTD_API_KEYS=church-cms:dr_3kq…,lumen:dr_9xz…
// Make a key with `node scripts/generate-api-key.js`. Removing a pair revokes
// that app's key without touching the others. The name becomes the ?ref= tag
// on the links below, so visits can be told apart. Without VOTD_API_KEYS
// every request is refused. The key is only read from the URL (not a header)
// because Vercel's CDN caches by URL: a header key could let a cached answer
// reach a request without one.
//
// Responds with:
//   {
//     date: "2026-11-20",              // PHT calendar date; changes at midnight PHT
//     reference: "Hebrews 10:24-25",
//     text: "Let’s consider how…",
//     version: "WEB",                  // World English Bible, public domain
//     theme: "Fellowship",
//     devotional: { title: "…", body: "…", question: "…" },  // question: for groups
//     url: "https://…/guest-public?date=2026-11-20&ref=church-cms",
//     cta: { label: "Eager to be encouraged?", url: (same as url) }
//   }
// or 401 { error: "…" } for a missing or unknown key.
//
// url is the public page for this day's verse and devotional
// (app/guest-public.tsx, no sign-in needed), so a dashboard can make its whole
// card a link; it stays correct even if the dashboard shows a cached copy
// after midnight. It is on the site serving this endpoint, or on
// PUBLIC_APP_URL when that Vercel env var is set. Any website may call
// it (open CORS). Responses are cached by Vercel's CDN until the next midnight
// PHT, for at most an hour, so repeated calls cost almost nothing (a revoked
// key may keep working until its cached answer expires).

import { createHash, timingSafeEqual } from "node:crypto";
import { getPHTDateString } from "../../src/utils/dailyVerse";
import { getCommunityVerse, secondsUntilPHTMidnight } from "../../src/utils/communityVerse";

const CTA_LABEL = "Eager to be encouraged?";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

const sha256 = (text: string) => createHash("sha256").update(text).digest();

/** VOTD_API_KEYS → [{ name, key }]. Malformed pairs are ignored. */
function configuredKeys(): { name: string; key: string }[] {
  return (process.env.VOTD_API_KEYS ?? "")
    .split(",")
    .map((pair) => {
      const i = pair.indexOf(":");
      return { name: pair.slice(0, i).trim(), key: pair.slice(i + 1).trim() };
    })
    .filter((k) => /^[a-z0-9-]+$/.test(k.name) && k.key.length >= 16);
}

/** The app name for a key, or null. Compares in constant time. */
export function appForKey(key: string | null): string | null {
  if (!key) return null;
  const given = sha256(key);
  let found: string | null = null;
  for (const k of configuredKeys()) {
    if (timingSafeEqual(given, sha256(k.key))) found = k.name;
  }
  return found;
}

/** The public page for one day's verse, tagged with the app it came from. */
function pageUrl(request: Request, date: string, app: string): string {
  const base = process.env.PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
  const url = new URL("/guest-public", base);
  url.searchParams.set("date", date);
  url.searchParams.set("ref", app);
  return url.toString();
}

export async function GET(request: Request): Promise<Response> {
  const app = appForKey(new URL(request.url).searchParams.get("key"));
  if (!app) {
    return json(401, { error: "Missing or invalid API key (?key=…)." }, "no-store");
  }
  const date = getPHTDateString();
  const verse = getCommunityVerse(date);
  const maxAge = Math.min(3600, secondsUntilPHTMidnight());
  const url = pageUrl(request, date, app);
  return json(
    200,
    {
      date,
      reference: verse.reference,
      text: verse.text,
      version: "WEB",
      theme: verse.theme,
      devotional: verse.devotional,
      url,
      cta: { label: CTA_LABEL, url },
    },
    `public, max-age=${maxAge}, s-maxage=${maxAge}`,
  );
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
