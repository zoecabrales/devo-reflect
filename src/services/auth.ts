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
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, deleteUserData } from "./firestore";

const LAST_ACTIVE_KEY = "@last_active_at";
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function setLastActiveAt(): Promise<void> {
  await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

export async function clearLastActiveAt(): Promise<void> {
  await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
}

/** Returns true if the user has been idle for more than 10 minutes. */
export async function isIdleTimeout(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
  if (!raw) return false; // no timestamp yet — first launch, don't sign out
  return Date.now() - Number(raw) > IDLE_TIMEOUT_MS;
}

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
  await clearLastActiveAt();
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
  return user.emailVerified;
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
  "@reading_position",
  "@daily_verse",
  LAST_ACTIVE_KEY,
];
