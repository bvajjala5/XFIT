import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import MuscleMapModel from '@/components/workout/MuscleMapModel';
import { createMatcher } from '@/lib/exerciseLookup';

// The exercise index (~60 KB) is loaded lazily the first time a workout starts, not with the main bundle.
let matcherPromise = null;
function loadMatcher() {
  if (!matcherPromise) {
    matcherPromise = import('@/data/exerciseIndex.json')
      .then((m) => createMatcher(m.default, import.meta.env.VITE_EXERCISE_IMG_BASE || undefined))
      .catch((err) => { matcherPromise = null; throw err; });
  }
  return matcherPromise;
}

const FRAME_MS = 900;   // time each pose is held before switching
const prettyMuscle = (m) => m.replace(/\b\w/g, (c) => c.toUpperCase());

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * Shows an animated demo (start pose ⇄ end pose) of the current exercise plus the muscles it works.
 * Falls back to the original body-diagram when we have no demo for the exercise or the photos can't load.
 */
export default function ExerciseDemo({ exerciseName = '', nextExerciseName = '' }) {
  const [matcher, setMatcher] = useState(null);
  const [indexFailed, setIndexFailed] = useState(false);  // the exercise list couldn't load
  const [imgFailed, setImgFailed] = useState(false);      // this exercise's photos couldn't load
  const [alt, setAlt] = useState(0);                    // which alternative (e.g. "Push-Ups or Diamond Push-Ups")
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);            // both photos downloaded
  const reduced = usePrefersReducedMotion();
  const timer = useRef(null);

  useEffect(() => { loadMatcher().then(setMatcher).catch(() => setIndexFailed(true)); }, []);

  const matches = useMemo(() => (matcher ? matcher.findAll(exerciseName) : null), [matcher, exerciseName]);
  const current = matches?.[Math.min(alt, (matches?.length || 1) - 1)] || null;

  // New exercise → start from its first alternative and the demo tab.
  const [prevName, setPrevName] = useState(exerciseName);
  if (exerciseName !== prevName) {
    setPrevName(exerciseName);
    setAlt(0);
    setImgFailed(false);
  }

  // Download both photos before animating, so we never flash a half-loaded frame.
  const [prevCurrentId, setPrevCurrentId] = useState(current?.id);
  if (current?.id !== prevCurrentId) {
    setPrevCurrentId(current?.id);
    setReady(false);
    setFrame(0);
  }
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    let loaded = 0;
    const done = () => { loaded += 1; if (loaded === 2 && !cancelled) setReady(true); };
    const fail = () => { if (!cancelled) setImgFailed(true); };
    current.frames.forEach((url) => {
      const img = new Image();
      img.onload = done; img.onerror = fail; img.src = url;
    });
    return () => { cancelled = true; };
  }, [current]);

  // Flip between the two poses.
  useEffect(() => {
    clearInterval(timer.current);
    if (!ready || reduced) return;
    timer.current = setInterval(() => setFrame((f) => 1 - f), FRAME_MS);
    return () => clearInterval(timer.current);
  }, [ready, reduced, current?.id]);

  // Warm the browser cache for the next exercise so its demo appears instantly.
  useEffect(() => {
    if (!matcher || !nextExerciseName) return;
    const next = matcher.find(nextExerciseName);
    next?.frames.forEach((url) => { const img = new Image(); img.src = url; });
  }, [matcher, nextExerciseName]);

  if (!exerciseName) return null;

  // No demo available (or it failed to load) → the original muscle diagram, exactly as before.
  if (indexFailed || imgFailed || (matches && matches.length === 0)) {
    return <MuscleMapModel exerciseName={exerciseName} />;
  }

  // Still loading the index: reserve the space so the layout doesn't jump.
  if (!matches || !current) {
    return <div className="w-full max-w-sm mx-auto aspect-[3/2] rounded-2xl bg-white/5 animate-pulse" aria-hidden="true" />;
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <Tabs.Root defaultValue="demo" className="w-full">
        <Tabs.List className="flex p-1 bg-black/30 rounded-xl mb-4">
          <Tabs.Trigger
            value="demo"
            className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
          >
            Demo
          </Tabs.Trigger>
          <Tabs.Trigger
            value="map"
            className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground"
          >
            Body Map
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="demo" className="outline-none">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-white/5"
            {...(reduced ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': 'Show next pose',
              onClick: () => setFrame((f) => 1 - f),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setFrame((f) => 1 - f)
                }
              },
            } : {})}
          >
            {!ready && <div className="absolute inset-0 animate-pulse bg-white/5" />}
            {current.frames.map((url, i) => (
              <img
                key={url} src={url} alt={`${current.name} - ${i === 0 ? 'start' : 'end'} position`}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out"
                style={{ opacity: ready && frame === i ? 1 : 0 }}
              />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="map" className="outline-none">
          <div className="flex justify-center">
            <MuscleMapModel
              exerciseName={exerciseName}
              muscles={{ primary: current.primary, secondary: current.secondary }}
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {reduced && ready && <p className="text-[10px] text-center text-muted-foreground">Tap the photo to switch between start and end position</p>}

      {matches.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {matches.map((m, i) => (
            <button
              key={m.id} onClick={() => setAlt(i)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${i === alt ? 'border-primary/50 bg-primary/15 text-primary' : 'border-white/10 text-muted-foreground'}`}
            >{m.name}</button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-1.5">
        {current.primary.map((m) => (
          <span key={`p-${m}`} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{prettyMuscle(m)}</span>
        ))}
        {current.secondary.map((m) => (
          <span key={`s-${m}`} className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">{prettyMuscle(m)}</span>
        ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground/60">
        Showing: {current.name} · Photos:{' '}
        <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer" className="underline">Free Exercise DB</a>
      </p>
    </div>
  );
}
