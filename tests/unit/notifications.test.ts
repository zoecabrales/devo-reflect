// ── Fakes for the server's Firebase Admin and push sending ───────────────────

type Data = Record<string, unknown>;
const mockStore = new Map<string, Data>();
const created = new Set<string>();
const mockSent: { uid: string; title: string; body: string }[] = [];
const mockUsersByEmail: Record<string, string> = {};
const mockBroken = new Set<string>(); // accounts whose send throws

function docRef(path: string) {
  return {
    id: path.split("/").pop()!,
    path,
    parent: { parent: { id: path.split("/")[1] } },
    get: async () => ({ exists: mockStore.has(path), data: () => mockStore.get(path) }),
    update: async (d: Data) => mockStore.set(path, { ...mockStore.get(path), ...d }),
    create: async (d: Data) => {
      if (created.has(path) || mockStore.has(path)) throw new Error("exists");
      created.add(path);
      mockStore.set(path, d);
    },
  };
}
function collection(path: string) {
  return { doc: (id: string) => ({ ...docRef(`${path}/${id}`), collection: (c: string) => collection(`${path}/${id}/${c}`) }) };
}
const mockDb = {
  collection,
  collectionGroup: (name: string) => ({
    get: async () => {
      const docs = [...mockStore.entries()]
        .filter(([p]) => p.split("/").at(-2) === name)
        .map(([p, d]) => ({ ref: docRef(p), data: () => d }));
      return { docs, size: docs.length };
    },
  }),
};

jest.mock("@/api/_lib/admin", () => ({
  adminDb: () => mockDb,
  adminAuth: () => ({
    getUserByEmail: async (email: string) => {
      if (!mockUsersByEmail[email]) throw new Error("no user");
      return { uid: mockUsersByEmail[email] };
    },
  }),
  callerUid: async (req: Request) =>
    req.headers.get("authorization")?.replace("Bearer ", "") || null,
}));
jest.mock("@/api/_lib/push", () => ({
  sendToUser: async (uid: string, m: { title: string; body: string }) => {
    if (mockBroken.has(uid)) throw new Error("send failed");
    mockSent.push({ uid, title: m.title, body: m.body });
    return { devices: 1, sent: 1, failed: [] };
  },
  notificationSettings: async (uid: string) =>
    mockStore.get(`users/${uid}/notifications/settings`) ?? {},
}));

beforeEach(() => {
  mockStore.clear();
  created.clear();
  mockSent.length = 0;
  mockBroken.clear();
});

// ── The Verse of the Day reminders ───────────────────────────────────────────

describe("/api/cron/reminders", () => {
  const { GET } = require("@/api/cron/reminders") as typeof import("@/api/cron/reminders");
  const run = (query: string, secret = "cron-secret") =>
    GET(new Request(`https://example.com/api/cron/reminders?${query}`, {
      headers: { authorization: `Bearer ${secret}` },
    }));
  const device = (uid: string) =>
    mockStore.set(`users/${uid}/push-subscriptions/d1`, { type: "web" });

  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    mockUsersByEmail["alice@example.com"] = "alice";
  });

  it("only runs with the secret, for morning or evening", async () => {
    expect((await run("slot=morning", "wrong")).status).toBe(401);
    expect((await run("slot=noon")).status).toBe(400);
  });

  it("is on by default for everyone with a device, once per slot per day", async () => {
    device("alice");
    device("bob");
    mockStore.set("users/bob/notifications/settings", { reminderEnabled: true });

    expect(await (await run("slot=morning")).json()).toMatchObject({ accounts: 2, sent: 2 });
    expect(mockSent.map((m) => m.uid).sort()).toEqual(["alice", "bob"]);
    expect(mockSent[0].title).toBe("Today's verse");
    expect(mockSent[0].body).toMatch(/^.+ \d+:\d+\. Take a moment to read and reflect\.$/);

    // Running again sends nothing more; the evening one still goes out
    await run("slot=morning");
    expect(mockSent).toHaveLength(2);
    await run("slot=evening");
    expect(mockSent).toHaveLength(4);
    expect(mockSent[3].title).toBe("Evening reflection");
  });

  it("skips people who switched it off, and people without a device", async () => {
    device("alice");
    mockStore.set("users/alice/notifications/settings", { reminderEnabled: false });
    mockStore.set("users/carol/notifications/settings", { brethrenEnabled: true });
    expect(await (await run("slot=morning")).json()).toMatchObject({ accounts: 1, sent: 0, skipped: 1 });
    expect(mockSent).toHaveLength(0);
  });

  it("carries on to everyone else when one account fails", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    device("alice");
    device("bob");
    mockBroken.add("alice");
    const res = await run("slot=morning");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ accounts: 2, sent: 1, failed: 1 });
    expect(mockSent.map((m) => m.uid)).toEqual(["bob"]);
    log.mockRestore();
  });

  it("answers 500 when nothing could be sent", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    device("alice");
    mockBroken.add("alice");
    expect((await run("slot=morning")).status).toBe(500);
    log.mockRestore();
  });

  it("can send to a single account for testing", async () => {
    device("alice");
    device("bob");
    await run("slot=evening&email=alice@example.com");
    expect(mockSent.map((m) => m.uid)).toEqual(["alice"]);
    expect((await run("slot=evening&email=nobody@example.com")).status).toBe(404);
  });

  it("expires the reminder after 2 hours rather than delivering it late", () => {
    const { reminderMessage } = require("@/api/cron/reminders") as typeof import("@/api/cron/reminders");
    expect(reminderMessage("alice", "morning", "2026-11-18").ttlSeconds).toBe(7200);
  });
});

