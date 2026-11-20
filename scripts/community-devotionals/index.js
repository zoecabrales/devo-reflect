// Short devotionals for the church Verse of the Day, one per verse, keyed by
// the reference exactly as written in THEMES (scripts/build-community-verses.js).
// Each has a title, a reflection of a few sentences, and a question for a
// small group or ministry team. One file per theme.

const files = [
  "discipleship",
  "fellowship",
  "unity",
  "serving",
  "one-another",
  "leadership",
  "prayer",
  "mission",
  "generosity",
  "worship",
  "the-church",
];

const all = {};
for (const file of files) {
  for (const [reference, devotional] of Object.entries(require(`./${file}`))) {
    if (all[reference]) throw new Error(`Two devotionals for ${reference}`);
    for (const key of ["title", "body", "question"]) {
      if (typeof devotional[key] !== "string" || !devotional[key].trim()) {
        throw new Error(`Devotional for ${reference} has no ${key}`);
      }
    }
    all[reference] = devotional;
  }
}
module.exports = all;
