// Run: node --test src/lib/followUtils.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { toMillis, sortByRecent, countNewFollowers } from './followUtils.js';

test('toMillis handles Timestamp-like, Date, number and null', () => {
  assert.equal(toMillis({ toMillis: () => 5 }), 5);
  assert.equal(toMillis(new Date(1000)), 1000);
  assert.equal(toMillis(42), 42);
  assert.equal(toMillis({ seconds: 2, nanoseconds: 5e6 }), 2005);
  assert.ok(Math.abs(toMillis(null) - Date.now()) < 1000);   // pending server timestamp counts as "now"
});
test('sortByRecent is newest first and does not mutate', () => {
  const a = [{ id: 'old', followedAt: 1 }, { id: 'new', followedAt: 9 }];
  assert.deepEqual(sortByRecent(a).map((x) => x.id), ['new', 'old']);
  assert.equal(a[0].id, 'old');
});
test('countNewFollowers: only those after last seen; everything is new if never seen', () => {
  const f = [{ followedAt: 100 }, { followedAt: 200 }, { followedAt: 300 }];
  assert.equal(countNewFollowers(f, 0), 3);
  assert.equal(countNewFollowers(f, 150), 2);
  assert.equal(countNewFollowers(f, 300), 0);
});
