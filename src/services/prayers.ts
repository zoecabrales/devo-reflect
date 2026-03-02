import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface PrayerRequest {
  id: string;
  text: string;
  answeredAt: number | null; // null = unanswered, timestamp = answered
  createdAt: number;
}

// Firestore path: users/{uid}/prayers/{prayerId}
function prayersRef(uid: string) {
  return collection(db, "users", uid, "prayers");
}

export async function loadPrayers(uid: string): Promise<PrayerRequest[]> {
  const q = query(prayersRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      text: data.text as string,
      answeredAt: (data.answeredAt as number | null) ?? null,
      createdAt: data.createdAt as number,
    };
  });
}

export async function addPrayer(
  uid: string,
  text: string,
): Promise<PrayerRequest> {
  const now = Date.now();
  const ref = await addDoc(prayersRef(uid), {
    text,
    answeredAt: null,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });
  return { id: ref.id, text, answeredAt: null, createdAt: now };
}

export async function toggleAnswered(
  uid: string,
  prayerId: string,
  currentAnsweredAt: number | null,
): Promise<number | null> {
  const answeredAt = currentAnsweredAt ? null : Date.now();
  await updateDoc(doc(db, "users", uid, "prayers", prayerId), { answeredAt });
  return answeredAt;
}

export async function updatePrayer(
  uid: string,
  prayerId: string,
  newText: string,
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "prayers", prayerId), {
    text: newText,
  });
}

export async function deletePrayer(
  uid: string,
  prayerId: string,
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "prayers", prayerId));
}
