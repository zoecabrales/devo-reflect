# Devo Reflect

A personal devotional app built with React Native and Expo. It is designed around a daily reading habit — providing a verse of the day, a full Bible reader, SOAP journaling, prayer tracking, and verse bookmarking, all synced to the cloud per user account.

---

## Features

### Home

Displays a daily verse drawn from a curated list, rotating once every calendar day (Philippine Time). The verse is cached locally so it loads instantly on repeat visits. The screen also surfaces a resume-reading shortcut to the last opened chapter, a bookmark count, and quick links to the Bible browser and concordance.

### Bible Browser

A full 66-book Bible reader supporting five translations: ASV, KJV, WEB, BBE, and YLT. Users can browse by collection (Pentateuch, Historical Books, Wisdom and Poetry, The Prophets, The Gospels, The Epistles, Revelation), search within a chapter, highlight verses with color, bookmark individual verses, and share verse text. Reading position is saved automatically on every chapter open.

### Concordance

A full-text search across the ASV Bible. Results are grouped by book and show the matching verse inline. Intended for word or phrase lookups without knowing the exact reference.

### SOAP Journal

Structured journaling based on the SOAP method — Scripture, Observation, Application, Prayer. Each entry can have one or more attached verse references (pre-filled when launched from the Bible browser), free-text fields for each SOAP section, and user-defined tags. Entries are stored in Firestore and listed newest-first with section grouping by date.

### Prayers

A personal prayer log. Users add prayer requests as text entries and mark them answered or unanswered. Answered prayers are visually distinguished in the list. All prayer data is stored in Firestore.

### Bookmarks

A saved-verse list pulled from Firestore. Each bookmark shows the verse reference and full text, and tapping it opens the verse in context in the Bible browser. Bookmarks can be deleted with a swipe action.

### Settings

Controls for appearance (light, dark, or system-matched color mode) and eight color themes: Default, Sepia, Ocean, Forest, Rose, Lavender, Slate, and Dusk. Also provides account management — change password, sign out, and permanent account deletion.

---

## Authentication

Accounts use email and password via Firebase Auth. New accounts require email verification before accessing the app. A 10-minute idle timeout automatically signs the user out when the app is sent to the background for an extended period. Password reset is available from the sign-in screen.

---

## Tech Stack

| Layer             | Choice                                                       |
| ----------------- | ------------------------------------------------------------ |
| Framework         | React Native 0.81 + Expo 54                                  |
| Navigation        | expo-router (file-based)                                     |
| Auth and database | Firebase Auth + Firestore                                    |
| Local storage     | AsyncStorage (verse cache, reading position, highlights)     |
| UI                | Custom theme system with light/dark variants per color theme |
| Typography        | Oswald 700 Bold (headers), system sans-serif (body)          |
| Target devices    | iPhone and iPad (iPad 11th gen layout tested)                |

---

## Data Storage

User data is organized in Firestore under `users/{uid}` with three sub-collections: `bookmarks`, `journal`, and `prayers`. Verse highlights and the daily verse cache are stored locally in AsyncStorage and are not synced across devices.

The Bible text itself (ASV, KJV, WEB, BBE and YLT — all 66 books) is bundled in the app under `assets/bible/<version>/<book>.json`, so chapters open instantly and work offline. To regenerate it, run `node scripts/build-bible-data.js`; it downloads the text and rewrites `src/services/bibleData.ts`. Only the concordance search still needs the network.

---

## Running the App

```bash
npm install
npm start
```

Requires a Firebase project with Authentication (email/password) and Firestore enabled. Add your Firebase config to the appropriate environment file before running.
