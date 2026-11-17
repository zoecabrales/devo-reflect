// Push notifications on the website: daily reading reminders and Brethren
// activity. Phase 1 is web only; the Android app comes later.
//
// Firestore (both private to the account, like the rest of users/{uid}):
//   users/{uid}/notifications/settings     what the person wants, see
//                                          NotificationSettings
//   users/{uid}/push-subscriptions/{id}    each device they turned it on for
// The server (api/notify.ts, api/cron/reminders.ts) reads them to send.

import { reminderSlot } from "@/src/utils/reminderTime";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export interface NotificationSettings {
  reminderEnabled: boolean;
  /** Local "HH:MM", in 15-minute steps */
  reminderTime: string;
  brethrenEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  reminderEnabled: false,
  reminderTime: "07:00",
  brethrenEnabled: false,
};

const settingsRef = (uid: string) =>
  doc(db, "users", uid, "notifications", "settings");
const deviceRef = (uid: string, id: string) =>
  doc(db, "users", uid, "push-subscriptions", id);

/** This device's time zone, e.g. "Asia/Manila". */
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// ── What this device can do ──────────────────────────────────────────────────

export type PushSupport =
  | "available"
  | "denied" // the person blocked notifications for this site
  | "needs-home-screen" // iPhone/iPad Safari: only after "Add to Home Screen"
  | "unsupported";

export function pushSupport(): PushSupport {
  // Only in a browser (the phone apps have no document)
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "unsupported";
  }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return ios && !installed ? "needs-home-screen" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "available";
}

// ── This device's subscription ───────────────────────────────────────────────

export class NotificationsError extends Error {
  constructor(public reason: "denied" | "unsupported") {
    super(reason);
  }
}

/** A short, stable id for a push subscription (from its endpoint). */
async function deviceId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(endpoint),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Base64url (the VAPID public key) → bytes, as pushManager expects. */
function keyBytes(base64url: string): Uint8Array {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "available") return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Whether this device is set up to receive this account's notifications. */
export async function isThisDeviceOn(uid: string): Promise<boolean> {
  const sub = await currentSubscription();
  if (!sub) return false;
  return (await getDoc(deviceRef(uid, await deviceId(sub.endpoint)))).exists();
}

/**
 * Asks for permission (if not given yet) and registers this device for the
 * account's notifications. Throws NotificationsError when it can't.
 */
export async function turnOnThisDevice(uid: string): Promise<void> {
  if (pushSupport() !== "available" || !VAPID_PUBLIC_KEY) {
    throw new NotificationsError(
      pushSupport() === "denied" ? "denied" : "unsupported",
    );
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new NotificationsError("denied");

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) as BufferSource,
    }));
  await setDoc(deviceRef(uid, await deviceId(sub.endpoint)), {
    type: "web",
    subscription: sub.toJSON(),
    userAgent: navigator.userAgent.slice(0, 200),
    createdAt: Date.now(),
  });
}

/**
 * Stops this device getting the account's notifications (e.g. on sign-out,
 * so the next person using this browser doesn't get them).
 */
export async function turnOffThisDevice(uid: string): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await deleteDoc(deviceRef(uid, await deviceId(sub.endpoint)));
  await sub.unsubscribe();
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function loadNotificationSettings(
  uid: string,
): Promise<NotificationSettings> {
  const data = (await getDoc(settingsRef(uid))).data() ?? {};
  return {
    reminderEnabled: data.reminderEnabled === true,
    reminderTime:
      typeof data.reminderTime === "string"
        ? data.reminderTime
        : DEFAULT_NOTIFICATION_SETTINGS.reminderTime,
    brethrenEnabled: data.brethrenEnabled === true,
  };
}

/** Saves the settings, with the reminder's UTC slot for this time zone. */
export async function saveNotificationSettings(
  uid: string,
  s: NotificationSettings,
): Promise<void> {
  const tz = timeZone();
  await setDoc(
    settingsRef(uid),
    {
      ...s,
      timeZone: tz,
      reminderSlot: s.reminderEnabled ? reminderSlot(s.reminderTime, tz) : null,
    },
    { merge: true },
  );
}

/**
 * Keeps the reminder at the same local time after a move to another time
 * zone or a daylight-saving change. Run when the app opens; quiet on failure.
 */
export async function refreshReminderSlot(uid: string): Promise<void> {
  try {
    const snap = await getDoc(settingsRef(uid));
    const data = snap.data();
    if (!data?.reminderEnabled || typeof data.reminderTime !== "string") return;
    const tz = timeZone();
    const slot = reminderSlot(data.reminderTime, tz);
    if (data.timeZone !== tz || data.reminderSlot !== slot) {
      await setDoc(settingsRef(uid), { timeZone: tz, reminderSlot: slot }, { merge: true });
    }
  } catch {
    // Tried again next time the app opens
  }
}

// ── Test ─────────────────────────────────────────────────────────────────────

export interface TestResult {
  devices: number;
  sent: number;
  failed: { status: number | null; reason: string }[];
}

/** Sends a test notification to this account's devices; the server's report. */
export async function sendTestNotification(): Promise<TestResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  const res = await fetch(`${API_BASE}/api/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({ type: "test" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
  return data as TestResult;
}

/** What a test result means, in words. */
export function describeTestResult(r: TestResult): string {
  if (r.devices === 0) {
    return "No devices are set up for your notifications. Turn on a notification above on this device first.";
  }
  if (r.sent === r.devices) {
    return r.devices === 1
      ? "Sent to your device. It should appear in a few seconds."
      : `Sent to your ${r.devices} devices. It should appear in a few seconds.`;
  }
  const reasons = r.failed
    .map((f) => `${f.status ?? "no status"}: ${f.reason}`)
    .join("\n");
  return `Sent to ${r.sent} of ${r.devices} devices. The push service refused the rest:\n${reasons}`;
}

// ── Brethren ─────────────────────────────────────────────────────────────────

/**
 * Asks the server to notify the other person about a Brethren action just
 * taken. Runs in the background; a failure never affects the action.
 */
export function notifyBrethren(
  type: "request" | "accepted" | "share",
  id: string,
): void {
  const user = auth.currentUser;
  if (!user) return;
  user
    .getIdToken()
    .then((token) =>
      fetch(`${API_BASE}/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, id }),
      }),
    )
    .catch(() => {
      // Notifications are best-effort
    });
}
