// Pure helpers for the follower system (no Firebase imports, so they can be unit-tested in Node).

/** Firestore Timestamp | Date | number | null → milliseconds. A not-yet-synced server timestamp (null) counts as "now". */
export function toMillis(ts) {
  if (ts == null) return Date.now();
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  return 0;
}

/** Newest first. */
export function sortByRecent(list) {
  return [...list].sort((a, b) => toMillis(b.followedAt) - toMillis(a.followedAt));
}

/** How many followers arrived after the last time the user looked at the Followers tab. */
export function countNewFollowers(followers, lastSeenMs) {
  if (!lastSeenMs) return followers.length;     // never looked → everything is new
  return followers.filter((f) => toMillis(f.followedAt) > lastSeenMs).length;
}

export const seenKey = (uid) => `xfit_followers_seen_${uid}`;
export const repairKey = (uid) => `xfit_follow_repair_v1_${uid}`;
