/**
 * Replaces one bundled Bible version (assets/bible/<version>/<book>.json) with
 * the text from an eBible.org USFM download.
 *
 * Why: the wldeh CDN text that scripts/build-bible-data.js downloads is
 * damaged for some versions. In WEB, about a quarter of the verses keep only
 * their first line (mostly poetry and quoted speech) and many have footnotes
 * mixed into the text. eBible.org publishes the same public-domain texts in
 * USFM, where notes, cross references and psalm titles are marked separately.
 *
 * What it keeps: the verse text only. Footnotes, cross references, headings,
 * psalm titles (\d) and Strong's numbers are left out, as the app has always
 * shown them. The verse numbering must match the files already bundled, so
 * bookmarks, highlights and reading progress stay on the same verses; the
 * script stops if any chapter or verse count differs.
 *
 * Optional check: pass eBible's verse-per-line file for the same edition
 * (<id>_vpl.txt from <id>_vpl.zip) and every verse must match it exactly,
 * apart from the psalm titles left out here.
 *
 * Usage (from the project root; don't commit the downloads):
 *   curl -LO https://eBible.org/Scriptures/eng-web_usfm.zip && unzip -d usfm eng-web_usfm.zip
 *   curl -LO https://eBible.org/Scriptures/eng-web_vpl.zip  && unzip eng-web_vpl.zip eng-web_vpl.txt
 *   node scripts/import-ebible-usfm.js usfm en-web eng-web_vpl.txt
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const [usfmDir, version, vplPath] = process.argv.slice(2);
if (!usfmDir || !version) {
  throw new Error("Usage: node scripts/import-ebible-usfm.js <usfm folder> <version, e.g. en-web> [vpl.txt]");
}
const outDir = path.join(ROOT, "assets/bible", version);
if (!fs.existsSync(outDir)) throw new Error(`No bundled version at ${outDir}`);

// The app's 66 book ids, in canonical order, and their USFM codes
const booksSource = fs.readFileSync(path.join(ROOT, "src/constants/bibleBooks.ts"), "utf8");
const BOOK_IDS = [...booksSource.matchAll(/id:\s*"([^"]+)",\s*label:/g)].map((m) => m[1]);
const USFM_CODES = (
  "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB " +
  "PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP " +
  "HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI " +
  "2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split(" ");
if (BOOK_IDS.length !== 66) throw new Error(`Expected 66 books, found ${BOOK_IDS.length}`);

// Paragraph markers whose whole line is not verse text: identification,
// titles, headings, psalm titles (d), acrostic letters (qa), remarks.
const SKIP_LINE = /^\\(id|ide|h|toc\d?|mt\d?|mte\d?|ms\d?|mr|s\d?|sr|r|d|sp|qa|rem|cl|cd|sts|usfm|is\d?|ip|ili\d?|imt\d?|io\d?|iot|ie)(\s|$)/;

const NOTE_START = "\u0001";
const NOTE_END = "\u0002";
const NOTE_RE = /\u0001(.*?)\u0002/g;

/**
 * Text for a verse the translation leaves out because it is missing from the
 * oldest manuscripts (e.g. WEB Acts 8:37): its footnote, in square brackets,
 * with "TR" (Textus Receptus) put in plain words.
 *   "TR adds Philip said, …" → "[Some manuscripts add: Philip said, …]"
 */
function emptyVerseNote(note) {
  const plain = note
    .replace(/^TR adds:?\s*/, "Some manuscripts add: ")
    .replace(/^TR places (.*?), and numbers /, "Some manuscripts place $1, and number ")
    .replace(/^TR\b/, "Some manuscripts");
  return `[${plain}]`;
}

