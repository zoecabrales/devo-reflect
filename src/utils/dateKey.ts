/**
 * Calendar day keys ("YYYY-MM-DD", device-local date). Used for the
 * `forDate` that journal entries / bookmarks can carry when added for a
 * specific calendar day.
 */

/** "YYYY-MM-DD" for a timestamp, in the device's local date. */
export function dateKeyOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local-midnight Date for a "YYYY-MM-DD" key. */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formats a "YYYY-MM-DD" key, e.g. "Tuesday, November 4". */
export function formatDateKey(
  key: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
): string {
  return dateFromKey(key).toLocaleDateString("en-US", options);
}
