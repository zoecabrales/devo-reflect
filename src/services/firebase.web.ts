// Web-only Firebase setup. Metro picks this file over firebase.ts when
// bundling for web, so the mobile setup stays untouched.
import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Same Firebase project and web-app config as mobile (see firebase.ts).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Capture before initializeApp so we can detect hot reloads
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

// Keep the session in the browser's localStorage so users stay signed in
// across tabs and reloads (the web equivalent of AsyncStorage on mobile).
export const auth = isFirstInit
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);

export const db = getFirestore(app);

export default app;