/** One USFM book → { code, chapters: string[][] } (verse 1 at index 0). */
function parseBook(usfm, file) {
  let s = usfm.replace(/\r/g, "");
  // Cross references go. Footnotes are kept aside between NOTE_START and
  // NOTE_END as plain text: they're dropped later, unless a verse has
  // nothing else (a verse the translation leaves out, see emptyVerseNote).
  s = s.replace(/\\x .*?\\x\*/gs, "").replace(/\\fe .*?\\fe\*/gs, "");
  s = s.replace(
    /\\f .*?\\f\*/gs,
    (note) =>
      NOTE_START +
      note
        .replace(/^\\f \S+\s*/, "") // "\f + "
        .replace(/\\fr [\d:.,-]+\s*/g, "") // "\fr 8:37 "
        .replace(/\\f\*$/, "")
        .replace(/\\\+?[a-z]+\d*\*?\s?/g, "") // \ft, \fqa, \fq…
        .replace(/\s+/g, " ")
        .trim() +
      NOTE_END,
  );
  // \w word|strong="H1234"\w*  →  word  (also nested \+w)
  s = s.replace(/\\\+?w ([^\\|]*?)(?:\|[^\\]*?)?\\\+?w\*/g, "$1");

  const code = /^\\id (\w{3})/m.exec(s)?.[1];
  if (!code) throw new Error(`${file}: no \\id line`);

  const chapters = [];
  let chapter = 0;
  let verse = 0;
  const add = (text) => {
    if (!verse) {
      if (text.trim()) throw new Error(`${code} ${chapter}: text before verse 1: ${text.slice(0, 60)}`);
      return;
    }
    const verses = chapters[chapter - 1];
    verses[verse - 1] = (verses[verse - 1] ?? "") + " " + text;
  };

  for (const rawLine of s.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (SKIP_LINE.test(line)) {
      if (/\\v /.test(line)) throw new Error(`${code} ${chapter}: verse inside a skipped line: ${line}`);
      continue;
    }
    // Split the line on chapter and verse markers, keeping the text between
    const parts = line.split(/\\(c|v) (\d+)(?:-\d+)?\s?/);
    add(parts[0].replace(/^\\[a-z]+\d*\s?/, "")); // text after a paragraph marker (\p, \q1, \m…)
    for (let i = 1; i < parts.length; i += 3) {
      const n = Number(parts[i + 1]);
      if (parts[i] === "c") {
        chapter = n;
        verse = 0;
        if (chapters.length !== n - 1) throw new Error(`${code}: chapter ${n} out of order`);
        chapters.push([]);
      } else {
        verse = n;
        const verses = chapters[chapter - 1];
        if (verses.length !== n - 1) throw new Error(`${code} ${chapter}: verse ${n} out of order`);
        verses.push("");
      }
      add(parts[i + 2]);
    }
  }

  return {
    code,
    chapters: chapters.map((verses, ci) =>
      verses.map((t, vi) => {
        const ref = `${code} ${ci + 1}:${vi + 1}`;
        const notes = [...t.matchAll(NOTE_RE)].map((m) => m[1]);
        let text = t
          .replace(NOTE_RE, "")
          // Remaining character markers (\wj words of Jesus, \k, \qs Selah, \+wh…): keep their text
          .replace(/\\\+?[a-z]+\d*\*/g, "")
          .replace(/\\\+?[a-z]+\d*\s?/g, "")
          .replace(/\s+/g, " ")
          .replace(/\s+([,.;:!?’”])/g, "$1")
          .trim();
        if (!text) {
          if (!notes.length) throw new Error(`${ref}: empty verse with no footnote`);
          text = emptyVerseNote(notes.join(" "));
        }
        if (text.includes("\\")) throw new Error(`${ref}: marker left: ${text}`);
        return text;
      }),
    ),
  };
}

// ── Parse the 66 books ─────────────────────────────────────────────────────
const parsed = new Map();
for (const file of fs.readdirSync(usfmDir).filter((f) => f.endsWith(".usfm"))) {
  const usfm = fs.readFileSync(path.join(usfmDir, file), "utf8");
  // Only the 66 books the app has (eBible's editions may add the Deuterocanon)
  if (!USFM_CODES.includes(/^\\id (\w{3})/m.exec(usfm)?.[1])) continue;
  const book = parseBook(usfm, file);
  parsed.set(book.code, book.chapters);
}
const missing = USFM_CODES.filter((c) => !parsed.has(c));
if (missing.length) throw new Error(`Books missing from ${usfmDir}: ${missing.join(" ")}`);

