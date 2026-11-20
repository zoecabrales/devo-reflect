/**
 * Generates src/constants/communityVerses.ts, the verse list behind the public
 * Verse of the Day endpoint (api/public/verse-of-the-day.ts) that a church
 * management system shows to its staff and members, and the public page
 * app/guest-public.tsx.
 *
 * Unlike the app's own Verse of the Day (personal encouragement), these are
 * verses for church life: discipleship, small groups, unity, serving,
 * leadership, prayer, mission, generosity and worship. Each comes with a short
 * devotional and a question for groups, written in
 * scripts/community-devotionals/.
 *
 * The text is the World English Bible as published by eBible.org (public
 * domain), not the app's bundled WEB, which is missing parts of many poetry
 * and quoted verses. It is copied into the generated file, so the endpoint
 * never loads Bible data. Quotation marks cut off by the start or end of a
 * passage are fixed, and psalm titles in verse 1 are left out.
 *
 * To change the list, edit THEMES below (and add a devotional for each new
 * verse), then run from the project root:
 *   curl -LO https://ebible.org/Scriptures/engwebp_vpl.zip && unzip engwebp_vpl.zip engwebp_vpl.txt
 *   node scripts/build-community-verses.js engwebp_vpl.txt
 * (don't commit the downloaded files). Adding or removing verses changes the
 * order the days go through.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/constants/communityVerses.ts");

// "Book chapter:verse" or a short range "Book chapter:first-last", with the
// book written as in BIBLE_BOOKS labels.
const THEMES = {
  Discipleship: [
    "Matthew 28:19-20",
    "2 Timothy 2:2",
    "Luke 9:23",
    "Matthew 4:19",
    "John 8:31-32",
    "John 15:8",
    "Colossians 1:28",
    "Colossians 2:6-7",
    "2 Timothy 3:16-17",
    "James 1:22",
    "Matthew 7:24",
    "1 Corinthians 11:1",
    "Titus 2:7-8",
    "2 Peter 3:18",
    "1 Timothy 4:7-8",
    "Philippians 3:13-14",
    "Romans 12:2",
    "Proverbs 27:17",
  ],
  Fellowship: [
    "Acts 2:42",
    "Acts 2:46-47",
    "Hebrews 10:24-25",
    "Ecclesiastes 4:9-10",
    "Ecclesiastes 4:12",
    "Matthew 18:20",
    "1 John 1:7",
    "Psalms 133:1",
    "Romans 12:10",
    "Romans 15:7",
    "Acts 4:32",
    "Philippians 1:3-5",
    "1 Thessalonians 5:11",
    "Colossians 3:16",
    "Malachi 3:16",
    "Proverbs 13:20",
    "Romans 1:11-12",
  ],
  Unity: [
    "Ephesians 4:3",
    "Ephesians 4:4-6",
    "1 Corinthians 12:27",
    "1 Corinthians 12:12",
    "Romans 12:4-5",
    "John 17:21",
    "Philippians 2:2",
    "1 Corinthians 1:10",
    "Colossians 3:14",
    "1 Peter 3:8",
    "Romans 15:5-6",
    "Galatians 3:28",
    "Ephesians 4:15-16",
  ],
  Serving: [
    "1 Peter 4:10",
    "Galatians 5:13",
    "Mark 10:45",
    "Romans 12:6-8",
    "1 Corinthians 12:4-6",
    "1 Corinthians 12:7",
    "1 Corinthians 15:58",
    "Galatians 6:9",
    "Colossians 3:23-24",
    "Ephesians 4:11-12",
    "John 13:14-15",
    "Philippians 2:3-4",
    "Hebrews 6:10",
    "Matthew 25:40",
  ],
  "One Another": [
    "John 13:34-35",
    "Galatians 6:2",
    "Ephesians 4:32",
    "Ephesians 4:2",
    "Colossians 3:13",
    "James 5:16",
    "1 Thessalonians 5:14",
    "Hebrews 3:13",
    "1 Peter 4:8",
    "1 Peter 4:9",
    "Romans 13:8",
    "1 John 4:11-12",
    "Romans 12:15-16",
    "Galatians 6:1",
  ],
  Leadership: [
    "1 Peter 5:2-3",
    "Acts 20:28",
    "Hebrews 13:17",
    "Hebrews 13:7",
    "1 Timothy 4:12",
    "Jeremiah 3:15",
    "Proverbs 11:14",
    "Proverbs 15:22",
    "John 21:17",
    "Titus 1:9",
    "James 3:1",
    "2 Timothy 4:2",
    "Psalms 78:72",
    "Mark 9:35",
    "1 Corinthians 4:1-2",
    "1 Thessalonians 5:12-13",
  ],
  Prayer: [
    "Matthew 18:19",
    "Acts 1:14",
    "Acts 12:5",
    "Acts 4:31",
    "Ephesians 6:18",
    "1 Timothy 2:1-2",
    "Colossians 4:2",
    "2 Chronicles 7:14",
    "1 Thessalonians 5:16-18",
  ],
  Mission: [
    "Acts 1:8",
    "Matthew 5:14-16",
    "Romans 10:14-15",
    "Matthew 9:37-38",
    "Mark 16:15",
    "1 Peter 3:15",
    "2 Corinthians 5:20",
    "Isaiah 6:8",
    "Colossians 4:5-6",
    "Philippians 1:27",
    "Psalms 96:3",
    "Luke 19:10",
    "Romans 1:16",
  ],
  Generosity: [
    "2 Corinthians 9:7",
    "Acts 20:35",
    "2 Corinthians 8:9",
    "Luke 6:38",
    "Malachi 3:10",
    "1 Timothy 6:18",
    "Hebrews 13:16",
    "Proverbs 3:9-10",
    "1 Chronicles 29:14",
    "Luke 16:10",
  ],
  Worship: [
    "Psalms 34:3",
    "Psalms 95:6",
    "Psalms 100:4",
    "Psalms 122:1",
    "Ephesians 5:19-20",
    "Hebrews 12:28",
    "Psalms 22:22",
    "John 4:23-24",
    "Psalms 150:6",
  ],
  "The Church": [
    "Matthew 16:18",
    "Ephesians 3:20-21",
    "1 Corinthians 3:9",
    "1 Peter 2:5",
    "1 Peter 2:9",
    "Ephesians 2:19-20",
    "Colossians 1:18",
    "Philippians 1:6",
    "Hebrews 13:20-21",
    "1 Corinthians 14:26",
    "1 Corinthians 14:40",
  ],
};

const MAX_VERSES = 3;

// Psalm titles that eBible.org's text puts at the start of verse 1.
const PSALM_TITLES = {
  "Psalms 122:1": "A Song of Ascents. By David.",
  "Psalms 133:1": "A Song of Ascents. By David.",
};

const DEVOTIONALS = require("./community-devotionals");

const sourcePath = process.argv[2];
if (!sourcePath) {
  throw new Error("Usage: node scripts/build-community-verses.js <path to engwebp_vpl.txt>");
}
// "GEN 1:1 In the beginning…" → WEB.get("GEN")["1:1"]; books in canonical order
const WEB = new Map();
for (const line of fs.readFileSync(sourcePath, "utf8").split(/\r?\n/)) {
  const m = /^(\w{3}) (\d+:\d+) (.*)$/.exec(line);
  if (!m) continue;
  if (!WEB.has(m[1])) WEB.set(m[1], {});
  WEB.get(m[1])[m[2]] = m[3];
}
const WEB_CODES = [...WEB.keys()];
if (WEB_CODES.length !== 66) throw new Error(`Expected 66 books in ${sourcePath}, found ${WEB_CODES.length}`);

const booksSource = fs.readFileSync(path.join(ROOT, "src/constants/bibleBooks.ts"), "utf8");
const BOOKS = [...booksSource.matchAll(/id:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)].map((m) => ({
  id: m[1],
  label: m[2],
}));
if (BOOKS.length !== 66) throw new Error(`Expected 66 books, found ${BOOKS.length}`);

/**
 * Fixes double quotation marks cut off by the passage's start or end: a
 * closing mark with no opening one is removed, and an opening mark that is
 * never closed gets a closing mark at the end.
 */
