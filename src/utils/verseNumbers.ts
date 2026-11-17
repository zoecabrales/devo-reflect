// Shared by the app and the notification server, so it imports nothing.

/** "16", "16–18", "16–18, 20" — runs of consecutive verses collapsed. */
export function formatVerseNumbers(nums: number[]): string {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(
      j === i ? `${sorted[i]}` : `${sorted[i]}\u2013${sorted[j]}`,
    );
    i = j + 1;
  }
  return parts.join(", ");
}
