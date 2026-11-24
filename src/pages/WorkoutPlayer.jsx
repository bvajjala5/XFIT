import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore/lite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, X, ArrowRight, Volume2, VolumeX, Star, Share2, Loader2, ChevronRight, AlertTriangle, ScanFace, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import NotFound from '@/components/shared/NotFound';
import useFocusTrap from '@/hooks/useFocusTrap';
import WorkoutDemo from '@/components/workout/WorkoutDemo';
import FormCheck from '@/components/workout/FormCheck';
import { toast } from 'sonner';
import { normalizeExercise } from '@/lib/exerciseTiming';
import { expectedWorkoutSeconds, isWorkoutTooFast, MIN_WORKOUT_DURATION_RATIO } from '@/lib/workoutValidation';
import { savePR } from '@/lib/personalRecords';
import { findBuiltinWorkout } from '@/lib/workoutLibrary';
import { cacheWorkout, findCachedWorkout } from '@/lib/workoutCache';
import { saveWorkoutLog } from '@/lib/workoutLogQueue';
import HybridTracker from '@/components/workout/HybridTracker';
import { movementFromExercise } from '@/lib/poseCounter';
import {
  MODE_REPS, MODE_TIME, createSession, restoreSession, persistSession,
  recordSet, nextPosition, setExerciseMode, adjust, sessionProgress, flattenSets,
  detectMode, signatureFor, firstIncomplete, setRestSeconds, completedExerciseCount,
} from '@/lib/workoutTracking';

// ── Voice: pick the most natural English voice the device has, and speak with a calm coaching pace ──
const GOOD_VOICES = [
  /Microsoft (Aria|Jenny|Guy|Davis|Sonia|Ryan|Libby).*Online/i, // Edge/Windows neural voices
  /Google US English/i, /Google UK English (Female|Male)/i,
  /Ava|Zoe|Allison|Evan|Nicky/i,                                  // Apple premium voices
  /Samantha|Daniel|Karen|Moira|Tessa|Serena/i,
];
function voiceScore(v) {
  if (!/^en[-_]/i.test(v.lang)) return -1;
  let score = /^en[-_]US/i.test(v.lang) ? 20 : /^en[-_](GB|AU|IE|ZA)/i.test(v.lang) ? 10 : 5;
  if (/premium|enhanced|natural|neural|online/i.test(v.name)) score += 60;
  const i = GOOD_VOICES.findIndex(r => r.test(v.name));
  if (i >= 0) score += 40 - i * 4;
  if (/compact|novelty|whisper|bad|bells|boing|organ|zarvox|trinoids|cellos|albert|fred|junior|ralph|kathy|bubbles|jester|hysterical/i.test(v.name)) score -= 100;
  if (v.localService === false) score += 5;
  return score;
}
function englishVoices() {
  const all = window.speechSynthesis?.getVoices?.() || [];
  return all.map(v => ({ v, s: voiceScore(v) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.v);
}
function pickVoice() {
  const list = englishVoices();
  const saved = localStorage.getItem('xfit_voice_name');
  return list.find(v => v.name === saved) || list[0] || null;
}

function playBeep(freq = 440, duration = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { console.warn('Audio failed', e); }
}

function cleanForSpeech(text) {
  return text
    .replace(/\bSpO2\b/gi, 'blood oxygen').replace(/(\d+)\s*x\s*(\d+)/gi, '$1 by $2')
    .replace(/\blbs\b/gi, 'pounds').replace(/\breps\b/gi, 'reps').replace(/\bmin\b/gi, 'minutes').replace(/\bsec\b/gi, 'seconds')
    .replace(/\bHIIT\b/g, 'hit').replace(/\bAMRAP\b/g, 'as many reps as possible')
    .replace(/[—–]/g, ',').replace(/\s+/g, ' ').trim();
}

let voicesReady = null;
function whenVoicesReady() {
  if (!voicesReady) voicesReady = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (synth.getVoices().length) return resolve();
    const done = () => { synth.removeEventListener?.('voiceschanged', done); resolve(); };
    synth.addEventListener?.('voiceschanged', done);
    setTimeout(resolve, 1500);
  });
  return voicesReady;
}

function speakText(text, enabled = true, opts = {}) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  whenVoicesReady().then(() => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = opts.rate ?? 0.97; u.pitch = opts.pitch ?? 1.0; u.volume = 1.0;
    synth.speak(u);
  });
}

// iOS/Safari only allow speech after a tap: unlock it on the first touch anywhere on the page.
function unlockSpeech() {
  try { window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })); } catch {}
}

