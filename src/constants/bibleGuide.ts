// ── Bible guide ──────────────────────────────────────────────────────────────
// Background for first-time readers: what each section of the Bible is, and
// who wrote each book, when, for whom and why. Shown from the "?" on Home's
// "Browse by section" cards.
//
// Content notes:
// - Authors and dates follow the traditional (historic Christian / Jewish)
//   view; where scholars widely debate them, the entry says so instead of
//   stating one view as fact.
// - Dates are approximate. BC/AD are used for readability.

export interface SectionGuide {
  /** What the section's name means. */
  meaning: string;
  /** What the section is, in a few sentences. */
  overview: string;
  /** Who wrote it and over what period. */
  written: string;
  /** Historical / cultural background and why it matters. */
  background: string;
  /** How to read this kind of writing. */
  readingTips: string;
}

export interface BookGuide {
  /** Who wrote it (traditional view, with notes on debate). */
  author: string;
  /** When it was written, or when its events take place. */
  date: string;
  /** Who it was written to / the setting. */
  setting: string;
  /** What the book is about. */
  summary: string;
  themes: string[];
  /** Well-known or central passages, e.g. "Genesis 1–3". */
  keyPassages: string[];
}

// ── Sections ─────────────────────────────────────────────────────────────────

export const SECTION_GUIDES: Record<string, SectionGuide> = {
  pentateuch: {
    meaning:
      "\"Pentateuch\" is Greek for \"five scrolls\". Jewish tradition calls these books the Torah, Hebrew for \"instruction\" or \"law\".",
    overview:
      "The first five books of the Bible tell the story from the creation of the world to Israel standing at the edge of the Promised Land. Along the way come the first humans, the flood, God's promises to Abraham and his family, the escape from slavery in Egypt, and the Law given at Mount Sinai.",
    written:
      "Jewish and Christian tradition credits Moses (about 1400s–1200s BC), and later Bible books refer to them as \"the Law of Moses\". Many scholars think the books reached their final form over several centuries, drawing on older sources, with editing as late as the time of the exile (500s BC).",
    background:
      "These books are the foundation for everything that follows. They explain who God is, why the world is broken, and how God chose one family — Abraham's — to bring blessing to every nation. The Law shaped Israel's worship, justice and daily life, and Jesus and the apostles quote these books constantly.",
    readingTips:
      "Genesis and Exodus read like a story; Leviticus, Numbers and Deuteronomy mix story with detailed laws. When the laws feel distant, ask what each one taught Israel about God's holiness, about sin and forgiveness, and about caring for the poor and the outsider.",
  },
  historical: {
    meaning:
      "These books are called \"historical\" because they tell Israel's history in order. Jewish tradition counts several of them (Joshua to Kings) among the \"Former Prophets\", because they read history through God's eyes.",
    overview:
      "Twelve books follow Israel from entering the Promised Land (about 1400–1200 BC) through the judges, the rise of kings like Saul, David and Solomon, the split into two kingdoms, conquest and exile to Babylon, and the return to rebuild Jerusalem (400s BC).",
    written:
      "Mostly anonymous. Jewish tradition names Joshua, Samuel, Jeremiah and Ezra among the writers. Most were completed during or after the exile (500s–400s BC), using older royal records the books themselves mention, such as \"the book of the chronicles of the kings of Israel\".",
    background:
      "Israel lived between great empires — Egypt, Assyria, Babylon and Persia — and these books explain why the nation rose and fell: faithfulness to God brought blessing, and turning to other gods brought disaster. Kings and Chronicles cover much of the same history from different angles: Kings explains the exile, and Chronicles encourages those who returned.",
    readingTips:
      "Read these as true history told with a purpose, not as a list of heroes to copy — many leaders fail badly. Watch for God's patience and promises, especially the promise to David of a lasting kingdom, which the New Testament sees fulfilled in Jesus.",
  },
  wisdom: {
    meaning:
      "\"Wisdom\" literature teaches how to live well in God's world. These books are also the Bible's main poetry.",
    overview:
      "Five books of poetry and wise sayings: Job wrestles with suffering, Psalms is Israel's prayer and song book, Proverbs gives practical wisdom, Ecclesiastes asks what life means, and Song of Songs celebrates love between a bride and groom.",
    written:
      "Written over many centuries, roughly 1000–400 BC. King David wrote many psalms, and Solomon is linked to Proverbs, Ecclesiastes and Song of Songs, though other writers contributed too. Job's author is unknown.",
    background:
      "Ancient Near Eastern cultures prized wisdom writing, and Israel's wisdom stands out because it begins with \"the fear of the Lord\" — reverence for God. The psalms were sung in the temple and are still prayed by Jews and Christians every day. Jesus often quoted them, even on the cross.",
    readingTips:
      "Hebrew poetry rhymes ideas rather than sounds: the second line usually repeats, contrasts or builds on the first. Proverbs are general truths about how life usually works, not guaranteed promises. Psalms are honest prayers — including complaint and grief — that you can pray yourself.",
  },
  prophets: {
    meaning:
      "A prophet was someone who spoke God's message to the people. \"Major\" and \"Minor\" describe length, not importance: Isaiah, Jeremiah, Ezekiel and Daniel are long books (with Lamentations), and the twelve shorter books were kept on one scroll in Jewish tradition.",
    overview:
      "Seventeen books of messages from God's spokespeople, most given between about 800 and 430 BC. They call Israel back to God, warn of judgment for injustice and idolatry, comfort the people in exile, and promise a future King and a new covenant.",
    written:
      "Mostly by the prophets they are named after, or by their followers who collected their messages. Scholars debate the dating of some parts, notably the later chapters of Isaiah and the visions in Daniel.",
    background:
      "The prophets spoke into crises: the threat of the Assyrian and Babylonian empires, the destruction of Jerusalem in 586 BC, exile, and the return. They were often unpopular because they challenged kings, priests and the rich on behalf of the poor. Many of their promises — a child named Immanuel, a suffering servant, a ruler from Bethlehem — are quoted in the Gospels about Jesus.",
    readingTips:
      "Prophets mostly speak to their own time first; find the historical setting (each book's intro helps), then ask what it shows about God. Much is vivid poetry and symbolism, not literal prediction. Read a whole message, not single verses.",
  },
  gospels: {
    meaning:
      "\"Gospel\" means \"good news\" (Old English \"god spel\", from the Greek \"euangelion\").",
    overview:
      "Four accounts of the life, teaching, death and resurrection of Jesus. Matthew, Mark and Luke share much material and are called the \"Synoptic\" Gospels (\"seen together\"); John tells the story differently, with long conversations and reflections.",
    written:
      "Written roughly AD 50–90 by Matthew (a tax collector and one of the twelve apostles), Mark (Peter's companion), Luke (a doctor who travelled with Paul) and John (one of the twelve). The books themselves don't name their authors; these names come from very early church tradition.",
    background:
      "Jesus lived in Roman-occupied Judea and Galilee around 4 BC–AD 30. Jews were waiting for the Messiah promised by the prophets, and many expected a political king. The Gospels are ancient biographies written so that readers would know who Jesus is and trust him.",
    readingTips:
      "Each Gospel has its own audience and emphasis, so read one at a time from start to finish; Mark is the shortest place to begin. Parables are short stories with a surprising point — ask what the surprise is. When the Gospels differ in detail, they are like witnesses telling the same events from different angles.",
  },
  epistles: {
    meaning:
      "\"Epistle\" is from the Greek for \"letter\". These are real letters written to churches and to individuals. (Acts, which comes first in this group, is a history book: it tells how the early church began and spread.)",
    overview:
      "Acts tells the story of the first church, from Jesus' return to heaven to Paul in Rome. The 21 letters that follow explain what the good news means and how to live it: Paul wrote 13, and James, Peter, John, Jude and the unknown author of Hebrews wrote the rest.",
    written:
      "Written roughly AD 48–95, within a generation of Jesus. Some of Paul's letters are the earliest Christian writings we have. Scholars debate the authorship of a few letters, such as Ephesians, the letters to Timothy and Titus, and 2 Peter.",
    background:
      "The first Christians met in homes across the Roman Empire, mixing Jews and non-Jews, slaves and free, rich and poor. They faced persecution, false teaching and conflict over whether non-Jewish believers had to keep the Jewish law. Letters were read aloud to the whole church and passed between churches.",
    readingTips:
      "You're reading one side of a conversation, so ask what problem the writer is answering. Read a whole letter in one sitting if you can — most take 10–20 minutes. Paul's letters often explain what God has done first, then how to live in response.",
  },
  revelation: {
    meaning:
      "\"Revelation\" (Greek \"apokalypsis\") means an unveiling — pulling back the curtain to show what is really going on.",
    overview:
      "The Bible's final book is a series of visions given to John: Jesus speaking to seven churches, God's throne in heaven, judgments on evil, and finally a new heaven and new earth where God lives with his people.",
    written:
      "Written by a man named John while exiled on the island of Patmos, traditionally the apostle John, around AD 95 (some date it to the AD 60s).",
    background:
      "Christians in Asia Minor (modern Turkey) faced pressure to worship the Roman emperor and join in pagan trade guilds. Revelation encouraged them to stay faithful: Rome looked all-powerful, but Jesus, \"the Lamb who was slain\", is the true King.",
    readingTips:
      "Revelation is \"apocalyptic\" writing, a style full of symbols drawn from the Old Testament (numbers, beasts, colours). Christians read its timeline in different ways, so focus on its clear message: worship God alone, stay faithful in hardship, and evil will not win.",
  },
};

