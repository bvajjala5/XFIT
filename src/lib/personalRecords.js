import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function savePR(uid, exercise, value, unit, notes = '') {
  const ref = doc(db, 'users', uid, 'personalRecords', 'records');
  const snap = await getDoc(ref);
  const records = snap.exists() ? snap.data() : {};

  const existing = records[exercise] || [];
  const newRecord = {
    value: Number(value),
    unit,
    notes,
    date: new Date().toISOString()
  };

  // Keep top 10 records for this exercise
  const updated = [newRecord, ...existing].slice(0, 10);
  const allRecords = { ...records, [exercise]: updated };

  await setDoc(ref, allRecords);
}

export async function getPRs(uid) {
  const ref = doc(db, 'users', uid, 'personalRecords', 'records');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}