function balanceQuotes(text) {
  const chars = [...text];
  const open = [];
  const stray = new Set();
  chars.forEach((c, i) => {
    if (c === "“") open.push(i);
    else if (c === "”") {
      if (open.length) open.pop();
      else stray.add(i);
    }
  });
  const kept = chars.filter((_, i) => !stray.has(i)).join("");
  return open.length ? kept + "”".repeat(open.length) : kept;
}

const seen = new Set();
const entries = [];
for (const [theme, refs] of Object.entries(THEMES)) {
  for (const reference of refs) {
    const m = /^(.+) (\d+):(\d+)(?:-(\d+))?$/.exec(reference);
    const book = m && BOOKS.find((b) => b.label === m[1]);
    if (!m || !book) throw new Error(`Bad reference: ${reference}`);
    if (seen.has(reference)) throw new Error(`Listed twice: ${reference}`);
    seen.add(reference);
    const chapter = Number(m[2]);
    const first = Number(m[3]);
    const last = m[4] ? Number(m[4]) : first;
    if (last < first || last - first + 1 > MAX_VERSES) {
      throw new Error(`Range must be 1–${MAX_VERSES} verses: ${reference}`);
    }
    const code = WEB_CODES[BOOKS.indexOf(book)];
    const verses = [];
    for (let v = first; v <= last; v++) verses.push(WEB.get(code)[`${chapter}:${v}`]);
    if (verses.some((v) => !v || !v.trim())) throw new Error(`Missing in the WEB text: ${reference}`);
    let text = verses.map((v) => v.trim()).join(" ");
    const title = PSALM_TITLES[reference];
    if (title) {
      if (!text.startsWith(title)) throw new Error(`Psalm title not found in ${reference}`);
      text = text.slice(title.length).trim();
    }
    if (/\d+:\d+/.test(text)) throw new Error(`Footnote marker in ${reference}: ${text}`);
    const devotional = DEVOTIONALS[reference];
    if (!devotional) throw new Error(`No devotional for ${reference} in scripts/community-devotionals/`);
    entries.push({ reference, theme, text: balanceQuotes(text).trim(), devotional });
  }
}

