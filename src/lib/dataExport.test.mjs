import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPORT_VERSION,
  buildUserDataExport,
  serializeDocument,
  serializeValue,
} from './dataExport.js';

test('serializeValue turns Firestore timestamps into ISO strings', () => {
  const timestamp = { toDate: () => new Date('2026-11-24T10:00:00.000Z') };
  assert.equal(serializeValue(timestamp), '2026-11-24T10:00:00.000Z');
  assert.deepEqual(serializeValue({ at: timestamp, list: [timestamp, 2] }), {
    at: '2026-11-24T10:00:00.000Z',
    list: ['2026-11-24T10:00:00.000Z', 2],
  });
});

test('serializeDocument keeps the snapshot id and path', () => {
  const snapshot = {
    id: 'log-1',
    ref: { path: 'users/u1/workoutLogs/log-1' },
    data: () => ({ calories: 120, createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z') } }),
  };
  assert.deepEqual(serializeDocument(snapshot), {
    calories: 120,
    createdAt: '2026-01-01T00:00:00.000Z',
    id: 'log-1',
    path: 'users/u1/workoutLogs/log-1',
  });
});

test('buildUserDataExport includes a stable version and user id', () => {
  const result = buildUserDataExport('user-1', { workoutLogs: [] });
  assert.equal(result.app, 'Uttar Fitness');
  assert.equal(result.exportVersion, EXPORT_VERSION);
  assert.equal(result.userId, 'user-1');
  assert.deepEqual(result.collections, { workoutLogs: [] });
});
