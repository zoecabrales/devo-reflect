import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CalendarVerse {
  /** Document ID — the date in "YYYY-MM-DD" format */
  dateKey: string;
  text: string;
  ref: string;
  updatedAt: number;
}

// ── Collection reference ──────────────────────────────────────────────────────

// Firestore path: users/{uid}/growth-calendar/{dateKey}
function calendarCol(uid: string) {
  return collection(db, "users", uid, "growth-calendar");
}

// ── Read ─────────────────────────────────────────────────────────────────────

/** Loads all saved verses for the user and returns them keyed by dateKey. */
export async function loadGrowthCalendar(
  uid: string,
): Promise<Record<string, CalendarVerse>> {
  const snapshot = await getDocs(calendarCol(uid));
  const result: Record<string, CalendarVerse> = {};
  for (const d of snapshot.docs) {
    const data = d.data();
    result[d.id] = {
      dateKey: d.id,
      text: data.text as string,
      ref: (data.ref as string) ?? "",
      updatedAt: data.updatedAt as number,
    };
  }
  return result;
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Upserts a verse for the given date.
 * Uses setDoc with merge so the first call creates the document and subsequent
 * calls update it — enforcing one verse per date at the data layer.
 */
export async function saveCalendarVerse(
  uid: string,
  dateKey: string,
  text: string,
  ref: string,
): Promise<void> {
  const now = Date.now();
  await setDoc(
    doc(db, "users", uid, "growth-calendar", dateKey),
    {
      text,
      ref,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true },
  );
}
