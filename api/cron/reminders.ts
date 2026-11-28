// GET /api/cron/reminders?slot=morning|evening   (Authorization: Bearer CRON_SECRET)
//
// Sends the Verse of the Day reminder twice a day, at fixed Philippine times.
// Vercel's scheduled jobs call it (see "crons" in vercel.json):
//   morning  6 AM PHT   "Today's verse: John 3:16 …"
//   evening  8 PM PHT   "Evening reflection …"
// Vercel sends CRON_SECRET as a Bearer token, which stops anyone else from
// triggering it. On the free plan each job fires at some point within its
// hour.
//
// Who gets it: everyone with notifications on for at least one device, unless
// they switched the Daily reminder off (it's on by default). Each person gets
// each reminder at most once a day: the send is claimed first
// (sentNotifications/reminder_{uid}_{date}_{slot}, created only if it doesn't
// exist), so overlapping or repeated runs can't send it twice. A problem with
// one account is logged and counted as failed; everyone else still gets
// theirs. The run answers 500 only if something failed and nothing was sent.
//
// For testing, ?email=someone@example.com sends to that one account only.

import { getDailyVerseRef, getPHTDateString } from "../../src/utils/dailyVerse";
import { adminAuth, adminDb } from "../_lib/admin";
import { notificationSettings, PushMessage, sendToUser } from "../_lib/push";

export type ReminderSlot = "morning" | "evening";

/** A reminder older than this is dropped rather than delivered late. */
const REMINDER_TTL_SECONDS = 2 * 60 * 60;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** The reminder for one account: today's Verse of the Day. */
export function reminderMessage(
  uid: string,
  slot: ReminderSlot,
  phtDate = getPHTDateString(),
): PushMessage {
  const v = getDailyVerseRef(uid, phtDate);
  const ref = `${v.bookLabel} ${v.chapter}:${v.verse}`;
  return slot === "morning"
    ? {
        title: "Today's verse",
        body: `${ref}. Take a moment to read and reflect.`,
        url: "/home",
        tag: "daily-reminder",
        ttlSeconds: REMINDER_TTL_SECONDS,
      }
    : {
        title: "Evening reflection",
        body: `Before you rest, spend a quiet moment with today's verse, ${ref}.`,
        url: "/home",
        tag: "daily-reminder",
        ttlSeconds: REMINDER_TTL_SECONDS,
      };
}

/** Everyone with at least one device set up for notifications. */
async function accountsWithDevices(): Promise<string[]> {
  const devices = await adminDb().collectionGroup("push-subscriptions").get();
  const uids = new Set<string>();
  for (const d of devices.docs) {
    const uid = d.ref.parent.parent?.id;
    if (uid) uids.add(uid);
  }
  return [...uids];
}

/**
 * Sends one account its reminder. "undelivered" means no device accepted it
 * (sendToUser logs why).
 */
async function remind(
  uid: string,
  slot: ReminderSlot,
  date: string,
): Promise<"sent" | "skipped" | "undelivered"> {
  if ((await notificationSettings(uid)).reminderEnabled === false) return "skipped";
  // Claim this reminder first; if it's already claimed, it was sent
  try {
    await adminDb()
      .collection("sentNotifications")
      .doc(`reminder_${uid}_${date}_${slot}`)
      .create({ at: Date.now() });
  } catch {
    return "skipped";
  }
  const result = await sendToUser(uid, reminderMessage(uid, slot, date));
  return result.sent > 0 ? "sent" : "undelivered";
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json(401, { error: "unauthorized" });
  }
  const url = new URL(request.url);
  const slot = url.searchParams.get("slot");
  if (slot !== "morning" && slot !== "evening") {
    return json(400, { error: "slot must be morning or evening" });
  }

  let uids: string[];
  const email = url.searchParams.get("email");
  if (email) {
    try {
      uids = [(await adminAuth().getUserByEmail(email)).uid];
    } catch {
      return json(404, { error: "no account with that email" });
    }
  } else {
    uids = await accountsWithDevices();
  }

  const date = getPHTDateString();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const uid of uids) {
    try {
      const outcome = await remind(uid, slot, date);
      if (outcome === "sent") sent++;
      else if (outcome === "skipped") skipped++;
    } catch (e) {
      failed++;
      console.error(`reminders ${slot} ${date}: failed for ${uid}`, e);
    }
  }
  console.log(
    `reminders ${slot} ${date}: ${uids.length} accounts, ${sent} sent, ${skipped} skipped, ${failed} failed`,
  );
  const status = failed > 0 && sent === 0 ? 500 : 200;
  return json(status, { slot, date, accounts: uids.length, sent, skipped, failed });
}
