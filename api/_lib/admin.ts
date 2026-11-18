// Firebase Admin for the server functions: reads who to notify across
// accounts. The service account (Vercel env var FIREBASE_SERVICE_ACCOUNT, the
// whole JSON key) can read the whole database, so it must only ever live on
// the server. Files under api/_lib are not exposed as endpoints.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function app() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());

/** The uid of a signed-in caller (Bearer Firebase ID token), or null. */
export async function callerUid(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return (await adminAuth().verifyIdToken(header.slice(7))).uid;
  } catch {
    return null;
  }
}
