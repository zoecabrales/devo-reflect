import {
  dueReminderDate,
  dueSlots,
  formatReminderTime,
  reminderSlot,
  timeOf,
} from "@/src/utils/reminderTime";

// ── Fakes for the server's Firebase Admin and push sending ───────────────────

type Data = Record<string, unknown>;
const mockStore = new Map<string, Data>();
const created = new Set<string>();
const mockSent: { uid: string; title: string; body: string }[] = [];
const mockUsersByEmail: Record<string, string> = {};

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
    where: (field: string, _op: string, values: unknown[]) => ({
      get: async () => {
        const docs = [...mockStore.entries()]
          .filter(([p, d]) => p.split("/").at(-2) === name && values.includes(d[field]))
          .map(([p, d]) => ({ ref: docRef(p), data: () => d }));
        return { docs, size: docs.length };
      },
    }),
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
});

// ── Reminder times ───────────────────────────────────────────────────────────

describe("reminder times", () => {
  it("turns a local time into its UTC slot", () => {
    // Manila is UTC+8 all year
    expect(reminderSlot("07:00", "Asia/Manila")).toBe(23 * 60);
    // New York: UTC-5 in winter, UTC-4 in summer
    expect(reminderSlot("07:00", "America/New_York", new Date("2026-01-15T12:00:00Z"))).toBe(12 * 60);
    expect(reminderSlot("07:00", "America/New_York", new Date("2026-07-15T12:00:00Z"))).toBe(11 * 60);
    // India is UTC+5:30
    expect(reminderSlot("06:00", "Asia/Kolkata")).toBe(30);
  });

  it("checks this quarter hour and the three before it", () => {
    expect(dueSlots(new Date("2026-11-17T12:07:00Z"))).toEqual([720, 705, 690, 675]);
    // Across midnight UTC
    expect(dueSlots(new Date("2026-11-17T00:05:00Z"))).toEqual([0, 1425, 1410, 1395]);
  });

  it("is due from the chosen time until an hour later", () => {
    // 07:00 in Manila is 23:00 UTC the day before
    expect(dueReminderDate("07:00", "Asia/Manila", new Date("2026-11-16T22:55:00Z"))).toBeNull();
    expect(dueReminderDate("07:00", "Asia/Manila", new Date("2026-11-16T23:05:00Z"))).toBe("2026-11-17");
    expect(dueReminderDate("07:00", "Asia/Manila", new Date("2026-11-17T00:05:00Z"))).toBeNull();
  });

  it("counts a late-evening reminder sent after midnight as the day before", () => {
    // 23:45 Manila reminder, job runs at 00:10 Manila the next day
    expect(dueReminderDate("23:45", "Asia/Manila", new Date("2026-11-17T16:10:00Z"))).toBe("2026-11-17");
  });

  it("formats times for people", () => {
    expect(formatReminderTime("07:00")).toBe("7:00 AM");
    expect(formatReminderTime("00:15")).toBe("12:15 AM");
    expect(formatReminderTime("12:30")).toBe("12:30 PM");
    expect(formatReminderTime("21:45")).toBe("9:45 PM");
    expect(timeOf(-15)).toBe("23:45");
    expect(timeOf(24 * 60)).toBe("00:00");
  });
});

// ── The reminder job ─────────────────────────────────────────────────────────

describe("/api/cron/reminders", () => {
  const { GET } = require("@/api/cron/reminders") as typeof import("@/api/cron/reminders");
  const run = (secret = "cron-secret") =>
    GET(new Request("https://example.com/api/cron/reminders", {
      headers: { authorization: `Bearer ${secret}` },
    }));

  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    jest.useFakeTimers({ now: new Date("2026-11-16T23:05:00Z") }); // 07:05 Manila
  });
  afterEach(() => jest.useRealTimers());

  const settings = (extra: Data = {}) => ({
    reminderEnabled: true,
    reminderTime: "07:00",
    timeZone: "Asia/Manila",
    reminderSlot: 23 * 60,
    ...extra,
  });

  it("only runs with the secret", async () => {
    expect((await run("wrong")).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await run("")).status).toBe(401);
  });

  it("sends a due reminder once a day, with today's verse", async () => {
    mockStore.set("users/alice/notifications/settings", settings());
    mockStore.set("users/bob/notifications/settings", settings({ reminderTime: "09:00", reminderSlot: 60 }));

    expect(await (await run()).json()).toMatchObject({ due: 1, sent: 1 });
    expect(mockSent).toHaveLength(1);
    expect(mockSent[0]).toMatchObject({ uid: "alice", title: "Time for your devotion" });
    expect(mockSent[0].body).toMatch(/^Today's verse: .+ \d+:\d+\. Take a moment/);
    expect(mockStore.get("users/alice/notifications/settings")!.lastReminderDate).toBe("2026-11-17");

    // A second run in the same window doesn't send it again
    await run();
    expect(mockSent).toHaveLength(1);
  });

  it("skips reminders that are turned off", async () => {
    mockStore.set("users/alice/notifications/settings", settings({ reminderEnabled: false }));
    await run();
    expect(mockSent).toHaveLength(0);
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
