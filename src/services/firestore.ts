import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Creates the root user document at users/{uid}.
 * Called once at sign-up — all features (Journal, Prayers, Bookmarks)
 * store their data as sub-collections under this document.
 */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    displayName,
    createdAt: serverTimestamp(),
  });
}

/**
 * Every sub-collection stored under users/{uid}. When a feature adds a new
 * one, add it here too, or account deletion will leave that data behind.
 */
export const USER_COLLECTIONS = [
  "journal",
  "prayers",
  "bookmarks",
  "growth-calendar",
  "reading-plans",
  "memory-verses",
] as const;

/** Firestore allows at most 500 writes in one batch. */
const BATCH_LIMIT = 500;

/**
 * Permanently deletes all of a user's Firestore data: every document in each
 * sub-collection, then the root users/{uid} document. Must run while the user
 * is still signed in (the security rules only let them delete their own data).
 * Throws if anything fails, so the caller can stop before deleting the login.
 */
export async function deleteUserData(uid: string): Promise<void> {
  if (!uid) throw new Error("No user id.");
  for (const name of USER_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, "users", uid, name));
    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      for (const d of snapshot.docs.slice(i, i + BATCH_LIMIT)) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, "users", uid));
}
