// POST /api/notify  { type: "request" | "accepted" | "share", id }
//                   { type: "test" }
//
// Called by the app right after a Brethren action, to notify the other
// person. The server checks the action really happened and was done by the
// caller (so the endpoint can't be used to send arbitrary notifications),
// sends each notification only once, and only to people who turned on
// Brethren notifications. It always answers { ok: true } so the caller
// can't tell whether an email address has an account.
//
// "test" sends a test notification to the caller's own devices and reports
// the result (Settings → Notifications → Send a test notification).

import { formatVerseNumbers } from "../src/utils/verseNumbers";
import { adminAuth, adminDb, callerUid } from "./_lib/admin";
import { notificationSettings, PushMessage, sendToUser } from "./_lib/push";

type NotifyType = "request" | "accepted" | "share";

const ok = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Who to notify, and what to say, for an action by `uid`; null if none. */
export async function recipientsFor(
  type: NotifyType,
  id: string,
  uid: string,
): Promise<{ to: string[]; message: PushMessage } | null> {
  const db = adminDb();
  if (type === "request") {
    const req = (await db.collection("connectionRequests").doc(id).get()).data();
    if (!req || req.fromUid !== uid) return null;
    let to: string;
    try {
      to = (await adminAuth().getUserByEmail(req.toEmail)).uid;
    } catch {
      return null; // No account with that email
    }
    return {
      to: [to],
      message: {
        title: "New Brethren request",
        body: `${req.fromName} wants to connect with you on Devo Reflect.`,
        url: "/brethren",
        tag: `request-${id}`,
      },
    };
  }
  if (type === "accepted") {
    const c = (await db.collection("connections").doc(id).get()).data();
    if (!c || c.accepterId !== uid) return null;
    const name = c.names?.[uid] ?? "Your friend";
    return {
      to: [c.requesterId],
      message: {
        title: "Request accepted",
        body: `${name} accepted your Brethren request.`,
        url: "/brethren",
        tag: `accepted-${id}`,
      },
    };
  }
  const s = (await db.collection("sharedVerses").doc(id).get()).data();
  if (!s || s.authorId !== uid) return null;
  const verses: number[] = s.verses?.length ? s.verses : [s.verse];
  const ref = `${s.bookLabel} ${s.chapter}:${formatVerseNumbers(verses)}`;
  return {
    to: s.visibleTo ?? [],
    message: {
      title: `${s.authorName} shared a verse`,
      body: s.note ? `${ref}: “${s.note}”` : ref,
      url: "/brethren",
      tag: `share-${id}`,
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const uid = await callerUid(request);
  if (!uid) return fail(401, "sign in");

  let body: { type?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad request");
  }
  const { type, id } = body;

  if (type === "test") {
    try {
      const result = await sendToUser(uid, {
        title: "Notifications are working",
        body: "This is a test from Devo Reflect. You're all set!",
        url: "/settings",
        tag: "test",
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error(e);
      return fail(500, String((e as Error).message ?? e).slice(0, 200));
    }
  }

  if (
    (type !== "request" && type !== "accepted" && type !== "share") ||
    typeof id !== "string" ||
    !id ||
    id.length > 600
  ) {
    return fail(400, "bad request");
  }

  try {
    const plan = await recipientsFor(type, id, uid);
    if (!plan) return ok();

    // Each action notifies once, even if the app asks again
    try {
      await adminDb()
        .collection("sentNotifications")
        .doc(`${type}_${id}`.replace(/\//g, "_"))
        .create({ at: Date.now() });
    } catch {
      return ok();
    }

    await Promise.all(
      plan.to.map(async (to) => {
        if ((await notificationSettings(to)).brethrenEnabled !== true) return;
        await sendToUser(to, plan.message);
      }),
    );
  } catch (e) {
    console.error(e);
  }
  return ok();
}
