// Firestore security rules, tested in the emulator (npm run test:rules).
// Each test signs in as a made-up user and checks what the rules in
// firestore.rules allow. Nothing here touches the real database.

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
} from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

let env: RulesTestEnvironment;

const ALICE = { uid: "alice", email: "alice@example.com" };
const BOB = { uid: "bob", email: "bob@example.com" };
const CAROL = { uid: "carol", email: "carol@example.com" };

/** Firestore as a signed-in user (email verified unless said otherwise). */
function as(user: { uid: string; email: string }, verified = true) {
  return env
    .authenticatedContext(user.uid, { email: user.email, email_verified: verified })
    .firestore();
}
const signedOut = () => env.unauthenticatedContext().firestore();

/** Writes documents directly, ignoring the rules (test setup). */
async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

beforeAll(async () => {
  // Refused writes are expected here; don't log each one as a warning
  setLogLevel("error");
  env = await initializeTestEnvironment({
    projectId: "demo-devo-reflect",
    firestore: {
      rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8"),
    },
  });
});

afterEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

// ── Personal data ────────────────────────────────────────────────────────────

describe("users/{uid}/…", () => {
  const entry = "users/alice/journal/entry1";

  it("lets you read and write your own data", async () => {
    const db = as(ALICE);
    await assertSucceeds(setDoc(doc(db, entry), { text: "Grateful today" }));
    await assertSucceeds(getDoc(doc(db, entry)));
    await assertSucceeds(deleteDoc(doc(db, entry)));
  });

  it("covers every collection, including ones added later", async () => {
    await assertSucceeds(
      setDoc(doc(as(ALICE), "users/alice/anything-new/x"), { a: 1 }),
    );
  });

  it("keeps your data from other users", async () => {
    await seed(entry, { text: "Private prayer" });
    const db = as(BOB);
    await assertFails(getDoc(doc(db, entry)));
    await assertFails(setDoc(doc(db, entry), { text: "edited" }));
    await assertFails(deleteDoc(doc(db, entry)));
    await assertFails(setDoc(doc(db, "users/alice/journal/new"), { text: "x" }));
  });

  it("keeps your data from signed-out visitors", async () => {
    await seed(entry, { text: "Private prayer" });
    await assertFails(getDoc(doc(signedOut(), entry)));
  });
});

// ── Brethren: requests ───────────────────────────────────────────────────────

describe("connectionRequests", () => {
  const request = (overrides: Record<string, unknown> = {}) => ({
    fromUid: "alice",
    fromName: "Alice",
    fromEmail: "alice@example.com",
    toEmail: "bob@example.com",
    createdAt: 1,
    ...overrides,
  });
  const id = "alice_bob@example.com";

  it("lets a verified user send a request", async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), "connectionRequests", id), request()));
  });

  it("needs a verified email", async () => {
    await assertFails(
      setDoc(doc(as(ALICE, false), "connectionRequests", id), request()),
    );
  });

  it("rejects a request pretending to be from someone else", async () => {
    await assertFails(
      setDoc(doc(as(CAROL), "connectionRequests", id), request()),
    );
    await assertFails(
      setDoc(
        doc(as(ALICE), "connectionRequests", id),
        request({ fromEmail: "carol@example.com" }),
      ),
    );
  });

  it("rejects a badly formed request", async () => {
    const db = as(ALICE);
    // Id doesn't match sender + email
    await assertFails(setDoc(doc(db, "connectionRequests", "whatever"), request()));
    // Email not lower case
    await assertFails(
      setDoc(
        doc(db, "connectionRequests", "alice_Bob@example.com"),
        request({ toEmail: "Bob@example.com" }),
      ),
    );
    // To yourself
    await assertFails(
      setDoc(
        doc(db, "connectionRequests", "alice_alice@example.com"),
        request({ toEmail: "alice@example.com" }),
      ),
    );
    // Extra fields
    await assertFails(
      setDoc(doc(db, "connectionRequests", id), request({ admin: true })),
    );
    // Name too long
    await assertFails(
      setDoc(doc(db, "connectionRequests", id), request({ fromName: "x".repeat(101) })),
    );
  });

  it("can't be overwritten once sent", async () => {
    await seed(`connectionRequests/${id}`, request());
    await assertFails(
      setDoc(doc(as(ALICE), "connectionRequests", id), request({ createdAt: 2 })),
    );
  });

  it("is visible only to the sender and the person it was sent to", async () => {
    await seed(`connectionRequests/${id}`, request());
    await assertSucceeds(getDoc(doc(as(ALICE), "connectionRequests", id)));
    await assertSucceeds(getDoc(doc(as(BOB), "connectionRequests", id)));
    await assertFails(getDoc(doc(as(CAROL), "connectionRequests", id)));
  });

  it("can be declined by the recipient, but not removed by others", async () => {
    await seed(`connectionRequests/${id}`, request());
    await assertFails(deleteDoc(doc(as(CAROL), "connectionRequests", id)));
    await assertSucceeds(deleteDoc(doc(as(BOB), "connectionRequests", id)));
  });
});

// ── Brethren: connections ────────────────────────────────────────────────────

