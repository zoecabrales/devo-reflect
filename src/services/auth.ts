import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    EmailAuthProvider,
    createUserWithEmailAndPassword,
    deleteUser,
    reauthenticateWithCredential,
    reload,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    updateProfile,
    type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { deleteConnectionData } from "./connections";
import { turnOffThisDevice } from "./notifications";
import { createUserProfile, deleteUserData } from "./firestore";

// Left on devices by the old 10-minute idle sign-out (removed: people now
// stay signed in until they sign out). Cleared on sign-out and account
// deletion so it doesn't linger.
const LAST_ACTIVE_KEY = "@last_active_at";

export async function signUpEmail(
  email: string,
  password: string,
  fullName: string,
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const { user } = userCredential;
  const trimmedName = fullName.trim();

  await updateProfile(user, { displayName: trimmedName });
  await createUserProfile(user.uid, user.email!, trimmedName);
  await sendEmailVerification(user);

  return userCredential;
}

export async function signInEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  await AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(() => {});
  // Stop this device getting this account's notifications, so the next
  // person to use it doesn't
  const uid = auth.currentUser?.uid;
  if (uid) await turnOffThisDevice(uid).catch(() => {});
  return signOut(auth);
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is currently signed in.");
  await sendEmailVerification(user);
}

export async function reloadAndCheckVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  // reload() updates user.emailVerified but not the ID token, whose
  // email_verified claim is what the Firestore rules (Brethren) check
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}

/**
 * Refreshes the ID token if it still says the email is unverified although
 * the account is verified (verified on another device or tab, or before the
 * fix above). Otherwise the Brethren reads are refused until the token
 * renews itself, up to an hour later.
 */
export async function refreshStaleVerifiedToken(user: User): Promise<void> {
  if (!user.emailVerified) return;
  try {
    const { claims } = await user.getIdTokenResult();
    if (claims.email_verified !== true) await user.getIdToken(true);
  } catch {
    // Offline: the token renews itself later
  }
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No user is currently signed in.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function deleteAccount(currentPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No user is currently signed in.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  // Delete the user's data first, while they are still signed in: once the
  // login is gone the security rules no longer let anyone delete it. If this
  // fails, the account is kept so the user can try again.
  try {
    // Brethren data lives outside users/{uid}. Only touched while
    // the feature is on: before its Firestore rules are deployed, these
    // collections can't be read at all.
    if (BRETHREN_ENABLED) {
      await deleteConnectionData(user.uid, user.email);
    }
    await deleteUserData(user.uid);
  } catch (error) {
    throw Object.assign(
      new Error("Could not delete your data. Please try again."),
      { code: "app/delete-data-failed", cause: error },
    );
  }
  await deleteUser(user);
  // Data kept on this device (highlights, reading position, daily verse)
  await AsyncStorage.multiRemove(DEVICE_DATA_KEYS);
}

/** On-device keys holding a user's data, cleared when their account is deleted. */
const DEVICE_DATA_KEYS = [
  "@highlighted_verses",
  "@underlined_verses",
  "@reading_position",
  "@daily_verse",
  LAST_ACTIVE_KEY,
];
