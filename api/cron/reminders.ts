// GET /api/cron/reminders   (Authorization: Bearer CRON_SECRET)
//
// Sends the daily reading reminders that are due. Called every 15 minutes by
// the GitHub scheduled job in .github/workflows/reminders.yml; the secret
// stops anyone else from triggering it. Each reminder is sent at most once
// per day (lastReminderDate), even if runs overlap or one starts late.

import { getDailyVerseRef, getPHTDateString } from "../../src/utils/dailyVerse";
import { dueReminderDate, dueSlots } from "../../src/utils/reminderTime";
import { adminDb } from "../_lib/admin";
import { PushMessage, sendToUser } from "../_lib/push";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** The reminder for one account: today's Verse of the Day. */
export function reminderMessage(uid: string, phtDate = getPHTDateString()): PushMessage {
  const v = getDailyVerseRef(uid, phtDate);
  return {
    title: "Time for your devotion",
    body: `Today's verse: ${v.bookLabel} ${v.chapter}:${v.verse}. Take a moment to read and reflect.`,
    url: "/home",
    tag: "daily-reminder",
  };
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json(401, { error: "unauthorized" });
  }

  const now = new Date();
  const due = await adminDb()
    .collectionGroup("notifications")
    .where("reminderSlot", "in", dueSlots(now))
    .get();

  let sent = 0;
  let skipped = 0;
  for (const doc of due.docs) {
    const uid = doc.ref.parent.parent?.id;
    const s = doc.data();
    const date =
      uid && s.reminderEnabled && s.reminderTime && s.timeZone
        ? dueReminderDate(s.reminderTime, s.timeZone, now)
        : null;
    if (!uid || !date || s.lastReminderDate === date) {
      skipped++;
      continue;
    }
    // Mark it first, so an overlapping run doesn't send it again
    await doc.ref.update({ lastReminderDate: date });
    if ((await sendToUser(uid, reminderMessage(uid))).sent > 0) sent++;
  }
  return json(200, { due: due.size, sent, skipped });
}
