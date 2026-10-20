import { collection, doc, getDocs, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { repairKey, seenKey } from './followUtils';

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode etc. */ } };

export function getLastSeenFollowers(uid) {
  const v = Number(safeGet(seenKey(uid)));
  return Number.isFinite(v) && v > 0 ? v : 0;
}
export function markFollowersSeen(uid) { safeSet(seenKey(uid), String(Date.now())); }

/**
 * Follow someone. Writes BOTH sides in one atomic batch: my "following" list and their "followers" list.
 * If either write is refused, neither happens and the error is thrown — nothing fails silently.
 */
export async function followUser(me, target) {
  if (!me?.uid || !target?.uid) throw new Error('Missing user');
  if (me.uid === target.uid) throw new Error("You can't follow yourself");
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', me.uid, 'following', target.uid), {
    uid: target.uid, displayName: target.displayName || 'XFit User', followedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', target.uid, 'followers', me.uid), {
    uid: me.uid, displayName: me.displayName || 'XFit User', followedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function unfollowUser(me, targetUid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', me.uid, 'following', targetUid));
  batch.delete(doc(db, 'users', targetUid, 'followers', me.uid));
  await batch.commit();
}

export async function fetchFollowers(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'followers'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function fetchFollowing(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'following'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * One-time (per browser) repair for follows made before this fix: if I follow someone but their
 * "followers" list never got my record, write it now. Safe to run repeatedly; failures are non-fatal.
 */
export async function repairFollowerLinks(me, followingList) {
  if (!me?.uid || safeGet(repairKey(me.uid))) return { repaired: 0 };
  const results = await Promise.allSettled(
    followingList.map((f) =>
      setDoc(doc(db, 'users', f.id, 'followers', me.uid), {
        uid: me.uid, displayName: me.displayName || 'XFit User', followedAt: f.followedAt ?? serverTimestamp(),
      })
    )
  );
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length === 0) safeSet(repairKey(me.uid), '1');        // try again next visit if anything was refused
  else console.warn('[follows] repair: some writes were refused', failed[0].reason?.code || failed[0].reason);
  return { repaired: results.length - failed.length, failed: failed.length };
}