const extra = Object.keys(DEVOTIONALS).filter((r) => !seen.has(r));
if (extra.length) throw new Error(`Devotionals for verses not in THEMES: ${extra.join(", ")}`);

const body = entries
  .map(
    (e) =>
      `  {\n    reference: ${JSON.stringify(e.reference)},\n    theme: ${JSON.stringify(e.theme)},\n    text: ${JSON.stringify(e.text)},\n    devotional: {\n      title: ${JSON.stringify(e.devotional.title)},\n      body: ${JSON.stringify(e.devotional.body)},\n      question: ${JSON.stringify(e.devotional.question)},\n    },\n  },`,
  )
  .join("\n");

fs.writeFileSync(
  OUT,
  `// Generated by scripts/build-community-verses.js; edit the list there, not here.
//
// Verses for church life (discipleship, groups, serving, leadership, mission…)
// served by the public Verse of the Day endpoint, api/public/verse-of-the-day.ts.
// Text: World English Bible, from eBible.org (public domain).

export interface CommunityDevotional {
  title: string;
  /** A short reflection, a few sentences */
  body: string;
  /** A question for a small group or team to talk about */
  question: string;
}

export interface CommunityVerse {
  /** e.g. "Hebrews 10:24-25" */
  reference: string;
  theme: string;
  text: string;
  devotional: CommunityDevotional;
}

export const COMMUNITY_VERSES: CommunityVerse[] = [
${body}
];
`,
);
console.log(`Wrote ${entries.length} verses to ${path.relative(ROOT, OUT)}`);
