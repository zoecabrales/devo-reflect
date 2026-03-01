// ── Types ───────────────────────────────────────────────────────────────────

export interface HebrewEntry {
  topic: string; // Strong's number, e.g. "H430"
  lexeme: string; // Hebrew characters
  transliteration: string;
  pronunciation: string;
  short_definition: string;
  definition: string; // HTML — use stripHtml() before display
  weight: number;
}

export interface FeaturedWord {
  topic: string;
  lexeme: string;
  transliteration: string;
  pronunciation: string;
  short_definition: string;
}

// ── Curated biblical Hebrew words (Protestant OT canon only) ─────────────────

export const FEATURED_HEBREW_WORDS: FeaturedWord[] = [
  // ── Character of God ──────────────────────────────────────────────────────
  {
    topic: "H430",
    lexeme: "אֱלֹהִים",
    transliteration: "ʼĕlôhîym",
    pronunciation: "el-o-heem'",
    short_definition: "God, gods",
  },
  {
    topic: "H3068",
    lexeme: "יְהֹוָה",
    transliteration: "Yᵉhôvâh",
    pronunciation: "yeh-ho-vaw'",
    short_definition: "the self-Existent or Eternal, LORD",
  },
  {
    topic: "H2617",
    lexeme: "חֶסֶד",
    transliteration: "cheçed",
    pronunciation: "kheh'-sed",
    short_definition: "lovingkindness, mercy, steadfast love",
  },
  {
    topic: "H6944",
    lexeme: "קֹדֶשׁ",
    transliteration: "qôdesh",
    pronunciation: "ko'-desh",
    short_definition: "holiness, sacredness",
  },
  {
    topic: "H3519",
    lexeme: "כָּבוֹד",
    transliteration: "kâbôwd",
    pronunciation: "kaw-bode'",
    short_definition: "glory, honor, abundance",
  },
  {
    topic: "H571",
    lexeme: "אֱמֶת",
    transliteration: "ʼĕmeth",
    pronunciation: "eh'-meth",
    short_definition: "truth, right, faithfulness",
  },
  {
    topic: "H2580",
    lexeme: "חֵן",
    transliteration: "chên",
    pronunciation: "khane",
    short_definition: "grace, favor, elegance",
  },
  {
    topic: "H7965",
    lexeme: "שָׁלוֹם",
    transliteration: "shâlôwm",
    pronunciation: "shaw-lome'",
    short_definition: "peace, completeness, prosperity",
  },

  // ── Salvation & Covenant ─────────────────────────────────────────────────
  {
    topic: "H3444",
    lexeme: "יְשׁוּעָה",
    transliteration: "yᵉshûwʻâh",
    pronunciation: "yesh-oo'-aw",
    short_definition: "salvation, deliverance",
  },
  {
    topic: "H3467",
    lexeme: "יָשַׁע",
    transliteration: "yâshaʻ",
    pronunciation: "yaw-shah'",
    short_definition: "to save, deliver, rescue",
  },
  {
    topic: "H1285",
    lexeme: "בְּרִית",
    transliteration: "bᵉrîyth",
    pronunciation: "ber-eeth'",
    short_definition: "covenant, pledge",
  },
  {
    topic: "H5545",
    lexeme: "סָלַח",
    transliteration: "çâlach",
    pronunciation: "saw-lakh'",
    short_definition: "to forgive, pardon",
  },
  {
    topic: "H7495",
    lexeme: "רָפָא",
    transliteration: "râphâʼ",
    pronunciation: "raw-faw'",
    short_definition: "to heal, cure, repair",
  },
  {
    topic: "H1350",
    lexeme: "גָּאַל",
    transliteration: "gâʼal",
    pronunciation: "gaw-al'",
    short_definition: "to redeem, act as kinsman-redeemer",
  },

  // ── Faith & Devotion ─────────────────────────────────────────────────────
  {
    topic: "H539",
    lexeme: "אָמַן",
    transliteration: "ʼâman",
    pronunciation: "aw-man'",
    short_definition: "to believe, to trust, to be faithful",
  },
  {
    topic: "H530",
    lexeme: "אֱמוּנָה",
    transliteration: "ʼĕmûwnâh",
    pronunciation: "em-oo-naw'",
    short_definition: "faithfulness, fidelity",
  },
  {
    topic: "H982",
    lexeme: "בָּטַח",
    transliteration: "bâṭach",
    pronunciation: "baw-takh'",
    short_definition: "to trust, be confident, rely",
  },
  {
    topic: "H3372",
    lexeme: "יָרֵא",
    transliteration: "yârêʼ",
    pronunciation: "yaw-ray'",
    short_definition: "to fear, revere, be afraid",
  },
  {
    topic: "H6960",
    lexeme: "קָוָה",
    transliteration: "qâvâh",
    pronunciation: "kaw-vaw'",
    short_definition: "to wait for, hope, expect",
  },
  {
    topic: "H8605",
    lexeme: "תְּפִלָּה",
    transliteration: "tᵉphillâh",
    pronunciation: "tef-il-law'",
    short_definition: "prayer, intercession",
  },
  {
    topic: "H7725",
    lexeme: "שׁוּב",
    transliteration: "shûwb",
    pronunciation: "shoob",
    short_definition: "to return, turn back, repent",
  },
  {
    topic: "H2398",
    lexeme: "חָטָא",
    transliteration: "châṭâʼ",
    pronunciation: "khaw-taw'",
    short_definition: "to sin, miss the mark",
  },

  // ── Praise & Worship ─────────────────────────────────────────────────────
  {
    topic: "H1288",
    lexeme: "בָּרַךְ",
    transliteration: "bârak",
    pronunciation: "baw-rak'",
    short_definition: "to bless, kneel",
  },
  {
    topic: "H157",
    lexeme: "אָהַב",
    transliteration: "ʼâhab",
    pronunciation: "aw-hab'",
    short_definition: "to love",
  },
  {
    topic: "H8416",
    lexeme: "תְּהִלָּה",
    transliteration: "tᵉhillâh",
    pronunciation: "teh-hil-law'",
    short_definition: "praise, song of praise",
  },
  {
    topic: "H7623",
    lexeme: "שָׁבַח",
    transliteration: "shâbach",
    pronunciation: "shaw-bakh'",
    short_definition: "to praise, commend, laud",
  },
  {
    topic: "H3034",
    lexeme: "יָדָה",
    transliteration: "yâdâh",
    pronunciation: "yaw-daw'",
    short_definition: "to give thanks, praise, confess",
  },
  {
    topic: "H7442",
    lexeme: "רָנַן",
    transliteration: "rânan",
    pronunciation: "raw-nan'",
    short_definition: "to shout for joy, sing aloud",
  },

  // ── Wisdom & Knowledge ───────────────────────────────────────────────────
  {
    topic: "H2451",
    lexeme: "חׇכְמָה",
    transliteration: "chokmâh",
    pronunciation: "khok-maw'",
    short_definition: "wisdom",
  },
  {
    topic: "H998",
    lexeme: "בִּינָה",
    transliteration: "bîynâh",
    pronunciation: "bee-naw'",
    short_definition: "understanding, discernment",
  },
  {
    topic: "H1847",
    lexeme: "דַּעַת",
    transliteration: "daʻath",
    pronunciation: "dah'-ath",
    short_definition: "knowledge",
  },
  {
    topic: "H3045",
    lexeme: "יָדַע",
    transliteration: "yâdaʻ",
    pronunciation: "yaw-dah'",
    short_definition: "to know, perceive, experience",
  },

  // ── The Word & Creation ──────────────────────────────────────────────────
  {
    topic: "H1697",
    lexeme: "דָּבָר",
    transliteration: "dâbâr",
    pronunciation: "daw-baw'",
    short_definition: "word, matter, thing",
  },
  {
    topic: "H7307",
    lexeme: "רוּחַ",
    transliteration: "rûwach",
    pronunciation: "roo'-akh",
    short_definition: "spirit, wind, breath",
  },
  {
    topic: "H8085",
    lexeme: "שָׁמַע",
    transliteration: "shâmaʻ",
    pronunciation: "shaw-mah'",
    short_definition: "to hear, listen, obey",
  },
  {
    topic: "H7200",
    lexeme: "רָאָה",
    transliteration: "râʼâh",
    pronunciation: "raw-aw'",
    short_definition: "to see, perceive, understand",
  },
  {
    topic: "H8064",
    lexeme: "שָׁמַיִם",
    transliteration: "shâmayim",
    pronunciation: "shaw-mah'-yim",
    short_definition: "heavens, sky",
  },
  {
    topic: "H776",
    lexeme: "אֶרֶץ",
    transliteration: "ʼerets",
    pronunciation: "eh'-rets",
    short_definition: "earth, land, ground",
  },
  {
    topic: "H2372",
    lexeme: "חָזָה",
    transliteration: "châzâh",
    pronunciation: "khaw-zaw'",
    short_definition: "to see, behold, have a vision",
  },

  // ── Inner Life ───────────────────────────────────────────────────────────
  {
    topic: "H3820",
    lexeme: "לֵב",
    transliteration: "lêb",
    pronunciation: "labe",
    short_definition: "heart, mind, will",
  },
  {
    topic: "H5315",
    lexeme: "נֶפֶשׁ",
    transliteration: "nephesh",
    pronunciation: "neh'-fesh",
    short_definition: "soul, life, creature",
  },
  {
    topic: "H5769",
    lexeme: "עוֹלָם",
    transliteration: "ʻôwlâm",
    pronunciation: "o-lawm'",
    short_definition: "eternity, forever, long duration",
  },
  {
    topic: "H2416",
    lexeme: "חַי",
    transliteration: "chay",
    pronunciation: "khah'-ee",
    short_definition: "alive, living, life",
  },

  // ── Justice & Relationship ───────────────────────────────────────────────
  {
    topic: "H4941",
    lexeme: "מִשְׁפָּט",
    transliteration: "mishpâṭ",
    pronunciation: "mish-pawt'",
    short_definition: "judgment, justice, ordinance",
  },
  {
    topic: "H6664",
    lexeme: "צֶדֶק",
    transliteration: "tsedeq",
    pronunciation: "tseh'-dek",
    short_definition: "righteousness, justice",
  },
  {
    topic: "H5650",
    lexeme: "עֶבֶד",
    transliteration: "ʻebed",
    pronunciation: "eh'-bed",
    short_definition: "servant, slave",
  },
  {
    topic: "H4428",
    lexeme: "מֶלֶךְ",
    transliteration: "melek",
    pronunciation: "meh'-lek",
    short_definition: "king",
  },
  {
    topic: "H4467",
    lexeme: "מַמְלָכָה",
    transliteration: "mamlâkâh",
    pronunciation: "mam-law-kaw'",
    short_definition: "kingdom, dominion, reign",
  },
  {
    topic: "H1",
    lexeme: "אָב",
    transliteration: "ʼâb",
    pronunciation: "awb",
    short_definition: "father",
  },
  {
    topic: "H1121",
    lexeme: "בֵּן",
    transliteration: "bên",
    pronunciation: "bane",
    short_definition: "son, child",
  },
  {
    topic: "H6440",
    lexeme: "פָּנִים",
    transliteration: "pânîym",
    pronunciation: "paw-neem'",
    short_definition: "face, presence, countenance",
  },
  {
    topic: "H4150",
    lexeme: "מוֹעֵד",
    transliteration: "môwʻêd",
    pronunciation: "mo-ade'",
    short_definition: "appointed time, season, assembly",
  },
];

// ── API ──────────────────────────────────────────────────────────────────────

const DICT_BASE = "https://bolls.life/dictionary-definition/BDBT";

/** Strip HTML tags and entities from a raw definition string */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Search BDBT dictionary; returns Hebrew entries only (Strong's H* numbers) */
export async function searchHebrew(query: string): Promise<HebrewEntry[]> {
  const encoded = encodeURIComponent(query.trim());
  const res = await fetch(`${DICT_BASE}/${encoded}/`);
  if (!res.ok) throw new Error(`Dictionary API error: ${res.status}`);
  const data: HebrewEntry[] = await res.json();
  return data.filter((e) => e.topic.startsWith("H"));
}

/** Fetch a single entry by Strong's number (e.g. "H430") */
export async function fetchHebrewEntry(
  strongsNum: string,
): Promise<HebrewEntry | null> {
  const res = await fetch(`${DICT_BASE}/${strongsNum}/`);
  if (!res.ok) return null;
  const data: HebrewEntry[] = await res.json();
  return data.find((e) => e.topic === strongsNum) ?? data[0] ?? null;
}