const PRAISE = ['Nice work.', 'Strong.', 'Good job.', 'That’s it.', 'Keep it up.', 'Well done.'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const exerciseDurationSeconds = (ex) => ex?.duration || (ex?.sets ? ex.sets * (ex.reps || 10) * 3 : 30);

const motivations = ["You're crushing it.","Push through the burn.","Almost there, don't give up.","You're stronger than yesterday.","Feel the power.","Every rep counts.","Let's go."];

async function generateShareCard({ workoutTitle, duration, calories, rating, difficulty }) {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#07071a'); bg.addColorStop(1, '#120824');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(99,102,241,0.07)'; ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
  for (let y = 0; y < size; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }

  // Glow
  const glow = ctx.createRadialGradient(200, 200, 0, 200, 200, 500);
  glow.addColorStop(0, 'rgba(99,102,241,0.18)'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);

  // Logo bar
  const accentGrad = ctx.createLinearGradient(80, 0, 500, 0);
  accentGrad.addColorStop(0, '#6366f1'); accentGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = accentGrad;
  ctx.beginPath(); ctx.roundRect(80, 80, 300, 56, 16); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('Uttar Fitness', 105, 118);

  // Accent line
  ctx.fillStyle = accentGrad;
  ctx.fillRect(80, 176, 460, 5);

  // Workout title
  ctx.fillStyle = '#f0f0ff'; ctx.font = 'bold 72px system-ui, sans-serif';
  const title = workoutTitle.length > 18 ? workoutTitle.slice(0, 17) + '…' : workoutTitle;
  ctx.fillText(title, 80, 290);

  // Stats
  const drawStat = (label, val, y) => {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.roundRect(80, y, 420, 86, 20); ctx.fill();
    ctx.font = 'bold 40px system-ui, sans-serif'; ctx.fillStyle = '#c7d2fe'; ctx.fillText(val, 110, y + 55);
    ctx.font = '28px system-ui, sans-serif'; ctx.fillStyle = '#6366f1'; ctx.fillText(label, 110, y + 80);
  };
  drawStat('Duration', duration, 330);
  drawStat('Calories burned', `${calories} cal`, 440);

  // Stars
  if (rating > 0) {
    ctx.font = '52px system-ui, sans-serif';
    ctx.fillText('★'.repeat(rating) + '☆'.repeat(5 - rating), 80, 600);
  }

  // Difficulty badge
  if (difficulty) {
    const diffColor = difficulty === 'Hard' ? '#f87171' : difficulty === 'Medium' ? '#fbbf24' : '#4ade80';
    ctx.fillStyle = diffColor + '30';
    ctx.beginPath(); ctx.roundRect(80, 625, 200, 52, 14); ctx.fill();
    ctx.fillStyle = diffColor; ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(difficulty, 110, 660);
  }

  // Date
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '32px system-ui, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }), 80, 740);

  // Watermark
  ctx.fillStyle = 'rgba(99,102,241,0.5)'; ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('xfit-bpe.pages.dev', 80, size - 60);

  return canvas.toDataURL('image/png');
}

export default function WorkoutPlayer({ isCustom: isCustomRoute = false }) {
  const { id } = useParams();
  // /player/custom/:id passes isCustom as a prop (the id has no 'custom/' prefix there).
  const isCustom = isCustomRoute || id?.startsWith('custom/');
  const workoutId = isCustom ? id.replace('custom/','') : id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const customDurationsParam = searchParams.get('durations');
  const customDurations = useMemo(() => {
    if (!customDurationsParam) return null;
    try {
      const value = JSON.parse(decodeURIComponent(customDurationsParam));
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }, [customDurationsParam]);

  // Hybrid tracking state. `session` holds one record per completed set; the
  // remaining values describe the set currently on screen.
  const [session, setSession] = useState(null);
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState('work'); // work | rest
  const [restLeft, setRestLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [actual, setActual] = useState(0);
  const [weight, setWeight] = useState('');
  const [poseEnabled, setPoseEnabled] = useState(false);
  const [tempoEnabled, setTempoEnabled] = useState(false);
  const cameraRepsRef = useRef(0);
  const lastCueRef = useRef(-1);
  const [isPaused, setIsPaused] = useState(false);
  // The animated demo / body map is opt-out: hiding it gives a quieter screen
  // and skips the lazy photo downloads entirely. Remember the choice.
  const [showMedia, setShowMedia] = useState(() => {
    try { return localStorage.getItem('xfit_show_exercise_media') !== 'false'; }
    catch { return true; }
  });
  const toggleMedia = () => setShowMedia((visible) => {
    try { localStorage.setItem('xfit_show_exercise_media', String(!visible)); }
    catch { /* private mode: the choice just won't persist */ }
    return !visible;
  });
  const [isComplete, setIsComplete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const formWasPausedRef = useRef(false);
  const [totalTime, setTotalTime] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('xfit_voice_enabled') !== 'false');
  const announcedRef = useRef({ exIndex:-1, countdown:false });
  const [voiceName, setVoiceName] = useState(() => pickVoice()?.name || '');



  const [showLogModal, setShowLogModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [sharing, setSharing] = useState(false);

  // PR State
  const [showPRModal, setShowPRModal] = useState(false);
  const [prExercise, setPrExercise] = useState(null);
  const [prValue, setPrValue] = useState('');
  const [prUnit, setPrUnit] = useState('lbs');
  const [prNotes, setPrNotes] = useState('');
  const [savingPR, setSavingPR] = useState(false);

  // Refs keep the one-second interval stable while set values change.
  const timerRef = useRef(null);
  const sessionRef = useRef(null);
  const exIndexRef = useRef(0);
  const setIndexRef = useRef(0);
  const phaseRef = useRef('work');
  const elapsedRef = useRef(0);
  const restLeftRef = useRef(0);
  const actualRef = useRef(0);
  const weightRef = useRef('');
  const logModalRef = useRef(null);
  const prModalRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  };


  useEffect(() => {
    const on = () => { unlockSpeech(); window.removeEventListener('pointerdown', on); };
    window.addEventListener('pointerdown', on);
    return () => { window.removeEventListener('pointerdown', on); window.speechSynthesis?.cancel(); };
  }, []);

  // Tap to try the next available voice (saved for next time)
  useEffect(() => { whenVoicesReady().then(() => setVoiceName(pickVoice()?.name || '')); }, []);
  const cycleVoice = () => {
    const list = englishVoices().slice(0, 6);
    if (!list.length) return;
    const i = list.findIndex(v => v.name === voiceName);
    const next = list[(i + 1) % list.length];
    localStorage.setItem('xfit_voice_name', next.name);
    setVoiceName(next.name);
    speakText('Let’s get after it.', true);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem('xfit_voice_enabled', String(next));
  };

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ['workout-player', workoutId, isCustom],
    queryFn: async () => {
      try {
        if (isCustom && user) {
          const snap = await getDoc(doc(db, 'users', user.uid, 'customWorkouts', workoutId));
          if (snap.exists()) {
            const custom = { id: snap.id, ...snap.data(), isCustom: true };
            cacheWorkout(custom, user.uid);
            return custom;
          }
        }
        // Check if it's a custom workout but the route was /player/:id instead of /player/custom/:id
        if (user) {
          const customSnap = await getDoc(doc(db, 'users', user.uid, 'customWorkouts', workoutId));
          if (customSnap.exists()) {
            const custom = { id: customSnap.id, ...customSnap.data(), isCustom: true };
            cacheWorkout(custom, user.uid);
            return custom;
          }
        }
        const snap = await getDoc(doc(db, 'workouts', workoutId));
        if (snap.exists()) {
          const remote = { id: snap.id, ...snap.data(), isCustom: false };
          cacheWorkout(remote, user?.uid);
          return remote;
        }
        return findBuiltinWorkout(workoutId) || findCachedWorkout(workoutId, user?.uid);
      } catch (error) {
        console.warn('Workout player is offline; using the cached copy.', error);
        return findCachedWorkout(workoutId, user?.uid) || findBuiltinWorkout(workoutId);
      }
    },
    enabled: !!workoutId
  });

  const exercises = useMemo(() => {
    if (!workout?.exercises) return [];
    return workout.exercises.map((raw,i) => {
      // Decide the mode from the source exercise before normalizeExercise adds
      // default sets/duration. Otherwise timed intervals with reps+duration
      // look like single-set strength work and stop auto-advancing.
      const mode = detectMode(raw);
      const ex = normalizeExercise(raw);   // handles builder-style fields (duration_seconds, "8-12" reps)
      if (customDurations && customDurations[i] !== undefined) return {...ex, duration:customDurations[i], mode};
      return {...ex, mode};
    });
  }, [workout, customDurations]);

  // How long this workout should take. The durations the user picked on the
  // detail sliders (or the durations stored with the workout) are the source of
  // truth; the plan's rounded duration is only a fallback for empty workouts.
  const expectedSeconds = useMemo(() => {
    const selectedSeconds = exercises.reduce((s, e) => s + exerciseDurationSeconds(e), 0);
    return expectedWorkoutSeconds(workout, selectedSeconds);
  }, [workout, exercises]);

  const caloriesFor = (seconds) => Math.round(
    (workout?.calories_estimate || 200) * Math.min(seconds / (expectedSeconds || 1800), 1.2)
  );

  // Build (or restore) the session as soon as the workout's exercise list
  // arrives. Adjusting state during render avoids a frame with no active set;
  // this is the same pattern the old timer bootstrap used.
  const [sessionKey, setSessionKey] = useState(null);
  const nextSessionKey = exercises.length ? signatureFor(exercises) : null;
  if (nextSessionKey && nextSessionKey !== sessionKey) {
    setSessionKey(nextSessionKey);
    const saved = restoreSession(exercises);
    const resume = saved ? firstIncomplete(saved) : null;
    const next = resume && !resume.done ? saved : createSession(exercises);
    const start = resume && !resume.done ? resume : { exIndex: 0, setIndex: 0 };
    persistSession(next);
    setSession(next);
    setExIndex(start.exIndex);
    setSetIndex(start.setIndex);
    setPhase('work');
    setElapsed(0);
    setRestLeft(0);
    setActual(0);
    setWeight(next.exercises[start.exIndex]?.weight || '');
    setPoseEnabled(false);
  }

  // Ref-only resets for a freshly loaded workout (safe outside render).
  useEffect(() => {
    if (!sessionKey) return;
    cameraRepsRef.current = 0;
    lastCueRef.current = -1;
  }, [sessionKey]);

  // Announce the exercise whenever it changes.
  useEffect(() => {
    if (!session?.exercises?.length || isComplete) return;
    const ex = session.exercises[exIndex];
    if (!ex) return;

    announcedRef.current.countdown = false;
    if (announcedRef.current.exIndex !== exIndex) {
      announcedRef.current.exIndex = exIndex;
      const isLast = exIndex === session.exercises.length - 1;
      const amount = ex.mode === MODE_REPS ? `${ex.target} reps` : `${ex.target} seconds`;
      if (exIndex === 0) speakText(`Let’s go. First up, ${ex.name}. ${amount}.`, voiceEnabled);
      else if (isLast) speakText(`${pick(PRAISE)} Last one. ${ex.name}. ${amount}. Give it everything.`, voiceEnabled);
      else speakText(`${pick(PRAISE)} Next, ${ex.name}. ${amount}.`, voiceEnabled);
    }
  }, [exIndex, isComplete, session, voiceEnabled]);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { exIndexRef.current = exIndex; }, [exIndex]);
  useEffect(() => { setIndexRef.current = setIndex; }, [setIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { restLeftRef.current = restLeft; }, [restLeft]);
  useEffect(() => { actualRef.current = actual; }, [actual]);
  useEffect(() => { weightRef.current = weight; }, [weight]);

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Move to the next set (or exercise) after the current set has been recorded.
  const goNext = useCallback((nextSession, fromEx, fromSet) => {
    const pos = nextPosition(nextSession, fromEx, fromSet);
    persistSession(nextSession);
    if (pos.done) {
      speakText('Workout complete. You crushed it today.', voiceEnabled);
      setIsComplete(true);
      setPoseEnabled(false);
      return;
    }
    if (pos.exIndex !== fromEx) {
      triggerFlash();
      setMotivation(motivations[Math.floor(Math.random() * motivations.length)]);
      setTimeout(() => setMotivation(''), 3000);
    }
    setExIndex(pos.exIndex);
    setSetIndex(pos.setIndex);
    setPhase('work');
    phaseRef.current = 'work';
    setElapsed(0); elapsedRef.current = 0;
    setRestLeft(0); restLeftRef.current = 0;
    setActual(0); actualRef.current = 0;
    setWeight(nextSession.exercises[pos.exIndex]?.weight || '');
    weightRef.current = nextSession.exercises[pos.exIndex]?.weight || '';
    cameraRepsRef.current = 0;
    lastCueRef.current = -1;
    setPoseEnabled(false);
    const nextName = nextSession.exercises[pos.exIndex]?.name;
    if (pos.exIndex !== fromEx) speakText(`${pick(PRAISE)} Next, ${nextName}.`, voiceEnabled);
    else speakText(`Set ${pos.setIndex + 1}`, voiceEnabled);
  }, [voiceEnabled]);

  const finishSet = useCallback((source = 'manual') => {
    const current = sessionRef.current;
    const ex = current?.exercises[exIndexRef.current];
    if (!ex || phaseRef.current === 'rest') return;
    playBeep(440, 0.2);
    const finalSource = source === 'camera' || cameraRepsRef.current > 0 ? 'camera' : 'manual';
    const record = ex.mode === MODE_REPS
      ? { actual: actualRef.current, seconds: 0, weight: weightRef.current, source: finalSource }
      : { actual: 0, seconds: Math.min(elapsedRef.current, ex.target), weight: weightRef.current, source: finalSource };
    const next = recordSet(current, exIndexRef.current, setIndexRef.current, record);
    setSession(next);
    sessionRef.current = next;
    // Persist before resting too: a reload mid-rest must not lose this set.
    persistSession(next);
    const pos = nextPosition(next, exIndexRef.current, setIndexRef.current);
    if (!pos.done && pos.exIndex === exIndexRef.current) {
      const rest = ex.restSeconds || 30;
      setPhase('rest'); phaseRef.current = 'rest';
      setRestLeft(rest); restLeftRef.current = rest;
      speakText(`Rest for ${rest} seconds`, voiceEnabled);
    } else {
      goNext(next, exIndexRef.current, setIndexRef.current);
    }
  }, [goNext, voiceEnabled]);

  const skipRest = useCallback(() => {
    if (phaseRef.current !== 'rest' || !sessionRef.current) return;
    playBeep(880, 0.2);
    goNext(sessionRef.current, exIndexRef.current, setIndexRef.current);
  }, [goNext]);

  useEffect(() => {
    if (isPaused || isComplete || !session) return undefined;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setTotalTime(t => t + 1);

      if (phaseRef.current === 'rest') {
        const next = restLeftRef.current - 1;
        restLeftRef.current = next;
        setRestLeft(next);
        if (next <= 0) {
          playBeep(880, 0.2);
          skipRest();
        }
        return;
      }

      const ex = sessionRef.current?.exercises[exIndexRef.current];
      if (!ex || ex.mode !== MODE_TIME) return; // rep sets advance manually

      const next = elapsedRef.current + 1;
      elapsedRef.current = next;
      setElapsed(next);
      if (ex.target - next === 4 && !announcedRef.current.countdown) {
        announcedRef.current.countdown = true;
        speakText('3, 2, 1', voiceEnabled, { rate: 1.0 });
      }
      if (tempoEnabled && ex.intervalSeconds > 0 && next % ex.intervalSeconds === 0) {
        playBeep(660, 0.08);
        navigator.vibrate?.(25);
      }
      if (next >= ex.target) {
        triggerFlash();
        finishSet('manual');
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, isComplete, session, tempoEnabled, voiceEnabled, finishSet, skipRest]);

  const setPrimaryValue = (value) => {
    const ex = session?.exercises[exIndex];
    if (!ex) return;
    if (ex.mode === MODE_REPS) {
      const next = adjust(value, 0, 0, 999);
      actualRef.current = next;
      setActual(next);
    } else {
      const next = adjust(value, 0, 0, ex.target);
      elapsedRef.current = next;
      setElapsed(next);
    }
  };
  const handleAdjust = (delta) => {
    const ex = session?.exercises[exIndex];
    if (!ex) return;
    setPrimaryValue((ex.mode === MODE_REPS ? actualRef.current : elapsedRef.current) + delta);
  };
  const handleWeight = (value) => { weightRef.current = value; setWeight(value); };
  const handleModeChange = (mode) => {
    if (!session) return;
    const next = setExerciseMode(session, exIndex, mode);
    setSession(next);
    sessionRef.current = next;
    persistSession(next);
    setElapsed(0); elapsedRef.current = 0;
    setActual(0); actualRef.current = 0;
    cameraRepsRef.current = 0;
    setPoseEnabled(false);
    announcedRef.current.countdown = false;
  };
  const handleCameraReps = (delta) => {
    const ex = sessionRef.current?.exercises[exIndexRef.current];
    if (!ex || ex.mode !== MODE_REPS || phaseRef.current !== 'work' || isPaused) return;
    cameraRepsRef.current += delta;
    setPrimaryValue(actualRef.current + delta);
    playBeep(720, 0.06);
    navigator.vibrate?.(20);
  };

  const applyRestSeconds = (seconds) => {
    const value = adjust(seconds, 0, 0, 600);
    restLeftRef.current = value;
    setRestLeft(value);
    const updated = setRestSeconds(sessionRef.current, exIndexRef.current, value);
    sessionRef.current = updated;
    setSession(updated);
    persistSession(updated);
  };
  const handleRestAdjust = (delta) => applyRestSeconds(restLeftRef.current + delta);
  const handleRestInput = (value) => applyRestSeconds(value);

  const skipExercise = useCallback(() => {
    if (!sessionRef.current) return;
    if (exIndexRef.current < sessionRef.current.exercises.length - 1) {
      setExIndex(exIndexRef.current + 1);
      setSetIndex(0);
      setPhase('work'); phaseRef.current = 'work';
      setElapsed(0); elapsedRef.current = 0;
      setRestLeft(0); restLeftRef.current = 0;
      setActual(0); actualRef.current = 0;
      setPoseEnabled(false);
      cameraRepsRef.current = 0;
    } else {
      setIsComplete(true);
      setPoseEnabled(false);
    }
  }, []);

  // Re-entering a workout resumes its saved session. This is the explicit way
  // back to set one: clear the saved progress and rebuild every timer/ref so a
  // restarted run cannot inherit a stale rest countdown or completed set.
  const restartWorkout = useCallback(() => {
    if (!exercises.length) return;
    const fresh = createSession(exercises);
    const firstWeight = fresh.exercises[0]?.weight || '';
    persistSession(fresh);
    sessionRef.current = fresh;
    setSession(fresh);
    setExIndex(0); exIndexRef.current = 0;
    setSetIndex(0); setIndexRef.current = 0;
    setPhase('work'); phaseRef.current = 'work';
    setElapsed(0); elapsedRef.current = 0;
    setRestLeft(0); restLeftRef.current = 0;
    setActual(0); actualRef.current = 0;
    setWeight(firstWeight); weightRef.current = firstWeight;
    setTotalTime(0);
    setIsPaused(false);
    setIsComplete(false);
    setMotivation('');
    setPoseEnabled(false);
    cameraRepsRef.current = 0;
    lastCueRef.current = -1;
    announcedRef.current = { exIndex: -1, countdown: false };
    toast.success('Workout restarted from the first set.');
  }, [exercises]);

  const handleLogWorkout = async () => {
    if (!user) { navigate('/home'); return; }
    if (isWorkoutTooFast(totalTime, expectedSeconds)) {
      toast.error(`This workout was completed too quickly to count. Finish at least ${formatTime(minimumSeconds)} of the ${Math.round(expectedSeconds / 60)}-minute session before logging it.`);
      return;
    }
    try {
      const { queued } = await saveWorkoutLog(user.uid, {
        workout_id: workoutId,
        workout_title: workout?.title||workout?.name||'',
        workout_type: workout?.type||'',
        workout_category: workout?.category||'',
        completedAt: new Date().toISOString(),
        duration_seconds: totalTime,
        calories_burned: caloriesFor(totalTime),
        exercises_completed: completedExerciseCount(session),
        sets: flattenSets(session),
        rating: rating || null,
        difficulty: logDifficulty || null,
        notes: workoutNotes.trim() || null,
      });
      if (queued) toast.success('Saved on this device — it will sync when you’re back online.');
      else toast.success('Workout logged');
      ['workout-logs', 'workout-logs-stats', 'workout-logs-profile'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key, user.uid] });
      });
    } catch(e) {
      console.error('handleLogWorkout error:', e);
      toast.error('Could not save this workout. Please try again.');
      return;
    }
    persistSession(null);
    navigate('/home');
  };

  const handleSavePR = async () => {
    if (!prExercise || !prValue) { toast.error('Please enter a value'); return; }
    setSavingPR(true);
    try {
      await savePR(user.uid, prExercise, prValue, prUnit, prNotes);
      toast.success(`New PR for ${prExercise}!`);
      setShowPRModal(false);
      setPrExercise(null);
      setPrValue('');
      setPrNotes('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save PR');
    } finally {
      setSavingPR(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const calories = caloriesFor(totalTime);
      const dataUrl = await generateShareCard({
        workoutTitle: workout?.title || workout?.name || 'Workout',
        duration: formatTime(totalTime),
        calories,
        rating,
        difficulty: logDifficulty,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'uttar-workout.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Uttar Fitness Workout Complete!', text: `Just finished a workout on Uttar Fitness.` });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = 'uttar-workout.png'; a.click();
        toast.success('Image saved!');
      }
    } catch(e) {
      if (e?.name !== 'AbortError') toast.error('Could not share');
    } finally {
      setSharing(false);
    }
  };

  const closeLogModal = () => setShowLogModal(false);
  const closePRModal = () => setShowPRModal(false);
  useFocusTrap(logModalRef, isComplete && showLogModal, closeLogModal);
  useFocusTrap(prModalRef, isComplete && showPRModal, closePRModal);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (error || !workout) return <NotFound
    title="Workout not found"
    message="This workout doesn’t exist, was removed, or you don’t have access to it."
    actionTo="/workouts"
    actionLabel="Browse workouts"
  />;

  // Checking form pauses the session so the timer resumes exactly where it
  // stopped when the camera sheet closes.
  const openFormCheck = () => {
    formWasPausedRef.current = isPaused;
    setIsPaused(true);
    // Form Check needs the camera too; release the rep-counter stream first so
    // phones with a single camera don't get two competing getUserMedia calls.
    setPoseEnabled(false);
    setFormOpen(true);
  };
  const closeFormCheck = () => {
    setFormOpen(false);
    if (!formWasPausedRef.current) setIsPaused(false);
  };

  const currentExercise = exercises[exIndex] || exercises[0] || {};
  const exState = session?.exercises?.[exIndex];
  const movement = movementFromExercise(exState?.name || currentExercise?.name || '');
  const tooFast = isWorkoutTooFast(totalTime, expectedSeconds);
  const minimumSeconds = Math.round(expectedSeconds * MIN_WORKOUT_DURATION_RATIO);
  const overallProgress = sessionProgress(session).percent;
  const formatTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const calories = caloriesFor(totalTime);


  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div><h1 className="text-3xl font-bold">Workout complete</h1></div>
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="text-center"><div className="text-xl font-bold">{formatTime(totalTime)}</div><div className="text-[10px] text-muted-foreground">Duration</div></GlassCard>
            <GlassCard className="text-center"><div className="text-xl font-bold">{calories}</div><div className="text-[10px] text-muted-foreground">Calories</div></GlassCard>
            <GlassCard className="text-center"><div className="text-xl font-bold">{exercises.length}</div><div className="text-[10px] text-muted-foreground">Exercises</div></GlassCard>
          </div>
          {tooFast && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-500">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Workout too short to count
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                You finished in {formatTime(totalTime)}, but this session is set for about {Math.round(expectedSeconds / 60)} min.
                Complete at least {formatTime(minimumSeconds)} to log it.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button className="flex-1 h-14 rounded-2xl text-base font-bold disabled:opacity-50" onClick={() => setShowLogModal(true)} disabled={tooFast}>
              {tooFast ? 'Too short to log' : <>Log Workout <ArrowRight className="w-5 h-5 ml-2" /></>}
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl text-base font-bold" onClick={() => setShowPRModal(true)}>
              <Trophy className="w-5 h-5 mr-2" /> New PR
            </Button>
            <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl shrink-0" onClick={handleShare} disabled={sharing}>
              {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => { persistSession(null); navigate('/home') }}>Skip</Button>
        </motion.div>

        {/* ── LOG MODAL ── */}
        <AnimatePresence>
          {showLogModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={closeLogModal}>
              <motion.div ref={logModalRef} role="dialog" aria-modal="true" aria-labelledby="log-workout-title"
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-sm bg-card border border-border/50 rounded-3xl p-6 shadow-2xl space-y-6 focus:outline-none"
                tabIndex={-1}
                onClick={event => event.stopPropagation()}>
                <div className="text-center">
                  <h2 id="log-workout-title" className="text-xl font-black">How was it?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Rate your workout before logging</p>
                </div>

                {/* Star rating */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Rating</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                        <Star className={`w-9 h-9 transition-colors ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Difficulty</p>
                  <div className="flex gap-2">
                    {['Easy','Medium','Hard'].map(d => (
                      <button key={d} onClick={() => setLogDifficulty(d)}
                        className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all border ${
                          logDifficulty === d
                            ? d === 'Easy' ? 'bg-green-500/20 text-green-400 border-green-500/40'
                              : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                              : 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Notes (optional)</p>
                  <textarea
                    value={workoutNotes}
                    onChange={e => setWorkoutNotes(e.target.value)}
                    placeholder="How did it feel? Any PRs?"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-secondary/40 border border-border/50 rounded-2xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowLogModal(false)}
                    className="flex-1 h-11 rounded-2xl bg-secondary/50 text-sm font-semibold hover:bg-secondary transition-colors">
                    Back
                  </button>
                  <button onClick={handleLogWorkout}
                    className="flex-1 h-11 rounded-2xl primary-gradient text-white text-sm font-bold active:scale-[0.98] transition-transform">
                    Save and log
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PR MODAL ── */}
        <AnimatePresence>
          {showPRModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={closePRModal}>
              <motion.div ref={prModalRef} role="dialog" aria-modal="true" aria-labelledby="pr-workout-title"
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-sm bg-card border border-border/50 rounded-3xl p-6 shadow-2xl space-y-6 focus:outline-none"
                tabIndex={-1}
                onClick={event => event.stopPropagation()}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h2 id="pr-workout-title" className="text-xl font-black">New Personal Record!</h2>
                  <p className="text-sm text-muted-foreground mt-1">Celebrate your growth</p>
                </div>

                {!prExercise ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-none">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-2">Select Exercise</p>
                    {exercises.map((ex, i) => (
                      <button key={i} onClick={() => setPrExercise(ex.name)}
                        className="w-full p-3 text-left bg-secondary/40 hover:bg-primary/20 rounded-xl transition-colors flex items-center justify-between group">
                        <span className="text-sm font-medium">{ex.name}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary">{prExercise}</p>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Value" value={prValue}
                        onChange={e => setPrValue(e.target.value)}
                        className="flex-1 bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                      <select value={prUnit} onChange={e => setPrUnit(e.target.value)}
                        className="bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none">
                        <option>lbs</option><option>kg</option><option>reps</option><option>sec</option><option>min</option>
                      </select>
                    </div>
                    <input placeholder="Notes (optional)" value={prNotes}
                      onChange={e => setPrNotes(e.target.value)}
                      className="w-full bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                    <div className="flex gap-2">
                      <button onClick={() => setPrExercise(null)}
                        className="flex-1 h-11 rounded-2xl bg-secondary/50 text-sm font-semibold hover:bg-secondary transition-colors">
                        Back
                      </button>
                      <button onClick={handleSavePR} disabled={savingPR}
                        className="flex-1 h-11 rounded-2xl primary-gradient text-white text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50">
                        {savingPR ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Record'}
                      </button>
                    </div>
                  </div>
                )}
                <Button variant="ghost" className="w-full" onClick={() => { setShowPRModal(false); setPrExercise(null); }}>Cancel</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── ACTIVE WORKOUT ───────────────────────────────────────────────────────
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary pointer-events-none" />
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <button onClick={() => navigate(-1)} className="glass rounded-full p-2" aria-label="Back"><X className="w-5 h-5" /></button>
        <div className="min-w-0 text-center">
          <div className="text-sm font-medium text-muted-foreground">{exIndex + 1} / {exercises.length}</div>
          {exState && <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Set {setIndex + 1} of {exState.setCount}</div>}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restart this workout from the first set? Your saved progress will be cleared.')) restartWorkout();
            }}
            title="Restart workout from the first set"
            className="mx-auto mt-0.5 flex min-h-[24px] items-center gap-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <RotateCcw className="h-3 w-3" /> Restart
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={openFormCheck} className="glass rounded-full w-11 h-11 flex items-center justify-center" aria-label="Check form" title="Check form">
            <ScanFace className="w-5 h-5 text-primary" />
          </button>
          <button
            onClick={toggleMedia}
            className="glass rounded-full w-11 h-11 flex items-center justify-center"
            aria-label={showMedia ? 'Hide exercise demo and body map' : 'Show exercise demo and body map'}
            aria-pressed={showMedia}
            title={showMedia ? 'Hide exercise demo and body map' : 'Show exercise demo and body map'}
          >
            {showMedia ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
          </button>
          {voiceEnabled && englishVoices().length > 1 && (
            <button onClick={cycleVoice} className="glass rounded-full px-3 min-h-[44px] text-[11px] text-muted-foreground max-w-[90px] truncate" title="Try another voice">
              {voiceName.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*\(.*\)|\s*Online.*/i, '') || 'Voice'}
            </button>
          )}
          <button onClick={toggleVoice} aria-label="Toggle voice" className="glass rounded-full w-11 h-11 flex items-center justify-center">{voiceEnabled?<Volume2 className="w-5 h-5 text-primary"/>:<VolumeX className="w-5 h-5 text-muted-foreground"/>}</button>
        </div>
      </div>
      <Progress value={overallProgress} className="h-1 mx-4 rounded-full" />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
        <AnimatePresence>
          {motivation && (
            <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="py-1 text-center text-sm font-semibold text-primary">
              {motivation}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div key={exIndex} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} className="mb-2 text-center">
            <h2 className="text-xl font-black leading-tight sm:text-2xl">{currentExercise?.name}</h2>
            {currentExercise?.instructions && <p className="mx-auto mt-0.5 max-w-md text-[11px] text-muted-foreground line-clamp-2">{currentExercise.instructions}</p>}
          </motion.div>
        </AnimatePresence>

        {exState ? (
          <HybridTracker
            exercise={exState}
            phase={phase}
            restLeft={restLeft}
            elapsed={elapsed}
            actual={actual}
            weight={weight}
            paused={isPaused}
            poseEnabled={poseEnabled}
            movement={movement}
            tempoEnabled={tempoEnabled}
            onPoseToggle={() => setPoseEnabled((value) => !value)}
            onTempoToggle={() => setTempoEnabled((value) => !value)}
            onAdjust={handleAdjust}
            onQuickInput={setPrimaryValue}
            onWeightChange={handleWeight}
            onModeChange={handleModeChange}
            onCompleteSet={() => (phase === 'rest' ? skipRest() : finishSet('manual'))}
            onSkipRest={skipRest}
            onCameraReps={handleCameraReps}
            onRestAdjust={handleRestAdjust}
            onRestInput={handleRestInput}
            onPauseToggle={() => setIsPaused((value) => !value)}
            onSkip={skipExercise}
          />
        ) : (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        )}

        {showMedia ? (
          <div className="mx-auto mt-3 w-[140px] sm:w-[200px]">
            <WorkoutDemo compact exerciseName={currentExercise?.name} nextExerciseName={exercises[exIndex + 1]?.name} />
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleMedia}
            className="mx-auto mt-3 flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <EyeOff className="h-3.5 w-3.5" /> Show exercise demo
          </button>
        )}
      </div>

      <FormCheck open={formOpen} exerciseName={currentExercise?.name} onClose={closeFormCheck} />
    </div>
  );
}
