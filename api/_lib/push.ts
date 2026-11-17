// Sends a notification to every device a person turned notifications on for.
// Devices live in users/{uid}/push-subscriptions (written by the app).
// Website devices use standard web push with this app's VAPID keys (Vercel
// env vars VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY).

import webpush from "web-push";
import { adminDb } from "./admin";

export interface PushMessage {
  title: string;
  body: string;
  /** Page to open when the notification is tapped, e.g. "/brethren". */
  url: string;
  /** Notifications with the same tag replace each other. */
  tag?: string;
}

let vapidSet = false;
function setVapid() {
  if (vapidSet) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not set");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:jirehzoe@gmail.com",
    publicKey,
    privateKey,
  );
  vapidSet = true;
}

/** Sends to all of a person's devices; returns how many accepted it. */
export async function sendToUser(uid: string, message: PushMessage): Promise<number> {
  const devices = await adminDb()
    .collection("users")
    .doc(uid)
    .collection("push-subscriptions")
    .get();
  if (devices.empty) return 0;
  setVapid();
  let sent = 0;
  await Promise.all(
    devices.docs.map(async (device) => {
      const d = device.data();
      if (d.type !== "web" || !d.subscription) return;
      try {
        await webpush.sendNotification(d.subscription, JSON.stringify(message), {
          TTL: 60 * 60 * 12,
        });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // The browser unsubscribed or the subscription expired: forget it
        if (status === 404 || status === 410) await device.ref.delete();
        else console.error("web push failed", status);
      }
    }),
  );
  return sent;
}

/** A person's notification settings (users/{uid}/notifications/settings). */
export async function notificationSettings(uid: string) {
  const snap = await adminDb()
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .doc("settings")
    .get();
  return snap.data() ?? {};
}
