import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Brethren (Firestore) ───────────────────────────────────────────
// Top-level collections, guarded by firestore.rules:
//   connectionRequests/{fromUid}_{toEmail}  pending requests, by email
//   connections/{uidA}_{uidB}               accepted pairs (uids sorted)
//   sharedVerses/{autoId}                   verses shared with connections

export interface ConnectionRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  createdAt: number;
}

export interface Connection {
  id: string;
  /** The other person. */
  uid: string;
  name: string;
  createdAt: number;
}

export interface SharedVerse {
  id: string;
  authorId: string;
  authorName: string;
  bookId: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  /** All verses when several were shared together. */
  verses?: number[] | null;
  text: string;
  version: string;
  note: string;
  visibleTo: string[];
  createdAt: number;
}

/** Max length of the optional note on a shared verse (matches the rules). */
export const SHARE_NOTE_MAX = 500;

const requestsCol = () => collection(db, "connectionRequests");
const connectionsCol = () => collection(db, "connections");
const sharesCol = () => collection(db, "sharedVerses");

function me() {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not signed in.");
  return {
    uid: user.uid,
    email: user.email.toLowerCase(),
    name: user.displayName?.trim() || user.email.split("@")[0],
  };
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pairId(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

function toRequest(d: QueryDocumentSnapshot): ConnectionRequest {
  const data = d.data();
  return {
    id: d.id,
    fromUid: data.fromUid,
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    toEmail: data.toEmail,
    createdAt: data.createdAt,
  };
}

// ── Requests ─────────────────────────────────────────────────────────────────

/**
 * Sends a request to an email address. Succeeds whether or not the email has
 * an account, so the app never reveals who uses it. Throws "invalid" for a
 * malformed address and "self" for your own email.
 */
export async function sendConnectionRequest(rawEmail: string): Promise<void> {
  const self = me();
  const toEmail = normaliseEmail(rawEmail);
  if (!isValidEmail(toEmail)) throw new Error("invalid");
  if (toEmail === self.email) throw new Error("self");
  await setDoc(doc(requestsCol(), `${self.uid}_${toEmail}`), {
    fromUid: self.uid,
    fromName: self.name,
    fromEmail: self.email,
    toEmail,
    createdAt: Date.now(),
  });
}

/** Requests other people sent to your email. */
export async function loadIncomingRequests(): Promise<ConnectionRequest[]> {
  const self = me();
  const snap = await getDocs(
    query(requestsCol(), where("toEmail", "==", self.email)),
  );
  return snap.docs.map(toRequest).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Live list of requests sent to your email: calls onChange now and whenever
 * one arrives, is accepted or is declined. Returns a function that stops
 * listening.
 */
export function subscribeIncomingRequests(
  email: string,
  onChange: (requests: ConnectionRequest[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(requestsCol(), where("toEmail", "==", normaliseEmail(email))),
    (snap) =>
      onChange(
        snap.docs.map(toRequest).sort((a, b) => b.createdAt - a.createdAt),
      ),
    (error) => onError?.(error),
  );
}

/** Requests you sent that haven't been answered. */
export async function loadSentRequests(): Promise<ConnectionRequest[]> {
  const self = me();
  const snap = await getDocs(
    query(requestsCol(), where("fromUid", "==", self.uid)),
  );
  return snap.docs.map(toRequest).sort((a, b) => b.createdAt - a.createdAt);
}

/** Accepts a request: creates the connection and removes the request. */
export async function acceptRequest(req: ConnectionRequest): Promise<void> {
  const self = me();
  // Already connected (e.g. you both sent a request): just clear this one
  const existing = await loadConnections();
  if (existing.some((c) => c.uid === req.fromUid)) {
    await deleteRequest(req);
    return;
  }
  const members = [req.fromUid, self.uid].sort();
  const batch = writeBatch(db);
  batch.set(doc(connectionsCol(), pairId(req.fromUid, self.uid)), {
    members,
    names: { [req.fromUid]: req.fromName, [self.uid]: self.name },
    requesterId: req.fromUid,
    accepterId: self.uid,
    createdAt: Date.now(),
  });
  batch.delete(doc(requestsCol(), req.id));
  await batch.commit();
}

/** Declines a request sent to you, or cancels one you sent. */
export async function deleteRequest(req: ConnectionRequest): Promise<void> {
  await deleteDoc(doc(requestsCol(), req.id));
}

// ── Connections ──────────────────────────────────────────────────────────────

export async function loadConnections(): Promise<Connection[]> {
  const self = me();
  const snap = await getDocs(
    query(connectionsCol(), where("members", "array-contains", self.uid)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      const other = (data.members as string[]).find((m) => m !== self.uid)!;
      return {
        id: d.id,
        uid: other,
        name: (data.names?.[other] as string) ?? "Friend",
        createdAt: data.createdAt as number,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Removes a connection. Each of you stops seeing the verses the other shared:
 * you're taken off their shares, and they're taken off yours.
 */
export async function removeConnection(c: Connection): Promise<void> {
  const self = me();
  const [mine, theirs] = await Promise.all([
    getDocs(query(sharesCol(), where("authorId", "==", self.uid))),
    getDocs(
      query(sharesCol(), where("visibleTo", "array-contains", self.uid)),
    ),
  ]);
  const updates: { ref: QueryDocumentSnapshot["ref"]; visibleTo: string[] }[] =
    [];
  for (const d of mine.docs) {
    const v = d.data().visibleTo as string[];
    if (v.includes(c.uid)) {
      updates.push({ ref: d.ref, visibleTo: v.filter((u) => u !== c.uid) });
    }
  }
  for (const d of theirs.docs) {
    if (d.data().authorId !== c.uid) continue;
    const v = d.data().visibleTo as string[];
    updates.push({ ref: d.ref, visibleTo: v.filter((u) => u !== self.uid) });
  }
  await commitInBatches([
    ...updates.map((u) => (b: ReturnType<typeof writeBatch>) =>
      b.update(u.ref, { visibleTo: u.visibleTo }),
    ),
    (b) => b.delete(doc(connectionsCol(), c.id)),
  ]);
}

// ── Shared verses ────────────────────────────────────────────────────────────

/**
 * Shares a verse (or passage) with everyone you're connected to right now.
 * Returns how many people it was shared with (0 = no connections, nothing
 * saved).
 */
export async function shareVerse(input: {
  bookId: string;
  bookLabel: string;
  chapter: number;
  verse: number;
  verses?: number[] | null;
  text: string;
  version: string;
  note?: string;
}): Promise<number> {
  const self = me();
  const connections = await loadConnections();
  if (connections.length === 0) return 0;
  await setDoc(doc(sharesCol()), {
    authorId: self.uid,
    authorName: self.name,
    bookId: input.bookId,
    bookLabel: input.bookLabel,
    chapter: input.chapter,
    verse: input.verse,
    verses: input.verses && input.verses.length > 1 ? input.verses : null,
    text: input.text,
    version: input.version,
    note: (input.note ?? "").trim().slice(0, SHARE_NOTE_MAX),
    visibleTo: connections.map((c) => c.uid),
    createdAt: Date.now(),
  });
  return connections.length;
}

/**
 * Recent verses shared with you, newest first, from people you're still
 * connected to.
 */
export async function loadSharedWithMe(
  max = 10,
  /** Your current connections, if already loaded. */
  known?: Connection[],
): Promise<SharedVerse[]> {
  const self = me();
  const [snap, connections] = await Promise.all([
    getDocs(
      query(
        sharesCol(),
        where("visibleTo", "array-contains", self.uid),
        orderBy("createdAt", "desc"),
        limit(max * 2),
      ),
    ),
    known ?? loadConnections(),
  ]);
  const current = new Set(connections.map((c) => c.uid));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SharedVerse, "id">) }))
    .filter((s) => current.has(s.authorId))
    .slice(0, max);
}

/** Verses you shared, newest first. */
export async function loadMyShares(): Promise<SharedVerse[]> {
  const self = me();
  const snap = await getDocs(
    query(sharesCol(), where("authorId", "==", self.uid)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SharedVerse, "id">) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteShare(id: string): Promise<void> {
  await deleteDoc(doc(sharesCol(), id));
}

// ── Account deletion ─────────────────────────────────────────────────────────

/**
 * Removes everything of yours from the shared collections: requests sent and
 * received, connections, your shared verses, and you from others' shares.
 * Called by account deletion while you're still signed in.
 */
export async function deleteConnectionData(uid: string, email: string) {
  const lower = email.toLowerCase();
  const [sent, received, connections, mine, theirs] = await Promise.all([
    getDocs(query(requestsCol(), where("fromUid", "==", uid))),
    getDocs(query(requestsCol(), where("toEmail", "==", lower))),
    getDocs(query(connectionsCol(), where("members", "array-contains", uid))),
    getDocs(query(sharesCol(), where("authorId", "==", uid))),
    getDocs(query(sharesCol(), where("visibleTo", "array-contains", uid))),
  ]);
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  for (const d of [...sent.docs, ...received.docs, ...connections.docs, ...mine.docs]) {
    ops.push((b) => b.delete(d.ref));
  }
  for (const d of theirs.docs) {
    if (d.data().authorId === uid) continue;
    const v = (d.data().visibleTo as string[]).filter((u) => u !== uid);
    ops.push((b) => b.update(d.ref, { visibleTo: v }));
  }
  await commitInBatches(ops);
}

/** Runs write operations in batches of up to 500 (Firestore's limit). */
async function commitInBatches(
  ops: ((b: ReturnType<typeof writeBatch>) => void)[],
) {
  for (let i = 0; i < ops.length; i += 500) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 500)) op(batch);
    await batch.commit();
  }
}
