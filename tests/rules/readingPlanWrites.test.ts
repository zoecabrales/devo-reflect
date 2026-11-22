// Reading plan progress writes, run against the Firestore emulator
// (npm run test:rules). These call the real recordChapterRead and
// loadPlanProgress, so they catch how Firestore itself treats the writes.
//
// Why this needs the emulator: a merge write with an empty map
// ({ completed: {} }) replaces the stored map instead of adding to it. That
// once wiped every completed day each time a chapter was opened that didn't
// finish its day. A plain unit test can't see that.

import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, setLogLevel } from "firebase/firestore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// The service talks to whichever Firestore the test environment provides
let mockDb: unknown;
jest.mock("@/src/services/firebase", () => ({
  __esModule: true,
  default: {},
  auth: { currentUser: null },
  get db() {
    return mockDb;
  },
}));

import {
  chapterKey,
  loadPlanProgress,
  planSchedule,
  recordChapterRead,
  setDayComplete,
} from "@/src/services/readingPlans";

const UID = "alice";
const PLAN = "psalms-proverbs-month";
const planDoc = () => `users/${UID}/reading-plans/${PLAN}`;
const days = planSchedule(PLAN);

/** chaptersRead entries for the given days, all read on `date`. */
const readOn = (dayIndexes: number[], date: string) =>
  Object.fromEntries(
    dayIndexes.flatMap((d) => days[d].map((c) => [chapterKey(c.bookId, c.chapter), date])),
  );

let env: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel("error");
  env = await initializeTestEnvironment({
    // Its own emulator project, so the open rules below and clearFirestore()
    // can't interfere with firestore.rules.test.ts running at the same time
    projectId: "demo-devo-reflect-plan-writes",
    // Open rules: this file tests the app's writes, not the security rules
    firestore: {
      rules:
        "rules_version = '2'; service cloud.firestore { match /databases/{d}/documents { match /{p=**} { allow read, write: if true; } } }",
    },
  });
  mockDb = env.unauthenticatedContext().firestore();
});

afterEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

async function seedPlan(data: Record<string, unknown>) {
  await setDoc(doc(mockDb as never, planDoc()), { startedOn: "2026-11-17", ...data });
}
async function stored() {
  return (await getDoc(doc(mockDb as never, planDoc()))).data()!;
}

describe("recordChapterRead", () => {
  it("keeps completed days when a chapter is opened that doesn't finish its day", async () => {
    await seedPlan({
      completed: { 0: "2026-11-17", 1: "2026-11-18" },
      chaptersRead: readOn([0, 1], "2026-11-18"),
    });
    const first = days[2][0];
    await recordChapterRead(UID, first.bookId, first.chapter);

    const data = await stored();
    expect(data.completed).toEqual({ 0: "2026-11-17", 1: "2026-11-18" });
    expect(data.chaptersRead[chapterKey(first.bookId, first.chapter)]).toBeDefined();
  });

  it("adds a day when its last chapter is opened, keeping earlier days", async () => {
    await seedPlan({
      completed: { 0: "2026-11-17", 1: "2026-11-18" },
      chaptersRead: readOn([0, 1], "2026-11-18"),
    });
    for (const c of days[2]) await recordChapterRead(UID, c.bookId, c.chapter);

    const data = await stored();
    expect(Object.keys(data.completed).sort()).toEqual(["0", "1", "2"]);
  });

  it("does nothing for a chapter that isn't in the plan", async () => {
    await seedPlan({ completed: { 0: "2026-11-17" }, chaptersRead: readOn([0], "2026-11-17") });
    await recordChapterRead(UID, "genesis", 1);
    expect((await stored()).completed).toEqual({ 0: "2026-11-17" });
  });
});

describe("loadPlanProgress", () => {
  it("restores days that an earlier version wiped, from the chapters already read", async () => {
    // What the old bug left behind: every chapter recorded, no completed days
    await seedPlan({
      completed: {},
      chaptersRead: { ...readOn([0], "2026-11-17"), ...readOn([1], "2026-11-18") },
    });
    const progress = (await loadPlanProgress(UID))[PLAN];

    expect(progress.completed).toEqual({ 0: "2026-11-17", 1: "2026-11-18" });
  });

  it("leaves a day unmarked when only some of its chapters were read", async () => {
    const [firstOfDay0, ...rest] = days[0];
    await seedPlan({
      completed: {},
      chaptersRead: { [chapterKey(firstOfDay0.bookId, firstOfDay0.chapter)]: "2026-11-17" },
    });
    expect(rest.length).toBeGreaterThan(0);
    expect((await loadPlanProgress(UID))[PLAN].completed).toEqual({});
  });

  it("lets the user unmark a restored day, and only that day", async () => {
    await seedPlan({
      completed: {},
      chaptersRead: { ...readOn([0], "2026-11-17"), ...readOn([1], "2026-11-18") },
    });
    // Unmarking removes the day's chapters, so it isn't restored again
    await setDayComplete(UID, PLAN, 0, false);

    const progress = (await loadPlanProgress(UID))[PLAN];
    expect(progress.completed).toEqual({ 1: "2026-11-18" });
  });

  it("keeps a day marked read by hand when chapters are opened later", async () => {
    await seedPlan({ completed: { 3: "2026-11-20" }, chaptersRead: {} });
    const first = days[4][0];
    await recordChapterRead(UID, first.bookId, first.chapter);
    expect((await stored()).completed).toEqual({ 3: "2026-11-20" });
  });
});
