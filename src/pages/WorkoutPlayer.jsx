import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, X, Trophy, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import WorkoutModel from '@/components/workout/WorkoutModel';

function cleanForSpeech(text) {
  return text.replace(/\bSpO2\b/gi,'blood oxygen').replace(/(\d+)\s*x\s*(\d+)/gi,'$1 by $2').replace(/\blbs\b/gi,'pounds').replace(/\breps\b/gi,'repetitions').replace(/\bmin\b/gi,'minutes').replace(/\bsec\b/gi,'seconds').replace(/\b([A-Z]{2,})\b/g,m=>m.toLowerCase());
}

function speakText(text, enabled=true) {
  if (!enabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const cleaned = cleanForSpeech(text);
  const speak = (voices) => {
    const u = new SpeechSynthesisUtterance(cleaned);
    const v = voices.find(v=>v.name==='Google US English')||voices.find(v=>v.name==='Samantha')||voices.find(v=>v.name==='Alex')||voices.find(v=>v.lang==='en-US');
    if (v) u.voice=v;
    u.lang='en-US'; u.rate=0.88; u.pitch=1.0; u.volume=1.0;
    window.speechSynthesis.speak(u);
  };
  const vv = window.speechSynthesis.getVoices();
  if (vv.length>0) speak(vv);
  else window.speechSynthesis.onvoiceschanged = () => speak(window.speechSynthesis.getVoices());
}

const motivations = ["You're crushing it! 💪","Push through the burn!","Almost there, don't give up!","You're stronger than yesterday!","Feel the power! 🔥","Every rep counts!","Let's go, champion!"];

export default function WorkoutPlayer() {
  const { id } = useParams();
  const isCustom = id?.startsWith('custom/');
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
  const timerRef = useRef(null);
  const announcedRef = useRef({ exIndex:-1, countdown:false });

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
      const snap = await getDoc(doc(db, 'workouts', workoutId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    enabled: !!workoutId
  });

  const exercises = useMemo(() => (workout?.exercises||[]).map((ex,i) => {
    if (customDurations && customDurations[i] !== undefined) return {...ex, duration:customDurations[i]};
    return ex;
  }), [workout?.id]);

  useEffect(() => {
    if (!exercises.length || isComplete) return;
    const ex = exercises[currentEx];
    const dur = ex?.duration || (ex?.sets ? ex.sets*(ex.reps||10)*3 : 30);
    setTimeLeft(dur);
    announcedRef.current.countdown = false;
    if (announcedRef.current.exIndex !== currentEx) {
      announcedRef.current.exIndex = currentEx;
      const isLast = currentEx === exercises.length-1;
      const desc = ex.reps ? `${ex.reps} repetitions` : `${dur} seconds`;
      if (currentEx===0) speakText(`Let's go! Starting with ${ex.name}.`, voiceEnabled);
      else if (isLast) speakText(`Last one! Give it everything you've got — ${ex.name}.`, voiceEnabled);
      else speakText(`Next up — ${ex.name}. ${desc}. Let's get it.`, voiceEnabled);
    }
  }, [currentEx, exercises, isComplete]);

  useEffect(() => {
    if (isPaused||isComplete||!exercises.length) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev===5 && !announcedRef.current.countdown) { announcedRef.current.countdown=true; speakText('5... 4... 3... 2... 1...', voiceEnabled); }
        if (prev<=1) {
          if (currentEx < exercises.length-1) {
            const nextEx = exercises[currentEx+1];
            if (nextEx) speakText(`Great work! Coming up next — ${nextEx.name}.`, voiceEnabled);
            setCurrentEx(c=>c+1);
            setMotivation(motivations[Math.floor(Math.random()*motivations.length)]);
            setTimeout(() => setMotivation(''), 3000);
            return 0;
          } else {
            speakText('Workout complete! You crushed it today. See you tomorrow.', voiceEnabled);
            setIsComplete(true);
            clearInterval(timerRef.current);
            return 0;
          }
        }
        return prev-1;
      });
      setTotalTime(t=>t+1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, isComplete, currentEx, exercises]);

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
      });
      // Check leaderboard privacy settings
      const privacyStr = localStorage.getItem('xfit_lb_privacy');
      const privacy = privacyStr ? JSON.parse(privacyStr) : { joined: true, name: null };
      if (privacy.joined !== false) {
        const lbRef = doc(db, 'leaderboard', user.uid);
        const lbSnap = await getDoc(lbRef);
        const today = new Date().toISOString().split('T')[0];
        const displayName = privacy.name || user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Athlete';
        if (!lbSnap.exists()) {
          await setDoc(lbRef, { displayName, email: user.email, totalWorkouts: 1, weeklyWorkouts: 1, streak: 1, lastWorkoutDate: today, updatedAt: new Date() });
        } else {
          const data = lbSnap.data();
          const last = data.lastWorkoutDate || '';
          const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
          const newStreak = last===today ? (data.streak||1) : last===yesterday ? (data.streak||0)+1 : 1;
          const daysSince = last ? Math.floor((Date.now()-new Date(last+'T12:00:00').getTime())/86400000) : 999;
          const newWeekly = daysSince>=7 ? 1 : (data.weeklyWorkouts||0)+(last===today?0:1);
          await updateDoc(lbRef, { displayName, totalWorkouts: increment(1), weeklyWorkouts: newWeekly, streak: newStreak, lastWorkoutDate: today, updatedAt: new Date() });
        }
      }
    } catch(e) { console.error('handleLogWorkout error:', e); }
    navigate('/');
  };

  if (!workout) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const currentExercise = exercises[currentEx];
  const totalDuration = exercises.reduce((s,e) => s+(e.duration||(e.sets?e.sets*(e.reps||10)*3:30)), 0);
  const elapsed = exercises.slice(0,currentEx).reduce((s,e) => s+(e.duration||(e.sets?e.sets*(e.reps||10)*3:30)), 0);
  const overallProgress = ((elapsed+(exercises[currentEx]?.duration||30)-timeLeft)/totalDuration)*100;
  const formatTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const calories = Math.round((workout.calories_estimate||workout.estimated_duration*10||300)*Math.min(totalTime/((workout.duration||workout.estimated_duration||30)*60),1.2));

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div><h1 className="text-3xl font-bold">Workout Complete! 💪</h1></div>
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="text-center"><div className="text-xl font-bold">{formatTime(totalTime)}</div><div className="text-[10px] text-muted-foreground">Duration</div></GlassCard>
            <GlassCard className="text-center"><div className="text-xl font-bold">{calories}</div><div className="text-[10px] text-muted-foreground">Calories</div></GlassCard>
            <GlassCard className="text-center"><div className="text-xl font-bold">{exercises.length}</div><div className="text-[10px] text-muted-foreground">Exercises</div></GlassCard>
          </div>
          <Button className="w-full h-14 rounded-2xl text-lg font-bold" onClick={handleLogWorkout}>Log Workout <ArrowRight className="w-5 h-5 ml-2" /></Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>Skip</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="glass rounded-full p-2"><X className="w-5 h-5" /></button>
        <div className="text-sm font-medium text-muted-foreground">{currentEx+1} / {exercises.length}</div>
        <button onClick={toggleVoice} className="glass rounded-full p-2">{voiceEnabled?<Volume2 className="w-5 h-5 text-primary"/>:<VolumeX className="w-5 h-5 text-muted-foreground"/>}</button>
      </div>
      <Progress value={overallProgress} className="h-1 mx-4 rounded-full" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentEx} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="space-y-3 w-full">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">{currentExercise?.name}</h2>
            <p className="text-muted-foreground text-sm">{currentExercise?.reps?`${currentExercise.reps} reps${currentExercise.weight?' · '+currentExercise.weight:''}`:`${currentExercise?.duration||30} seconds`}</p>
            {currentExercise?.instructions && <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">{currentExercise.instructions}</p>}
            <div className="hidden md:flex justify-center w-full">
              <div className="w-full max-w-xs"><WorkoutModel exerciseName={currentExercise?.name} showModified={true} /></div>
            </div>
            <div className="flex md:hidden justify-center">
              <WorkoutModel exerciseName={currentExercise?.name} showModified={false} />
            </div>
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
