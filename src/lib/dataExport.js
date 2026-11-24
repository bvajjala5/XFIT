// Client-side export helpers. Data goes from Firestore to a file on the user's
// device; nothing is uploaded anywhere else.
export const EXPORT_VERSION = 1;

export function serializeValue(value) {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(serializeValue);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]));
}

export function serializeDocument(snapshot) {
  const data = serializeValue(snapshot?.data?.() || {});
  return {
    ...data,
    id: snapshot?.id ?? null,
    path: snapshot?.ref?.path ?? null,
  };
}

export function buildUserDataExport(userId, collections) {
  return {
    app: 'Uttar Fitness',
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    userId,
    collections,
  };
}

export function downloadJson(filename, data) {
  if (typeof document === 'undefined' || typeof globalThis.URL?.createObjectURL !== 'function') return false;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
  return true;
}