// ── Same numbering as the bundled files ────────────────────────────────────
BOOK_IDS.forEach((id, i) => {
  const now = JSON.parse(fs.readFileSync(path.join(outDir, `${id}.json`), "utf8"));
  const next = parsed.get(USFM_CODES[i]);
  if (now.length !== next.length) throw new Error(`${id}: ${now.length} chapters bundled, ${next.length} in USFM`);
  now.forEach((verses, c) => {
    if (verses.length !== next[c].length) {
      throw new Error(`${id} ${c + 1}: ${verses.length} verses bundled, ${next[c].length} in USFM`);
    }
  });
});

// ── Optional: every verse matches eBible's verse-per-line text ─────────────
if (vplPath) {
  // The VPL file uses its own book codes, in canonical order with the
  // Deuterocanon mixed in, so match books by the order of their first verses.
  const vpl = new Map();
  for (const line of fs.readFileSync(vplPath, "utf8").split(/\r?\n/)) {
    const m = /^(\w{3}) (\d+):(\d+) (.*)$/.exec(line);
    if (m) vpl.set(`${m[1]} ${m[2]}:${m[3]}`, m[4]);
  }
  const norm = (t) => t.replace(/\s+/g, " ").replace(/\s+([,.;:!?’”])/g, "$1").trim();
  const HEADING_WORDS = {
    psalms: new Set(
      ("ALEPH BETH GIMEL DALETH HE VAV ZAYIN HETH TETH YODH KAPH LAMEDH MEM NUN " +
        "SAMEKH AYIN PE TZADHE QOPH RESH SHIN SIN AND TAV").split(" "),
    ),
    "song-of-solomon": new Set(["Beloved", "Lover", "Friends", "Brothers"]),
  };
  const withoutWords = (t, words) =>
    t
      .split(" ")
      .filter((w) => !words.has(w))
      .join(" ");
  let checked = 0;
  const problems = [];
  const vplCodes = [...new Set([...vpl.keys()].map((k) => k.slice(0, 3)))];
  BOOK_IDS.forEach((id, i) => {
    const chapters = parsed.get(USFM_CODES[i]);
    // Find the VPL code whose Genesis-1:1-style first verse matches this book
    const vcode = vplCodes.find((c) => norm(vpl.get(`${c} 1:1`) ?? "").endsWith(chapters[0][0]));
    if (!vcode) return problems.push(`${id}: no matching book in ${vplPath}`);
    chapters.forEach((verses, c) =>
      verses.forEach((text, v) => {
        const expected = norm(vpl.get(`${vcode} ${c + 1}:${v + 1}`) ?? "");
        checked++;
        const ok =
          expected === text ||
          // A verse the translation leaves out: empty in the VPL text, its
          // footnote here (see emptyVerseNote)
          (expected === "" && /^\[.+\]$/.test(text)) ||
          // Spacing only (e.g. around "Selah")
          expected.replace(/\s/g, "") === text.replace(/\s/g, "") ||
          // Psalm titles are part of verse 1 in the VPL text, left out here
          (id === "psalms" && v === 0 && expected.endsWith(" " + text)) ||
          // Headings the VPL text runs into a verse, left out here: Psalm 119's
          // Hebrew letters and the Song of Solomon's speaker labels
          (HEADING_WORDS[id] && withoutWords(expected, HEADING_WORDS[id]) === text);
        if (!ok) problems.push(`${id} ${c + 1}:${v + 1}\n    usfm: ${text}\n    vpl:  ${expected}`);
      }),
    );
  });
  if (problems.length) {
    console.error(problems.join("\n"));
    throw new Error(`${problems.length} verses differ from ${vplPath}`);
  }
  console.log(`Checked ${checked} verses against ${path.basename(vplPath)}: all match`);
}

// ── Write ──────────────────────────────────────────────────────────────────
let changed = 0;
BOOK_IDS.forEach((id, i) => {
  const file = path.join(outDir, `${id}.json`);
  const json = JSON.stringify(parsed.get(USFM_CODES[i]));
  if (fs.readFileSync(file, "utf8") !== json) {
    fs.writeFileSync(file, json);
    changed++;
  }
});
console.log(`Wrote ${version}: ${changed} of 66 book files changed`);