// ── Books ────────────────────────────────────────────────────────────────────

export const BOOK_GUIDES: Record<string, BookGuide> = {
  // Pentateuch
  genesis: {
    author: "Traditionally Moses",
    date: "Covers creation to about 1800 BC",
    setting: "Written for Israel, to explain their origins",
    summary:
      "The book of beginnings: creation, the first humans and their disobedience, the flood, the tower of Babel, and God's promises to Abraham, Isaac, Jacob and Joseph, ending with Jacob's family living in Egypt.",
    themes: ["Creation", "Sin and its spread", "God's covenant promises"],
    keyPassages: ["Genesis 1–3", "Genesis 12:1–3", "Genesis 22", "Genesis 50:20"],
  },
  exodus: {
    author: "Traditionally Moses",
    date: "Events about 1400s or 1200s BC",
    setting: "Israel enslaved in Egypt, then in the wilderness",
    summary:
      "God rescues Israel from slavery in Egypt through Moses, the plagues and the crossing of the sea, then makes a covenant with them at Mount Sinai, gives the Ten Commandments, and comes to live among them in the tabernacle.",
    themes: ["Rescue and redemption", "The Law", "God's presence"],
    keyPassages: ["Exodus 3", "Exodus 12", "Exodus 14", "Exodus 20"],
  },
  leviticus: {
    author: "Traditionally Moses",
    date: "Given at Mount Sinai",
    setting: "Instructions for priests and people",
    summary:
      "A handbook for worship and holy living: sacrifices, the priests, clean and unclean, and the yearly festivals, including the Day of Atonement, when the sins of the nation were covered.",
    themes: ["Holiness", "Sacrifice and atonement", "Worship"],
    keyPassages: ["Leviticus 16", "Leviticus 19:18", "Leviticus 23"],
  },
  numbers: {
    author: "Traditionally Moses",
    date: "About 40 years in the wilderness",
    setting: "Israel travelling from Sinai to the edge of Canaan",
    summary:
      "Named after two censuses of the people. Israel refuses to enter the Promised Land out of fear and wanders for 40 years until a new generation is ready.",
    themes: ["Faith vs. unbelief", "God's faithfulness", "Discipline"],
    keyPassages: ["Numbers 6:24–26", "Numbers 13–14", "Numbers 21:4–9"],
  },
  deuteronomy: {
    author: "Traditionally Moses (his speeches), with a closing account of his death",
    date: "End of the wilderness journey",
    setting: "The plains of Moab, before entering Canaan",
    summary:
      "\"Second law\": Moses' farewell speeches retell Israel's story and renew the covenant, urging the new generation to love God with all their heart and obey him in the land.",
    themes: ["Love and loyalty to God", "Covenant renewal", "Choosing life"],
    keyPassages: ["Deuteronomy 6:4–9", "Deuteronomy 30:15–20", "Deuteronomy 34"],
  },

  // Historical books
  joshua: {
    author: "Unknown; Jewish tradition credits Joshua",
    date: "Events after Moses' death, about 1400s or 1200s BC",
    setting: "Israel entering Canaan",
    summary:
      "Joshua leads Israel across the Jordan, takes Jericho and much of the land, divides it among the twelve tribes, and calls the people to serve the Lord alone.",
    themes: ["God keeps his promises", "Courage", "Faithfulness"],
    keyPassages: ["Joshua 1:6–9", "Joshua 6", "Joshua 24:15"],
  },
  judges: {
    author: "Unknown; Jewish tradition credits Samuel",
    date: "About 300 years before Israel had kings",
    setting: "The tribes living in Canaan without a king",
    summary:
      "A repeating cycle: Israel turns from God, is oppressed, cries out, and God raises up a deliverer (a \"judge\") such as Deborah, Gideon or Samson — but each cycle gets worse.",
    themes: ["The cycle of sin", "God's mercy", "The need for a true king"],
    keyPassages: ["Judges 2:10–19", "Judges 6–7", "Judges 21:25"],
  },
  ruth: {
    author: "Unknown",
    date: "Set in the time of the judges",
    setting: "Moab and Bethlehem",
    summary:
      "Ruth, a widow from Moab, stays loyal to her mother-in-law Naomi and finds a home in Israel through Boaz, a kind relative. She becomes the great-grandmother of King David.",
    themes: ["Loyal love (hesed)", "Redemption", "God's care for outsiders"],
    keyPassages: ["Ruth 1:16–17", "Ruth 4:13–17"],
  },
  "1samuel": {
    author: "Unknown; drawn from records by Samuel, Nathan and Gad (1 Chronicles 29:29)",
    date: "About 1100–1010 BC",
    setting: "Israel moving from judges to kings",
    summary:
      "The prophet Samuel leads Israel; the people demand a king; Saul is chosen but disobeys; young David is anointed, defeats Goliath, and flees from Saul's jealousy.",
    themes: ["God looks at the heart", "Leadership", "Obedience"],
    keyPassages: ["1 Samuel 3", "1 Samuel 16:7", "1 Samuel 17"],
  },
  "2samuel": {
    author: "Unknown (continues 1 Samuel)",
    date: "About 1010–970 BC",
    setting: "The reign of King David",
    summary:
      "David becomes king, makes Jerusalem his capital, and receives God's promise of a lasting dynasty. His sin with Bathsheba brings painful consequences in his family and kingdom.",
    themes: ["God's covenant with David", "Sin and repentance", "Consequences"],
    keyPassages: ["2 Samuel 7", "2 Samuel 11–12"],
  },
  "1kings": {
    author: "Unknown; Jewish tradition credits Jeremiah",
    date: "About 970–850 BC; completed during the exile (500s BC)",
    setting: "From Solomon to the divided kingdom",
    summary:
      "Solomon's wisdom and temple, then his turn to other gods; the kingdom splits into Israel (north) and Judah (south). The prophet Elijah confronts King Ahab and the prophets of Baal.",
    themes: ["Faithfulness vs. idolatry", "Wisdom", "Prophets speaking to kings"],
    keyPassages: ["1 Kings 3", "1 Kings 8", "1 Kings 18–19"],
  },
  "2kings": {
    author: "Unknown (continues 1 Kings)",
    date: "About 850–560 BC",
    setting: "The two kingdoms until their fall",
    summary:
      "Elisha's ministry, and the decline of both kingdoms: Israel falls to Assyria in 722 BC, and Judah to Babylon in 586 BC, when Jerusalem and the temple are destroyed.",
    themes: ["Judgment for unfaithfulness", "God's patience", "Hope in exile"],
    keyPassages: ["2 Kings 2", "2 Kings 5", "2 Kings 17", "2 Kings 25"],
  },
  "1chronicles": {
    author: "Unknown; Jewish tradition credits Ezra",
    date: "Written about 450–400 BC",
    setting: "For Jews back from exile",
    summary:
      "Retells history from Adam to David, starting with long family lists, and focuses on David preparing to build the temple — reminding the returned exiles who they are.",
    themes: ["Identity and heritage", "Worship", "God's covenant with David"],
    keyPassages: ["1 Chronicles 16:8–36", "1 Chronicles 17", "1 Chronicles 29:10–13"],
  },
  "2chronicles": {
    author: "Unknown (continues 1 Chronicles)",
    date: "Written about 450–400 BC",
    setting: "For Jews back from exile",
    summary:
      "Retells the history of Judah's kings from Solomon to the exile, highlighting kings who sought God and reformed worship, and ends with Persia's King Cyrus letting the Jews return.",
    themes: ["Seeking God", "Repentance and revival", "The temple"],
    keyPassages: ["2 Chronicles 7:14", "2 Chronicles 20", "2 Chronicles 36:22–23"],
  },
  ezra: {
    author: "Traditionally Ezra, a priest and scribe",
    date: "About 538–450 BC",
    setting: "Return from Babylon under Persian rule",
    summary:
      "Jews return to Jerusalem and rebuild the temple despite opposition. Decades later, Ezra arrives to teach God's Law and lead the people in repentance.",
    themes: ["Restoration", "God's Word", "Repentance"],
    keyPassages: ["Ezra 1", "Ezra 3:10–13", "Ezra 7:10"],
  },
  nehemiah: {
    author: "Nehemiah (much is his first-person account)",
    date: "About 445–430 BC",
    setting: "Jerusalem under Persian rule",
    summary:
      "Nehemiah, a Jewish official in the Persian court, returns to rebuild Jerusalem's walls in 52 days despite threats, then works with Ezra to renew the people's covenant with God.",
    themes: ["Prayer and action", "Leadership", "Renewal"],
    keyPassages: ["Nehemiah 1", "Nehemiah 4", "Nehemiah 8"],
  },
  esther: {
    author: "Unknown",
    date: "About 480–470 BC",
    setting: "The Persian royal city of Susa",
    summary:
      "Esther, a Jewish woman who becomes queen of Persia, risks her life to stop a plot to destroy her people. God is never named, but his care is everywhere. Jews celebrate it at the festival of Purim.",
    themes: ["God's hidden providence", "Courage", "Deliverance"],
    keyPassages: ["Esther 4:14", "Esther 7"],
  },

  // Wisdom & poetry
  job: {
    author: "Unknown",
    date: "Uncertain; set in the time of the patriarchs",
    setting: "The land of Uz, outside Israel",
    summary:
      "Job, a good man, loses everything. His friends insist he must have sinned; Job protests and demands answers. God finally speaks — not explaining, but showing his wisdom and power — and Job trusts him.",
    themes: ["Suffering", "Trust when God is silent", "God's wisdom"],
    keyPassages: ["Job 1–2", "Job 19:25–27", "Job 38–42"],
  },
  psalms: {
    author: "Many writers: David (about 73 psalms), Asaph, the sons of Korah, Solomon, Moses and others",
    date: "About 1000–400 BC",
    setting: "Israel's worship, sung in the temple",
    summary:
      "150 songs and prayers covering every emotion: praise, thanks, grief, anger, confession and hope. Arranged in five books, it was Israel's hymnbook and has been the church's prayer book ever since.",
    themes: ["Worship", "Honest prayer", "God as King and refuge"],
    keyPassages: ["Psalm 1", "Psalm 23", "Psalm 51", "Psalm 139"],
  },
  proverbs: {
    author: "Mainly Solomon, with sayings by others (Agur, King Lemuel)",
    date: "About 950–700 BC",
    setting: "Teaching for young people and leaders",
    summary:
      "Short, memorable sayings on work, words, money, friendship, family and self-control, beginning with \"the fear of the Lord is the beginning of knowledge\".",
    themes: ["Wisdom vs. folly", "The fear of the Lord", "Everyday life"],
    keyPassages: ["Proverbs 1:7", "Proverbs 3:5–6", "Proverbs 31"],
  },
  ecclesiastes: {
    author: "\"The Teacher\" (Qoheleth), traditionally Solomon",
    date: "Traditionally about 935 BC; many scholars date it later",
    setting: "Reflections on life \"under the sun\"",
    summary:
      "An honest search for meaning: pleasure, work, wisdom and wealth all prove \"meaningless\" (literally \"a breath\"). The conclusion: enjoy God's gifts, and fear God and keep his commands.",
    themes: ["The meaning of life", "Mortality", "Contentment"],
    keyPassages: ["Ecclesiastes 1:2", "Ecclesiastes 3:1–8", "Ecclesiastes 12:13"],
  },
  "song-of-solomon": {
    author: "Traditionally Solomon",
    date: "About 950 BC (traditional)",
    setting: "Love poetry between a bride and groom",
    summary:
      "Poems celebrating romantic love and desire within commitment. Jews and Christians have also read it as a picture of God's love for his people.",
    themes: ["Love and marriage", "Desire and faithfulness", "Beauty"],
    keyPassages: ["Song of Solomon 2:10–13", "Song of Solomon 8:6–7"],
  },

  // Prophets
  isaiah: {
    author: "Isaiah son of Amoz; many scholars think chapters 40–66 come from his later followers",
    date: "Isaiah's ministry about 740–700 BC",
    setting: "Judah threatened by Assyria, looking ahead to exile",
    summary:
      "Judgment on Judah's sin and comfort for the future: a child called Immanuel, a coming King, a Servant who suffers for others, and a new creation. It is quoted more in the New Testament than any other prophet.",
    themes: ["God's holiness", "Judgment and comfort", "The Messiah"],
    keyPassages: ["Isaiah 6", "Isaiah 9:6–7", "Isaiah 40", "Isaiah 53"],
  },
  jeremiah: {
    author: "Jeremiah, with his scribe Baruch",
    date: "About 627–580 BC",
    setting: "Judah's last years and the fall of Jerusalem",
    summary:
      "\"The weeping prophet\" warns for 40 years that Babylon will destroy Jerusalem, is rejected and imprisoned, and sees it happen. He also promises a new covenant written on people's hearts.",
    themes: ["Judgment", "A new covenant", "Faithfulness in hardship"],
    keyPassages: ["Jeremiah 1", "Jeremiah 29:11–14", "Jeremiah 31:31–34"],
  },
  lamentations: {
    author: "Traditionally Jeremiah",
    date: "Soon after 586 BC",
    setting: "The ruins of Jerusalem",
    summary:
      "Five poems of grief over Jerusalem's destruction, several written as acrostics (each verse starting with the next Hebrew letter). At its centre is hope in God's mercies, which are new every morning.",
    themes: ["Grief", "Honest lament", "Hope in God's faithfulness"],
    keyPassages: ["Lamentations 3:21–26"],
  },
  ezekiel: {
    author: "Ezekiel, a priest",
    date: "About 593–571 BC",
    setting: "Jewish exiles in Babylon",
    summary:
      "Dramatic visions: God's glory leaving the temple, a valley of dry bones coming to life, and a new temple. God promises to give his people a new heart and spirit.",
    themes: ["God's glory", "Responsibility", "New life"],
    keyPassages: ["Ezekiel 1", "Ezekiel 36:26–27", "Ezekiel 37"],
  },
  daniel: {
    author: "Traditionally Daniel; many scholars date the final form to the 160s BC",
    date: "Set about 605–530 BC",
    setting: "Jewish exiles in Babylon and Persia",
    summary:
      "Stories of Daniel and his friends staying faithful in a foreign court — the fiery furnace, the lions' den — and visions of empires rising and falling before God's everlasting kingdom.",
    themes: ["Faithfulness under pressure", "God rules over nations", "God's kingdom"],
    keyPassages: ["Daniel 3", "Daniel 6", "Daniel 7:13–14"],
  },
  hosea: {
    author: "Hosea",
    date: "About 750–715 BC",
    setting: "The northern kingdom of Israel",
    summary:
      "God tells Hosea to marry Gomer, who is unfaithful, as a living picture of Israel's unfaithfulness to God — and of God's love that keeps pursuing them.",
    themes: ["God's faithful love", "Spiritual unfaithfulness", "Return"],
    keyPassages: ["Hosea 3:1", "Hosea 6:6", "Hosea 11:1–9"],
  },
  joel: {
    author: "Joel",
    date: "Uncertain (suggestions range from 800s to 400s BC)",
    setting: "Judah after a devastating locust plague",
    summary:
      "A plague of locusts becomes a warning of \"the day of the Lord\" and a call to return to God. God promises to pour out his Spirit on all people — quoted by Peter at Pentecost.",
    themes: ["The day of the Lord", "Repentance", "The Spirit poured out"],
    keyPassages: ["Joel 2:12–13", "Joel 2:28–32"],
  },
  amos: {
    author: "Amos, a shepherd and fig farmer from Judah",
    date: "About 760–750 BC",
    setting: "The prosperous northern kingdom of Israel",
    summary:
      "A farmer sent to a wealthy nation condemns its oppression of the poor and its empty religion: God wants justice, not just worship services.",
    themes: ["Social justice", "True worship", "Judgment"],
    keyPassages: ["Amos 5:21–24", "Amos 9:11–15"],
  },
  obadiah: {
    author: "Obadiah",
    date: "Probably soon after 586 BC",
    setting: "About Edom, Israel's neighbour",
    summary:
      "The shortest Old Testament book: judgment on Edom for gloating over and joining in Jerusalem's destruction, and a promise that the kingdom will be the Lord's.",
    themes: ["Pride", "Justice for nations", "God's kingdom"],
    keyPassages: ["Obadiah 1:15", "Obadiah 1:21"],
  },
  jonah: {
    author: "Unknown; about the prophet Jonah (2 Kings 14:25)",
    date: "Jonah lived about 780 BC",
    setting: "Nineveh, capital of Israel's enemy Assyria",
    summary:
      "Jonah runs from God's call, is swallowed by a great fish, then reluctantly preaches to Nineveh. The city repents — and Jonah is angry that God is merciful to his enemies.",
    themes: ["God's mercy for all nations", "Obedience", "Compassion"],
    keyPassages: ["Jonah 1–2", "Jonah 4:2", "Jonah 4:10–11"],
  },
  micah: {
    author: "Micah of Moresheth",
    date: "About 735–700 BC",
    setting: "Judah and Israel",
    summary:
      "Condemns corrupt leaders and injustice, and promises a ruler from Bethlehem. Sums up what God wants: to do justice, love mercy and walk humbly with God.",
    themes: ["Justice", "Humility", "The coming ruler"],
    keyPassages: ["Micah 5:2", "Micah 6:8", "Micah 7:18–19"],
  },
  nahum: {
    author: "Nahum",
    date: "About 660–612 BC",
    setting: "Against Nineveh (Assyria)",
    summary:
      "A poem announcing the fall of Nineveh, the cruel capital that had destroyed Israel, which fell in 612 BC — comfort that God will judge oppressors.",
    themes: ["God's justice", "Comfort for the oppressed"],
    keyPassages: ["Nahum 1:7"],
  },
  habakkuk: {
    author: "Habakkuk",
    date: "About 610–600 BC",
    setting: "Judah as Babylon rises",
    summary:
      "Habakkuk questions God: why does he allow injustice, and why use cruel Babylon to judge Judah? God answers, and the prophet ends in trust: \"the righteous shall live by faith\".",
    themes: ["Questioning God", "Faith", "Joy in hardship"],
    keyPassages: ["Habakkuk 1:2–4", "Habakkuk 2:4", "Habakkuk 3:17–19"],
  },
  zephaniah: {
    author: "Zephaniah, a descendant of King Hezekiah",
    date: "About 640–610 BC",
    setting: "Judah under King Josiah",
    summary:
      "Warns of the coming day of the Lord against Judah and the nations, then promises a humble remnant over whom God will rejoice with singing.",
    themes: ["The day of the Lord", "Humility", "God's joy over his people"],
    keyPassages: ["Zephaniah 3:17"],
  },
  haggai: {
    author: "Haggai",
    date: "520 BC",
    setting: "Jews back from exile in Jerusalem",
    summary:
      "Four short messages urging the returned exiles to stop focusing on their own houses and finish rebuilding God's temple — and they do.",
    themes: ["Priorities", "Rebuilding", "God's presence"],
    keyPassages: ["Haggai 1:3–9", "Haggai 2:4–9"],
  },
  zechariah: {
    author: "Zechariah, a priest and prophet",
    date: "About 520–480 BC",
    setting: "Jews rebuilding Jerusalem",
    summary:
      "Night visions encourage the rebuilders, and later chapters look ahead to a humble King riding on a donkey and a shepherd who is struck — both linked to Jesus in the Gospels.",
    themes: ["Encouragement", "The coming King", "God's Spirit"],
    keyPassages: ["Zechariah 4:6", "Zechariah 9:9", "Zechariah 12:10"],
  },
  malachi: {
    author: "Malachi (the name means \"my messenger\")",
    date: "About 450–430 BC",
    setting: "Judah after the temple was rebuilt",
    summary:
      "The last Old Testament prophet confronts careless worship, broken marriages and robbing God of tithes, and promises a messenger like Elijah before the day of the Lord.",
    themes: ["Sincere worship", "Faithfulness", "Preparing for the Lord"],
    keyPassages: ["Malachi 3:1", "Malachi 3:10", "Malachi 4:5–6"],
  },

  // Gospels
  matthew: {
    author: "Traditionally Matthew (Levi), a tax collector and apostle",
    date: "About AD 50s–80s",
    setting: "Largely for Jewish Christians",
    summary:
      "Shows Jesus as the promised Messiah and King, fulfilling the Old Testament again and again. Includes the Sermon on the Mount and ends with the Great Commission.",
    themes: ["Jesus the King", "Fulfilment of Scripture", "The kingdom of heaven"],
    keyPassages: ["Matthew 5–7", "Matthew 16:13–20", "Matthew 28:18–20"],
  },
  mark: {
    author: "Traditionally John Mark, recording Peter's preaching",
    date: "About AD 55–70",
    setting: "Probably for Christians in Rome",
    summary:
      "The shortest and fastest-moving Gospel (\"immediately\" appears often). Shows Jesus as the Servant who came \"not to be served but to serve, and to give his life\".",
    themes: ["Jesus the Servant", "Discipleship", "The cross"],
    keyPassages: ["Mark 1:14–15", "Mark 8:27–38", "Mark 10:45"],
  },
  luke: {
    author: "Luke, a doctor and companion of Paul",
    date: "About AD 60–80",
    setting: "Written to Theophilus, for non-Jewish readers",
    summary:
      "A careful, researched account (Luke 1:1–4) highlighting Jesus' care for the poor, women, outsiders and sinners, with parables like the Good Samaritan and the Prodigal Son. Acts is its second volume.",
    themes: ["Salvation for all", "Compassion", "Prayer and the Holy Spirit"],
    keyPassages: ["Luke 2:1–20", "Luke 15", "Luke 24"],
  },
  john: {
    author: "Traditionally John, \"the disciple whom Jesus loved\"",
    date: "About AD 85–95",
    setting: "For believers and seekers across the Roman world",
    summary:
      "Written \"so that you may believe that Jesus is the Christ\" (John 20:31). Seven signs and seven \"I am\" sayings reveal Jesus as God made flesh.",
    themes: ["Jesus is God", "Belief and eternal life", "Love"],
    keyPassages: ["John 1:1–18", "John 3:16", "John 11", "John 20:30–31"],
  },

  // Acts & Epistles
  acts: {
    author: "Luke (second volume after his Gospel)",
    date: "About AD 62–80; events about AD 30–62",
    setting: "From Jerusalem to Rome",
    summary:
      "A history book, not a letter: the Holy Spirit comes at Pentecost, the church grows in Jerusalem, persecution spreads it, and Paul carries the good news across the Roman Empire to Rome.",
    themes: ["The Holy Spirit", "The church's mission", "The gospel for all nations"],
    keyPassages: ["Acts 1:8", "Acts 2", "Acts 9", "Acts 15"],
  },
  romans: {
    author: "Paul",
    date: "About AD 57",
    setting: "To the church in Rome, which Paul hadn't yet visited",
    summary:
      "Paul's fullest explanation of the gospel: everyone has sinned, and God makes people right with him through faith in Jesus, not by keeping the law — then how to live as one family of Jews and non-Jews.",
    themes: ["Grace and faith", "Righteousness from God", "New life in the Spirit"],
    keyPassages: ["Romans 3:21–26", "Romans 5:8", "Romans 8", "Romans 12:1–2"],
  },
  "1corinthians": {
    author: "Paul",
    date: "About AD 53–55",
    setting: "To a divided church in the wealthy port city of Corinth",
    summary:
      "Paul tackles divisions, sexual immorality, lawsuits, worship, spiritual gifts and doubts about the resurrection — and shows love as the greatest gift.",
    themes: ["Unity", "Love", "The resurrection"],
    keyPassages: ["1 Corinthians 1:18–25", "1 Corinthians 13", "1 Corinthians 15"],
  },
  "2corinthians": {
    author: "Paul",
    date: "About AD 55–56",
    setting: "To the church in Corinth",
    summary:
      "Paul's most personal letter: defending his ministry against critics, he shows God's power at work in weakness and suffering, and encourages generous giving.",
    themes: ["Strength in weakness", "Reconciliation", "Generosity"],
    keyPassages: ["2 Corinthians 4:7–18", "2 Corinthians 5:17–21", "2 Corinthians 12:9"],
  },
  galatians: {
    author: "Paul",
    date: "About AD 48–55",
    setting: "To churches in Galatia (central Turkey)",
    summary:
      "A passionate letter against teachers who said non-Jewish believers must keep the Jewish law to be saved. We are made right with God by faith alone, and set free to live by the Spirit.",
    themes: ["Freedom in Christ", "Faith not law", "The fruit of the Spirit"],
    keyPassages: ["Galatians 2:20", "Galatians 3:28", "Galatians 5:22–23"],
  },
  ephesians: {
    author: "Paul (some scholars debate this)",
    date: "About AD 60–62, from prison",
    setting: "Probably circulated among churches around Ephesus",
    summary:
      "God's plan to unite everything in Christ: saved by grace through faith, Jews and non-Jews made one body, and practical instructions for church, family and spiritual battle.",
    themes: ["Grace", "Unity of the church", "Spiritual armour"],
    keyPassages: ["Ephesians 1:3–14", "Ephesians 2:8–10", "Ephesians 6:10–18"],
  },
  philippians: {
    author: "Paul (with Timothy)",
    date: "About AD 60–62, from prison",
    setting: "To the church in Philippi, a Roman colony",
    summary:
      "A warm thank-you letter full of joy despite Paul's chains. Christ's humility is the model for the church, and Paul has learned contentment in every situation.",
    themes: ["Joy", "Humility", "Contentment"],
    keyPassages: ["Philippians 2:5–11", "Philippians 4:4–8", "Philippians 4:11–13"],
  },
  colossians: {
    author: "Paul (with Timothy)",
    date: "About AD 60–62, from prison",
    setting: "To the church in Colossae (western Turkey)",
    summary:
      "Against teaching that added rules and spiritual experiences to Jesus, Paul shows that Christ is supreme over all creation and is all believers need.",
    themes: ["The supremacy of Christ", "Fullness in Christ", "New life"],
    keyPassages: ["Colossians 1:15–20", "Colossians 3:1–17"],
  },
  "1thessalonians": {
    author: "Paul (with Silas and Timothy)",
    date: "About AD 50–51, one of Paul's earliest letters",
    setting: "To a young, persecuted church in Thessalonica (Greece)",
    summary:
      "Paul encourages new believers to keep going under pressure, live holy lives, and take comfort that believers who have died will rise when Jesus returns.",
    themes: ["Hope in Jesus' return", "Holiness", "Encouragement"],
    keyPassages: ["1 Thessalonians 4:13–18", "1 Thessalonians 5:16–18"],
  },
  "2thessalonians": {
    author: "Paul (some scholars debate this)",
    date: "About AD 51–52",
    setting: "To the church in Thessalonica",
    summary:
      "Corrects the idea that the day of the Lord had already come, and tells believers not to stop working while they wait for Jesus' return.",
    themes: ["Jesus' return", "Perseverance", "Faithful work"],
    keyPassages: ["2 Thessalonians 2:13–17", "2 Thessalonians 3:6–13"],
  },
  "1timothy": {
    author: "Paul (many scholars debate this)",
    date: "About AD 62–64",
    setting: "To Timothy, leading the church in Ephesus",
    summary:
      "Guidance for a young church leader: guarding true teaching, choosing leaders of good character, prayer, caring for widows, and the danger of loving money.",
    themes: ["Sound teaching", "Church leadership", "Godliness"],
    keyPassages: ["1 Timothy 1:15", "1 Timothy 4:12", "1 Timothy 6:6–10"],
  },
  "2timothy": {
    author: "Paul (many scholars debate this)",
    date: "About AD 64–67, Paul's last letter",
    setting: "From prison in Rome, to Timothy",
    summary:
      "Paul, expecting death, urges Timothy to stay faithful, endure hardship and keep teaching Scripture, as Paul himself has finished his race and kept the faith.",
    themes: ["Faithfulness to the end", "Scripture", "Passing on the faith"],
    keyPassages: ["2 Timothy 1:7", "2 Timothy 3:16–17", "2 Timothy 4:6–8"],
  },
  titus: {
    author: "Paul (many scholars debate this)",
    date: "About AD 63–65",
    setting: "To Titus, organising churches on Crete",
    summary:
      "How to appoint good leaders and teach believers of every age to live in a way that shows the grace of God — grace that saves and also trains us to live godly lives.",
    themes: ["Good works from grace", "Leadership", "Sound teaching"],
    keyPassages: ["Titus 2:11–14", "Titus 3:4–7"],
  },
  philemon: {
    author: "Paul",
    date: "About AD 60–62, from prison",
    setting: "To Philemon, a believer in Colossae",
    summary:
      "A short personal letter asking Philemon to welcome back Onesimus, his runaway slave who became a Christian — no longer as a slave, but as a beloved brother.",
    themes: ["Forgiveness", "Reconciliation", "Equality in Christ"],
    keyPassages: ["Philemon 1:15–17"],
  },
  hebrews: {
    author: "Unknown (suggestions include Paul, Barnabas and Apollos)",
    date: "About AD 60–70",
    setting: "Jewish Christians tempted to turn back",
    summary:
      "Shows that Jesus is greater than angels, Moses and the priests, and his sacrifice is final. Urges readers to hold on, inspired by a \"hall of faith\" of Old Testament believers.",
    themes: ["Jesus the great High Priest", "The new covenant", "Persevering faith"],
    keyPassages: ["Hebrews 4:14–16", "Hebrews 11", "Hebrews 12:1–3"],
  },
  james: {
    author: "James, the brother of Jesus and leader of the Jerusalem church",
    date: "About AD 45–62",
    setting: "To Jewish Christians scattered abroad",
    summary:
      "Practical wisdom like Proverbs: real faith shows itself in action — in trials, in how we speak, and in how we treat the poor.",
    themes: ["Faith and works", "Taming the tongue", "Wisdom"],
    keyPassages: ["James 1:2–5", "James 2:14–26", "James 3:1–12"],
  },
  "1peter": {
    author: "The apostle Peter (with Silvanus)",
    date: "About AD 62–64",
    setting: "To believers scattered across Asia Minor (Turkey)",
    summary:
      "Encouragement for Christians suffering for their faith: they have a living hope, are God's chosen people, and can follow Jesus' example in unjust suffering.",
    themes: ["Hope in suffering", "Holy living", "Identity as God's people"],
    keyPassages: ["1 Peter 1:3–9", "1 Peter 2:9–10", "1 Peter 5:6–7"],
  },
  "2peter": {
    author: "Peter (many scholars debate this)",
    date: "About AD 65–68",
    setting: "To believers, near the end of Peter's life",
    summary:
      "Warns against false teachers and scoffers who deny Jesus' return. God is patient, wanting everyone to come to repentance, and believers should keep growing.",
    themes: ["Spiritual growth", "False teaching", "The Lord's patience"],
    keyPassages: ["2 Peter 1:3–8", "2 Peter 3:8–9"],
  },
  "1john": {
    author: "Traditionally the apostle John",
    date: "About AD 85–95",
    setting: "To churches shaken by false teachers who had left",
    summary:
      "Helps believers know they have eternal life: walk in the light, love one another, and believe that Jesus truly came in the flesh. \"God is love.\"",
    themes: ["Love", "Assurance", "Truth about Jesus"],
    keyPassages: ["1 John 1:9", "1 John 4:7–21", "1 John 5:13"],
  },
  "2john": {
    author: "\"The elder\", traditionally John",
    date: "About AD 85–95",
    setting: "To \"the chosen lady and her children\" — probably a church",
    summary:
      "A short letter: keep loving one another, and don't welcome teachers who deny that Jesus came in the flesh.",
    themes: ["Truth and love", "Discernment"],
    keyPassages: ["2 John 1:5–6"],
  },
  "3john": {
    author: "\"The elder\", traditionally John",
    date: "About AD 85–95",
    setting: "To Gaius, a church member",
    summary:
      "Praises Gaius for welcoming travelling teachers and criticises Diotrephes, a church leader who loved to be first.",
    themes: ["Hospitality", "Faithfulness", "Humble leadership"],
    keyPassages: ["3 John 1:4", "3 John 1:11"],
  },
  jude: {
    author: "Jude, brother of James (and of Jesus)",
    date: "About AD 65–80",
    setting: "To believers threatened by false teachers",
    summary:
      "An urgent call to \"contend for the faith\" against immoral teachers, ending with a famous blessing to the God who is able to keep you from stumbling.",
    themes: ["Defending the faith", "God's keeping power"],
    keyPassages: ["Jude 1:3", "Jude 1:24–25"],
  },

  // Revelation
  revelation: {
    author: "John, traditionally the apostle",
    date: "About AD 95 (some date it to the AD 60s)",
    setting: "Seven churches in Asia Minor, under Roman pressure",
    summary:
      "Visions of Jesus among his churches, worship in heaven, judgments on evil and \"Babylon\", and the final victory of the Lamb, ending with a new heaven and new earth.",
    themes: ["Jesus' victory", "Faithful endurance", "New creation"],
    keyPassages: ["Revelation 1", "Revelation 4–5", "Revelation 21–22"],
  },
};