describe("connections", () => {
  const connection = (overrides: Record<string, unknown> = {}) => ({
    members: ["alice", "bob"],
    names: { alice: "Alice", bob: "Bob" },
    requesterId: "alice",
    accepterId: "bob",
    createdAt: 1,
    ...overrides,
  });
  const seedRequest = () =>
    seed("connectionRequests/alice_bob@example.com", {
      fromUid: "alice",
      fromName: "Alice",
      fromEmail: "alice@example.com",
      toEmail: "bob@example.com",
      createdAt: 1,
    });

  it("lets the recipient accept a pending request", async () => {
    await seedRequest();
    await assertSucceeds(
      setDoc(doc(as(BOB), "connections", "alice_bob"), connection()),
    );
  });

  it("can't be created without a request", async () => {
    await assertFails(setDoc(doc(as(BOB), "connections", "alice_bob"), connection()));
  });

  it("can't be created by the sender or a stranger", async () => {
    await seedRequest();
    // The sender accepting their own request
    await assertFails(
      setDoc(
        doc(as(ALICE), "connections", "alice_bob"),
        connection({ requesterId: "bob", accepterId: "alice" }),
      ),
    );
    // Someone else joining it
    await assertFails(
      setDoc(
        doc(as(CAROL), "connections", "alice_carol"),
        connection({ members: ["alice", "carol"], accepterId: "carol" }),
      ),
    );
  });

  it("needs members in order and a matching id", async () => {
    await seedRequest();
    await assertFails(
      setDoc(
        doc(as(BOB), "connections", "bob_alice"),
        connection({ members: ["bob", "alice"] }),
      ),
    );
    await assertFails(setDoc(doc(as(BOB), "connections", "other"), connection()));
  });

  it("is visible to and removable by its two members only", async () => {
    await seed("connections/alice_bob", connection());
    await assertSucceeds(getDoc(doc(as(ALICE), "connections", "alice_bob")));
    await assertFails(getDoc(doc(as(CAROL), "connections", "alice_bob")));
    await assertFails(deleteDoc(doc(as(CAROL), "connections", "alice_bob")));
    await assertSucceeds(deleteDoc(doc(as(BOB), "connections", "alice_bob")));
  });

  it("can't be edited", async () => {
    await seed("connections/alice_bob", connection());
    await assertFails(
      updateDoc(doc(as(ALICE), "connections", "alice_bob"), {
        members: ["alice", "carol"],
      }),
    );
  });
});

// ── Brethren: shared verses ──────────────────────────────────────────────────

describe("sharedVerses", () => {
  const share = (overrides: Record<string, unknown> = {}) => ({
    authorId: "alice",
    authorName: "Alice",
    bookId: "john",
    bookLabel: "John",
    chapter: 3,
    verse: 16,
    verses: [16],
    text: "For God so loved the world…",
    version: "ESV",
    note: "This encouraged me",
    visibleTo: ["bob", "carol"],
    createdAt: 1,
    ...overrides,
  });
  const ref = (db: ReturnType<typeof as>) => doc(db, "sharedVerses", "s1");

  it("lets a verified user share with their connections", async () => {
    await assertSucceeds(setDoc(ref(as(ALICE)), share()));
  });

  it("rejects a share that is badly formed or not yours", async () => {
    await assertFails(setDoc(ref(as(BOB)), share()));
    await assertFails(setDoc(ref(as(ALICE)), share({ visibleTo: ["alice", "bob"] })));
    await assertFails(setDoc(ref(as(ALICE)), share({ note: "x".repeat(501) })));
    await assertFails(setDoc(ref(as(ALICE)), share({ pinned: true })));
    await assertFails(setDoc(ref(as(ALICE, false)), share()));
  });

  it("is visible to the author and the people it was shared with", async () => {
    await seed("sharedVerses/s1", share({ visibleTo: ["bob"] }));
    await assertSucceeds(getDoc(ref(as(ALICE))));
    await assertSucceeds(getDoc(ref(as(BOB))));
    await assertFails(getDoc(ref(as(CAROL))));
  });

  it("lets a reader remove only themselves", async () => {
    await seed("sharedVerses/s1", share());
    await assertSucceeds(updateDoc(ref(as(BOB)), { visibleTo: ["carol"] }));
    await seed("sharedVerses/s1", share());
    // Removing someone else, or adding someone
    await assertFails(updateDoc(ref(as(BOB)), { visibleTo: ["bob"] }));
    await assertFails(updateDoc(ref(as(BOB)), { visibleTo: ["bob", "carol", "dave"] }));
    // Changing the text
    await assertFails(updateDoc(ref(as(BOB)), { text: "changed" }));
  });

  it("lets the author narrow who sees it, but not widen it", async () => {
    await seed("sharedVerses/s1", share({ visibleTo: ["bob"] }));
    await assertFails(updateDoc(ref(as(ALICE)), { visibleTo: ["bob", "carol"] }));
    await assertSucceeds(updateDoc(ref(as(ALICE)), { visibleTo: [] }));
  });

  it("can be deleted by the author only", async () => {
    await seed("sharedVerses/s1", share());
    await assertFails(deleteDoc(ref(as(BOB))));
    await assertSucceeds(deleteDoc(ref(as(ALICE))));
  });
});
