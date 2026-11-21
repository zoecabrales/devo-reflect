---
name: firestore-safe-change
description: Check Firestore rules, indexes, and stored data-shape changes for backward compatibility with the live production app. Use when changing firestore.rules, firestore.indexes.json, document fields, collection structure, or before running deploy:firestore.
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(npm run test:rules *) Bash(npm run typecheck *)
---

## Pending Firestore-related changes

!`git status --short`
!`git diff HEAD -- firestore.rules firestore.indexes.json`

## Context

The app is live in production with real users. Existing documents were written by
older app versions and will not be migrated. Collections covered by rules:
`users/{uid}/**`, `connectionRequests`, `connections`, `sharedVerses`.
Rules tests live in `tests/rules/`.

## Instructions

Review the changes above plus any code that reads or writes Firestore
(search `src/` and `app/` for the touched collection or field names).

**Rules changes**
- Does the change make an existing legitimate read/write fail? Check each
  collection's current access paths in the app, including older clients.
- Does it loosen access? Flag anything letting a user read or write another
  user's data, or letting unauthenticated access through.
- Is there a rules test in `tests/rules/` covering the new or changed behavior?
  If not, add or propose one.

**Index changes**
- Removing or changing an index can break live queries. Confirm no query in
  the app still depends on it.
- New composite indexes must be deployed before the code that needs them ships.

**Data-shape changes**
- Added fields must be optional or have a default when read, since old documents
  lack them.
- Never rename, remove, or change the type of an existing field in place.
  Use add-new-then-migrate, and keep reading the old field until all data is moved.
- Code must tolerate both old and new document shapes.

**Verify**
- Run `npm run test:rules` and `npm run typecheck`.

## Output

Give a verdict: **safe**, **safe with conditions**, or **breaking**, with the
specific reasons. List the exact order to ship (e.g. indexes, then rules, then
app code). Never run `npm run deploy:firestore` yourself. Tell the user the
change is ready and let them decide, since it affects production.
