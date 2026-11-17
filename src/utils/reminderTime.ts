// Daily reminder timing, shared by the app (saving the chosen time) and the
// reminder server (api/cron/reminders.ts), so it must not import anything
// app-only.
//
// A reminder time is a local "HH:MM" in 15-minute steps plus the person's
// time zone. To find who is due without reading everyone's settings, each
// one also stores `reminderSlot`: that time in UTC, as minutes after
// midnight (0–1425, a multiple of 15). The app refreshes it when it opens,
// so a daylight-saving change is picked up the next time the app is used.

export const REMINDER_STEP_MINUTES = 15;
const DAY = 24 * 60;

/** "07:30" → 450 */
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 450 → "07:30" */
export function timeOf(minutes: number): string {
  const m = ((minutes % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "07:00" → "7:00 AM" */
export function formatReminderTime(time: string): string {
  const m = minutesOf(time);
  const h = Math.floor(m / 60);
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${suffix}`;
}

/** The date ("YYYY-MM-DD") and minutes after midnight in a time zone. */
export function localClock(timeZone: string, at: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** How far a time zone is ahead of UTC at a moment, in minutes. */
function utcOffsetMinutes(timeZone: string, at: Date): number {
  const local = localClock(timeZone, at);
  const utcMinutes = at.getUTCHours() * 60 + at.getUTCMinutes();
  let diff = local.minutes - utcMinutes;
  // Across midnight the two clocks are on different days
  if (diff > 12 * 60) diff -= DAY;
  if (diff < -14 * 60) diff += DAY;
  return diff;
}

/** A local reminder time as its UTC slot (see the top of this file). */
export function reminderSlot(time: string, timeZone: string, at = new Date()): number {
  const utc = minutesOf(time) - utcOffsetMinutes(timeZone, at);
  return ((utc % DAY) + DAY) % DAY;
}

/**
 * The slots the reminder job sends for when it runs at `at`: this quarter
 * hour and the three before it, so a run that GitHub starts late (or skips)
 * still catches up within the hour.
 */
export function dueSlots(at: Date): number[] {
  const now = at.getUTCHours() * 60 + at.getUTCMinutes();
  const current = now - (now % REMINDER_STEP_MINUTES);
  return [0, 1, 2, 3].map(
    (i) => (current - i * REMINDER_STEP_MINUTES + DAY) % DAY,
  );
}

/**
 * The local date of the reminder now due, or null if it isn't due (not yet
 * time, or more than an hour late). Sending at most once per date stops a
 * late run, or the run after midnight, from sending twice.
 */
export function dueReminderDate(
  time: string,
  timeZone: string,
  at: Date,
): string | null {
  const local = localClock(timeZone, at);
  const late = (local.minutes - minutesOf(time) + DAY) % DAY;
  if (late >= 60) return null;
  // A 23:50 reminder sent at 00:05 belongs to the day before
  return localClock(timeZone, new Date(at.getTime() - late * 60_000)).date;
}
