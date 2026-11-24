import { shareContent } from './shareContent.js';
import { toPublicWorkout } from './publicWorkout.js';

const SHARE_VERSION = 1;

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token) {
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Keep shared links short; names and exercise details drive the player. */
function portableWorkout(workout) {
  const clean = toPublicWorkout(workout);
  if (Array.isArray(clean.exercises)) {
    clean.exercises = clean.exercises.map((exercise) => {
      const { image: _image, animation: _animation, ...rest } = exercise;
      if (typeof rest.notes === 'string' && rest.notes.length > 300) {
        rest.notes = rest.notes.slice(0, 300);
      }
      return rest;
    });
  }
  return clean;
}

/** A self-contained link: the workout travels in the URL, not a public database. */
export function buildWorkoutShareUrl(workout, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://xfit-bpe.pages.dev');
  const payload = toBase64Url(JSON.stringify({ v: SHARE_VERSION, workout: portableWorkout(workout) }));
  return `${base}/community?share=${payload}`;
}

/** Decode an incoming link. Throws for malformed or unsupported payloads. */
export function decodeSharedWorkout(token) {
  const parsed = JSON.parse(fromBase64Url(token));
  if (parsed?.v !== SHARE_VERSION || !parsed.workout?.name) throw new Error('Unsupported workout link');
  return parsed.workout;
}

/** Open the device share sheet with a link anyone can open and add. */
export function shareCustomWorkout(workout) {
  const title = workout?.name || workout?.title || 'Workout';
  const exerciseCount = Array.isArray(workout?.exercises) ? workout.exercises.length : 0;
  const detail = exerciseCount ? ` ${exerciseCount} exercises.` : '';
  return shareContent({
    title: `Share ${title}`,
    text: `Check out "${title}" on Uttar Fitness.${detail}`,
    url: buildWorkoutShareUrl(workout),
  });
}
