# Devo Reflect

Devotional app: Bible reader, SOAP journal, prayers, bookmarks, memory verses,
reading plans, and "Brethren" (connections that share verses). Expo + React Native,
shipped to the web on Vercel. See `README.md` for features. Its stack details are
partly out of date, so trust `package.json`.

## Production is live

Real users are on the web app. Do not push or merge to `release`, deploy, or run
`npm run deploy:firestore` without asking first. Keep Firestore changes backward
compatible with existing data (new fields optional, never rename or retype in place).

## Branches

- Work on `dev`.
- `release` is the production branch. Vercel deploys from it.
- `main` is stale. Ignore it.

## Layout

- `app/`: expo-router screens. `(tabs)/` is the signed-in app, `(auth)/` is sign-in
  and account screens.
- `src/features/<name>/`: feature code (bible, journal, prayers, connections, ...).
  Also `src/components`, `services`, `contexts`, `store`, `utils`, `constants`, `styles`.
- `api/`: Vercel serverless functions (`notify`, `chapter`, `public/`, and `cron/reminders`
  for scheduled push reminders). Server code here uses the Admin SDK and bypasses
  Firestore rules.
- `assets/bible/<version>/<book>.json`: bundled Bible text.
  Regenerate with `node scripts/build-bible-data.js`.
- `firestore.rules`, `firestore.indexes.json`: security rules and indexes.
- `tests/unit` (logic only, no screens), `tests/rules` (Firestore emulator).

## Commands

- `npm start`: dev server (`npm run web` for web)
- `npm run lint`, `npm run typecheck`, `npm test`
- `npm run test:rules`: needs the Firestore emulator, run when rules or indexes change
- `npx expo export --platform web`: the production build. Run it before proposing a release.

## Conventions

- Imports use the `@/` alias for the repo root.
- Tests cover plain logic, not screens. Add unit tests for new logic in `src/`.
- Rules changes need a matching case in `tests/rules/firestore.rules.test.ts`.

## Compact instructions

When compacting, keep code changes made, file paths touched, failing test output,
and any decisions the user made about releases or Firestore. Drop exploration chatter.
