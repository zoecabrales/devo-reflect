// Web-only Firebase setup. Metro picks this file over firebase.ts when
// bundling for web, so the mobile setup stays untouched.
import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Same Firebase project and web-app config as mobile (see firebase.ts).
// Local development only: EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true in .env
// points the app at the Firebase emulators (`firebase emulators:start`)
// instead of the live project. Never set this in Vercel / EAS.
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  // The emulators only accept "demo-" project ids without a login
  ...(useEmulator ? { projectId: "demo-devo-reflect" } : {}),
};

// The emulator gets its own app name, so its saved sign-in is kept apart
// from the live one (the saved session is keyed by app name): a real login
// is never sent to the emulator, nor a test login to the live project.
const APP_NAME = useEmulator ? "devo-reflect-emulator" : "[DEFAULT]";

// Capture before initializeApp so we can detect hot reloads
const existing = getApps().find((a) => a.name === APP_NAME);
const isFirstInit = !existing;
const app =
  existing ??
  (useEmulator
    ? initializeApp(firebaseConfig, APP_NAME)
    : initializeApp(firebaseConfig));

// Keep the session in the browser's localStorage so users stay signed in
// across tabs and reloads (the web equivalent of AsyncStorage on mobile).
export const auth = isFirstInit
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);

export const db = getFirestore(app);

if (useEmulator && isFirstInit) {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
}

export default app;
