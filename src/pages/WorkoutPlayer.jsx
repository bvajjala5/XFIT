import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Play, Pause, SkipForward, X, ArrowRight, Volume2, VolumeX, Star, Share2, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import WorkoutDemo from '@/components/workout/WorkoutDemo';
import { toast } from 'sonner';
import { normalizeExercise, amountLabel } from '@/lib/exerciseTiming';
import { savePR } from '@/lib/personalRecords';

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
  try { window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })); } catch (e) {}
}

const PRAISE = ['Nice work.', 'Strong.', 'Good job.', 'That’s it.', 'Keep it up.', 'Well done.'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const amountText = (ex) => amountLabel(ex);

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
  const customDurationsParam = searchParams.get('durations');
  const customDurations = customDurationsParam ? JSON.parse(decodeURIComponent(customDurationsParam)) : null;

  const [currentEx, setCurrentEx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('xfit_voice_enabled') !== 'false');



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

  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);
  const [voiceName, setVoiceName] = useState(() => pickVoice()?.name || '');
  const announcedRef = useRef({ exIndex:-1, countdown:false });

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

  const collectionName = isCustom ? 'customWorkouts' : 'workouts';
  const { data: workout } = useQuery({
    queryKey: ['workout-player', workoutId, isCustom],
    queryFn: async () => {
      if (isCustom && user) {
        const snap = await getDoc(doc(db, 'users', user.uid, 'customWorkouts', workoutId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      }
      // Check if it's a custom workout but the route was /player/:id instead of /player/custom/:id
      if (user) {
        const customSnap = await getDoc(doc(db, 'users', user.uid, 'customWorkouts', workoutId));
        if (customSnap.exists()) return { id: customSnap.id, ...customSnap.data(), isCustom: true };
      }
      const snap = await getDoc(doc(db, 'workouts', workoutId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    enabled: !!workoutId
  });

  const exercises = useMemo(() => {
    if (!workout?.exercises) return [];
    return workout.exercises.map((raw,i) => {
      const ex = normalizeExercise(raw);   // handles builder-style fields (duration_seconds, "8-12" reps)
      if (customDurations && customDurations[i] !== undefined) return {...ex, duration:customDurations[i]};
      return ex;
    });
  }, [workout?.id, workout?.exercises, customDurations]);

  // Set the timer and announce the exercise whenever it changes, and once the workout has loaded
  // (the exercise list arrives after the first render, which used to leave the timer at 0 and skip exercise 1).
  useEffect(() => {
    if (!exercises.length || isComplete) return;
    const ex = exercises[currentEx];
    const dur = ex?.duration || (ex?.sets ? ex.sets*(ex.reps||10)*3 : 30);
    timeLeftRef.current = dur;
    setTimeLeft(dur);
    announcedRef.current.countdown = false;
    if (announcedRef.current.exIndex !== currentEx) {
      announcedRef.current.exIndex = currentEx;
      const isLast = currentEx === exercises.length-1;
      const amount = amountText(ex, dur);
      if (currentEx === 0) speakText(`Let’s go. First up, ${ex.name}. ${amount}.`, voiceEnabled);
      else if (isLast) speakText(`${pick(PRAISE)} Last one. ${ex.name}. ${amount}. Give it everything.`, voiceEnabled);
      else speakText(`${pick(PRAISE)} Next, ${ex.name}. ${amount}.`, voiceEnabled);
    }
  }, [currentEx, isComplete, exercises.length]);

  // Exercise countdown — use refs to avoid stale closures
  const exercisesRef = useRef(exercises);
  const currentExRef = useRef(currentEx);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);
  useEffect(() => { currentExRef.current = currentEx; }, [currentEx]);

  const mountedRef = useRef(false);
  useEffect(() => { mountedRef.current = true; }, []);

  useEffect(() => {
    if (isPaused || isComplete || !exercises.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const prev = timeLeftRef.current;
      if (prev <= 0) return; // timer not set yet — never advance on a zero
      if (prev === 4 && !announcedRef.current.countdown) {
        announcedRef.current.countdown = true;
        speakText('3, 2, 1', voiceEnabled, { rate: 1.0 });
      }
      setTotalTime(t => t + 1);
      if (prev > 1) { timeLeftRef.current = prev - 1; setTimeLeft(prev - 1); return; }
      const exs = exercisesRef.current;
      const cur = currentExRef.current;
      timeLeftRef.current = 0; setTimeLeft(0);
      if (cur < exs.length - 1) {
        setCurrentEx(c => c + 1);
        setMotivation(motivations[Math.floor(Math.random() * motivations.length)]);
        setTimeout(() => setMotivation(''), 3000);
      } else {
        speakText('Workout complete. You crushed it today.', voiceEnabled);
        setIsComplete(true);
        clearInterval(timerRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, isComplete, currentEx, exercises.length, voiceEnabled]);

  const skipExercise = useCallback(() => {
    if (currentEx < exercises.length-1) setCurrentEx(c=>c+1);
    else setIsComplete(true);
  }, [currentEx, exercises]);

  const handleLogWorkout = async () => {
    if (!user) { navigate('/'); return; }
    try {
      const calories = Math.round((workout?.calories_estimate||200) * (totalTime/((workout?.duration||30)*60)));
      await addDoc(collection(db,'users',user.uid,'workouts'), {
        workout_id: workoutId,
        workout_title: workout?.title||workout?.name||'',
        workout_type: workout?.type||'',
        workout_category: workout?.category||'',
        completedAt: serverTimestamp(),
        duration_seconds: totalTime,
        calories_burned: calories,
        exercises_completed: currentEx+1,
        rating: rating || null,
        difficulty: logDifficulty || null,
        notes: workoutNotes.trim() || null,
      });

    } catch(e) { console.error('handleLogWorkout error:', e); }
    navigate('/');
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
      const calories = Math.round((workout?.calories_estimate||200) * (totalTime/((workout?.duration||30)*60)));
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

  if (!workout) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const currentExercise = exercises[currentEx] || exercises[0] || {};
  const totalDuration = exercises.length > 0 ? exercises.reduce((s,e) => s+(e.duration||(e.sets?e.sets*(e.reps||10)*3:30)), 0) : 1;
  const elapsed = exercises.slice(0,currentEx).reduce((s,e) => s+(e.duration||(e.sets?e.sets*(e.reps||10)*3:30)), 0);
  const overallProgress = totalDuration > 0 ? ((elapsed+(currentExercise?.duration||30)-timeLeft)/totalDuration)*100 : 0;
  const formatTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const calories = Math.round((workout.calories_estimate||workout.estimated_duration*10||300)*Math.min(totalTime/((workout.duration||workout.estimated_duration||30)*60),1.2));


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
          <div className="flex gap-3">
            <Button className="flex-1 h-14 rounded-2xl text-base font-bold" onClick={() => setShowLogModal(true)}>
              Log Workout <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl text-base font-bold" onClick={() => setShowPRModal(true)}>
              <Trophy className="w-5 h-5 mr-2" /> New PR
            </Button>
            <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl shrink-0" onClick={handleShare} disabled={sharing}>
              {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>Skip</Button>
        </motion.div>

        {/* ── LOG MODAL ── */}
        <AnimatePresence>
          {showLogModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-sm bg-card border border-border/50 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-black">How was it?</h2>
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
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-sm bg-card border border-border/50 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-black">New Personal Record!</h2>
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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="glass rounded-full p-2"><X className="w-5 h-5" /></button>
        <div className="text-sm font-medium text-muted-foreground">{currentEx+1} / {exercises.length}</div>
        <div className="flex items-center gap-2">
          {voiceEnabled && englishVoices().length > 1 && (
            <button onClick={cycleVoice} className="glass rounded-full px-3 min-h-[44px] text-[11px] text-muted-foreground max-w-[110px] truncate" title="Try another voice">
              {voiceName.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*\(.*\)|\s*Online.*/i, '') || 'Voice'}
            </button>
          )}
          <button onClick={toggleVoice} aria-label="Toggle voice" className="glass rounded-full w-11 h-11 flex items-center justify-center">{voiceEnabled?<Volume2 className="w-5 h-5 text-primary"/>:<VolumeX className="w-5 h-5 text-muted-foreground"/>}</button>
        </div>
      </div>
      <Progress value={overallProgress} className="h-1 mx-4 rounded-full" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentEx} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="space-y-3 w-full">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">{currentExercise?.name}</h2>
            <p className="text-muted-foreground text-sm">{currentExercise?.reps?`${amountLabel(currentExercise)}${currentExercise.weight?' · '+currentExercise.weight:''}`:`${currentExercise?.duration||30} seconds`}</p>
            {currentExercise?.instructions && <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">{currentExercise.instructions}</p>}
            <WorkoutDemo exerciseName={currentExercise?.name} nextExerciseName={exercises[currentEx + 1]?.name} />
          </motion.div>
        </AnimatePresence>
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(0,0%,15%)" strokeWidth="8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(211,100%,52%)" strokeWidth="8" strokeLinecap="round" strokeDasharray={2*Math.PI*90} strokeDashoffset={2*Math.PI*90*(1-timeLeft/(currentExercise?.duration||30))} style={{transition:'stroke-dashoffset 0.5s ease'}} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <AnimatePresence>
          {motivation && <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="text-primary font-semibold text-lg">{motivation}</motion.div>}
        </AnimatePresence>
        {currentEx < exercises.length-1 && (
          <div className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Next up:</span>
            <span className="ml-2 font-medium text-foreground">{exercises[currentEx+1]?.name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-6 p-8">
        <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full" onClick={() => setIsPaused(!isPaused)}>
          {isPaused?<Play className="w-6 h-6" fill="currentColor"/>:<Pause className="w-6 h-6"/>}
        </Button>
        <Button variant="secondary" size="icon" className="w-12 h-12 rounded-full" onClick={skipExercise}>
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