// ── Brethren notifications ───────────────────────────────────────────────────

describe("/api/notify", () => {
  const { POST } = require("@/api/notify") as typeof import("@/api/notify");
  const notify = (caller: string | null, body: unknown) =>
    POST(new Request("https://example.com/api/notify", {
      method: "POST",
      headers: caller ? { authorization: `Bearer ${caller}` } : {},
      body: JSON.stringify(body),
    }));
  const brethrenOn = (uid: string) =>
    mockStore.set(`users/${uid}/notifications/settings`, { brethrenEnabled: true });

  beforeEach(() => {
    mockUsersByEmail["bob@example.com"] = "bob";
    mockStore.set("connectionRequests/alice_bob@example.com", {
      fromUid: "alice", fromName: "Alice", toEmail: "bob@example.com",
    });
    mockStore.set("connections/alice_bob", {
      members: ["alice", "bob"], names: { alice: "Alice", bob: "Bob" },
      requesterId: "alice", accepterId: "bob",
    });
    mockStore.set("sharedVerses/s1", {
      authorId: "alice", authorName: "Alice", bookLabel: "Psalms", chapter: 23,
      verse: 1, verses: [1, 2, 3], note: "", visibleTo: ["bob", "carol"],
    });
  });

  it("needs a signed-in caller and a known action", async () => {
    expect((await notify(null, { type: "request", id: "x" })).status).toBe(401);
    expect((await notify("alice", { type: "spam", id: "x" })).status).toBe(400);
  });

  it("tells the recipient about a request, once", async () => {
    brethrenOn("bob");
    await notify("alice", { type: "request", id: "alice_bob@example.com" });
    await notify("alice", { type: "request", id: "alice_bob@example.com" });
    expect(mockSent).toEqual([
      { uid: "bob", title: "New Brethren request", body: "Alice wants to connect with you on Devo Reflect." },
    ]);
  });

  it("ignores actions the caller didn't take", async () => {
    brethrenOn("bob");
    const res = await notify("carol", { type: "request", id: "alice_bob@example.com" });
    expect(res.status).toBe(200); // never reveals anything
    expect(mockSent).toHaveLength(0);
  });

  it("tells the requester their request was accepted", async () => {
    brethrenOn("alice");
    await notify("bob", { type: "accepted", id: "alice_bob" });
    expect(mockSent).toEqual([
      { uid: "alice", title: "Request accepted", body: "Bob accepted your Brethren request." },
    ]);
  });

  it("tells only people who turned Brethren notifications on about a share", async () => {
    brethrenOn("bob"); // carol hasn't
    await notify("alice", { type: "share", id: "s1" });
    expect(mockSent).toEqual([
      { uid: "bob", title: "Alice shared a verse", body: "Psalms 23:1–3" },
    ]);
  });

  it("stays quiet for an email with no account", async () => {
    mockStore.set("connectionRequests/alice_nobody@example.com", {
      fromUid: "alice", fromName: "Alice", toEmail: "nobody@example.com",
    });
    expect((await notify("alice", { type: "request", id: "alice_nobody@example.com" })).status).toBe(200);
    expect(mockSent).toHaveLength(0);
  });
});

describe("test notifications", () => {
  const { POST } = require("@/api/notify") as typeof import("@/api/notify");
  const { describeTestResult } = require("@/src/services/notifications") as typeof import("@/src/services/notifications");

  it("sends to the caller's own devices and reports back", async () => {
    const res = await POST(new Request("https://example.com/api/notify", {
      method: "POST",
      headers: { authorization: "Bearer alice" },
      body: JSON.stringify({ type: "test" }),
    }));
    expect(await res.json()).toEqual({ devices: 1, sent: 1, failed: [] });
    expect(mockSent).toEqual([
      expect.objectContaining({ uid: "alice", title: "Notifications are working" }),
    ]);
  });

  it("explains the result in words", () => {
    expect(describeTestResult({ devices: 0, sent: 0, failed: [] })).toMatch(/No devices/);
    expect(describeTestResult({ devices: 1, sent: 1, failed: [] })).toMatch(/^Sent to your device/);
    expect(
      describeTestResult({ devices: 2, sent: 1, failed: [{ status: 403, reason: "BadJwtToken" }] }),
    ).toBe("Sent to 1 of 2 devices. The push service refused the rest:\n403: BadJwtToken");
  });
});
