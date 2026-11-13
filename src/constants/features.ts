// ── Feature switches ─────────────────────────────────────────────────────────
// Features still being built stay hidden in production until switched on.
// Turn one on locally with its EXPO_PUBLIC_* variable in .env; turn it on for
// everyone by adding the same variable in Vercel (and EAS) once it's ready.

/**
 * Brethren: connect with other users by email and share verses
 * with them. Needs the Firestore rules and index in firestore.rules /
 * firestore.indexes.json deployed before it is switched on.
 */
export const BRETHREN_ENABLED =
  process.env.EXPO_PUBLIC_FEATURE_BRETHREN === "true";
