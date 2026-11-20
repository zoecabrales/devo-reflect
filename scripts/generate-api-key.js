/**
 * Prints a new random API key for the public Verse of the Day endpoint
 * (api/public/verse-of-the-day.ts), as the "name:key" pair to add to the
 * Vercel env var VOTD_API_KEYS (pairs are comma-separated).
 *
 * Usage: node scripts/generate-api-key.js <app name, e.g. church-cms>
 */
const { randomBytes } = require("crypto");

const name = process.argv[2];
if (!name || !/^[a-z0-9-]+$/.test(name)) {
  throw new Error("Usage: node scripts/generate-api-key.js <app name: lowercase letters, digits, dashes>");
}
// 32 random bytes → 43 URL-safe characters
console.log(`${name}:dr_${randomBytes(32).toString("base64url")}`);
