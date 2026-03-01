import {
    EmailAuthProvider,
    createUserWithEmailAndPassword,
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
  await updateProfile(userCredential.user, { displayName: fullName.trim() });
  await sendEmailVerification(userCredential.user);
  return userCredential;
}

export async function signInEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
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
