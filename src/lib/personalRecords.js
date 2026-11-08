import { db } from '@/lib/firestore';
import { doc, getDoc, runTransaction } from 'firebase/firestore/lite';

export async function savePR(uid, exercise, value, unit, notes = '') {
  const ref = doc(db, 'users', uid, 'personalRecords', 'records');
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) throw new Error('A PR must be a number');

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const records = snap.exists() ? snap.data() : {};
    const existing = records[exercise] || [];
    const newRecord = {
      value: nextValue,
      unit,
      notes,
      date: new Date().toISOString(),
    };

    // Keep top 10 records for this exercise
    transaction.set(ref, {
      ...records,
      [exercise]: [newRecord, ...existing].slice(0, 10),
    });
  });
}

export async function getPRs(uid) {
  const ref = doc(db, 'users', uid, 'personalRecords', 'records');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}
