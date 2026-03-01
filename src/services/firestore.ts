import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
