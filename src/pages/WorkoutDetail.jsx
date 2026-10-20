import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Clock, Flame, Dumbbell, Signal, User, Save, Check, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';

const typeColors = {
  hiit:'bg-red-500/20 text-red-400', yoga:'bg-purple-500/20 text-purple-400',
  strength:'bg-blue-500/20 text-blue-400', cardio:'bg-green-500/20 text-green-400',
  mobility:'bg-amber-500/20 text-amber-400'
};

// ── DEFAULT DURATIONS FOR LOCKED IN ──────────────────────────────────────
// Core rounds run 25s for rounds 1–6 and 85s for the final round (about 3m55s total).
const CORE_BASE = Math.floor(180 / 7); // 25s
const CORE_LAST = CORE_BASE + 60;      // 85s

const LOCKED_IN_DEFAULTS = {
  0:  180, // 105 Jumps Warm-Up — 3 mins
  1:  180, // Bicep Curls — 3 mins
  2:  180, // Lateral Raises — 3 mins
  3:  180, // Hammer Curls — 3 mins
  4:  180, // Ground to Overhead — 3 mins
  5:  180, // Push-Ups — 3 mins
  6:  CORE_BASE, // Core Circuit Round 1
  7:  CORE_BASE, // Core Circuit Round 2
  8:  CORE_BASE, // Core Circuit Round 3
  9:  CORE_BASE, // Core Circuit Round 4
  10: CORE_BASE, // Core Circuit Round 5
  11: CORE_BASE, // Core Circuit Round 6
  12: CORE_LAST, // Core Circuit Round 7 + Ab Hold (extra minute)
  13: 180, // Squats / Bulgarian Split Squats — 3 mins
};

function getLockedInDefault(index) {
  return LOCKED_IN_DEFAULTS[index] ?? 180;
}

function getStandardDefault(ex) {
  return ex?.duration || (ex?.sets ? ex.sets * (ex.reps || 10) * 3 : 30);
}

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const storageKey = `xfit_durations_${id}`;
  const isLockedIn = id === 'locked-in';

  const [customDurations, setCustomDurations] = useState({});
  const [savedDurations, setSavedDurations] = useState({});
  const [justSaved, setJustSaved] = useState(false);

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'workouts', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  });

  useEffect(() => {
    if (!workout) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const p = JSON.parse(stored);
      setCustomDurations(p);
      setSavedDurations(p);
    }
  }, [workout?.id]);

  const getDefaultDuration = (ex, i) =>
    isLockedIn ? getLockedInDefault(i) : getStandardDefault(ex);

  const getDuration = (ex, i) =>
    customDurations[i] !== undefined ? customDurations[i] : getDefaultDuration(ex, i);

  const hasUnsavedChanges = JSON.stringify(customDurations) !== JSON.stringify(savedDurations);

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(customDurations));
    // Also save total duration so workout cards can display it correctly
    const totalSecs = workout?.exercises?.reduce((s, ex, i) => {
      const d = customDurations[i] !== undefined ? customDurations[i] : getDefaultDuration(ex, i);
      return s + d;
    }, 0) || 0;
    localStorage.setItem('xfit_total_duration_' + id, String(Math.round(totalSecs / 60)));
    setSavedDurations({ ...customDurations });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Reset a single exercise to its default
  const handleReset = (ex, i) => {
    const defaultDur = getDefaultDuration(ex, i);
    setCustomDurations(prev => ({ ...prev, [i]: defaultDur }));
  };

  // Reset ALL exercises to defaults
  const handleResetAll = () => {
    setCustomDurations({});
    localStorage.removeItem(storageKey);
    localStorage.removeItem('xfit_total_duration_' + id);
    // Set savedDurations to sentinel so hasUnsavedChanges becomes true
    // and Save button appears so user can confirm the reset
    setSavedDurations({ _reset: true });
  };

  const totalCustomMins = workout
    ? Math.round(workout.exercises?.reduce((s, ex, i) => s + getDuration(ex, i), 0) / 60)
    : 0;
  const workoutDescription = isLockedIn
    ? (workout.description || '').replace(/\b21 minutes?\b/i, 'about 25 minutes')
    : workout.description;

  const buildPlayerUrl = () => {
    if (!workout) return '#';
    const durations = workout.exercises?.map((ex, i) => getDuration(ex, i));
    return `/player/${workout.id}?durations=${encodeURIComponent(JSON.stringify(durations))}`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!workout) return (
    <div className="flex items-center justify-center min-h-screen text-muted-foreground">Workout not found</div>
  );

  const hasAnyCustom = Object.keys(customDurations).length > 0;

  return (
    <div className="min-h-screen">
      {/* Hero image */}
      <div className="relative h-72 md:h-96">
        <img src={workout.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'}
          alt={workout.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 glass rounded-full p-2.5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-6 left-4 right-4 md:left-8">
          <Badge className={`${typeColors[workout.type] || ''} border-0 mb-2 text-[10px] uppercase tracking-wider`}>
            {workout.type}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">{workout.title}</h1>
          <p className="text-muted-foreground mt-1">{workout.category?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 -mt-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Clock,   label: 'Duration',  value: `${totalCustomMins || workout.duration} min` },
            { icon: Flame,   label: 'Calories',  value: `${workout.calories_estimate || '—'}` },
            { icon: Signal,  label: 'Level',     value: workout.difficulty },
            { icon: Dumbbell,label: 'Equipment', value: workout.equipment || 'None' },
          ].map(({ icon: Icon, label, value }) => (
            <GlassCard key={label} className="text-center py-3 px-2">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-sm font-bold capitalize">{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </GlassCard>
          ))}
        </div>

        {/* Description */}
        <div>
          <h2 className="font-semibold mb-2">About this workout</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {workoutDescription || 'A great workout to challenge yourself.'}
          </p>
        </div>

        {/* Trainer */}
        <GlassCard className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{workout.trainer}</div>
            <div className="text-xs text-muted-foreground">
              {workout.trainer_bio || 'Certified Personal Trainer'}
            </div>
          </div>
        </GlassCard>

        {/* Exercises */}
        {workout.exercises?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-semibold">Exercises ({workout.exercises.length})</h2>
              <div className="flex items-center gap-2">
                {/* Reset all button */}
                {hasAnyCustom && (
                  <button onClick={handleResetAll}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
                    <RotateCcw className="w-3 h-3" /> Reset all
                  </button>
                )}
                {/* Save button */}
                {true && (
                  <button onClick={handleSave}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${justSaved ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
                    {justSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                    {justSaved ? 'Saved!' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {workout.exercises.map((ex, i) => {
                const dur = getDuration(ex, i);
                const defaultDur = getDefaultDuration(ex, i);
                const isCustomized = customDurations[i] !== undefined && customDurations[i] !== defaultDur;
                const mins = Math.floor(dur / 60), secs = dur % 60;
                const displayTime = mins > 0 ? `${mins}m${secs > 0 ? ' ' + secs + 's' : ''}` : `${secs}s`;

                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }} className="glass rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{ex.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {ex.reps ? `${ex.reps} reps` : ''}
                            {ex.weight ? ` · ${ex.weight}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isCustomized ? 'text-orange-400' : 'text-primary'}`}>
                          {displayTime}
                        </span>
                        {/* Per-exercise reset button */}
                        {isCustomized && (
                          <button onClick={() => handleReset(ex, i)}
                            title="Reset to default"
                            className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] text-muted-foreground w-6">15s</span>
                      <input type="range" min={15} max={600} step={15} value={dur}
                        onChange={e => setCustomDurations(prev => ({ ...prev, [i]: Number(e.target.value) }))}
                        className="flex-1 h-1.5 rounded-full cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-muted-foreground w-8 text-right">10m</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <Button className="w-full h-14 rounded-2xl text-lg font-bold gap-2"
          onClick={() => navigate(buildPlayerUrl())}>
          <Play className="w-5 h-5" fill="currentColor" />
          Start Workout · {totalCustomMins || workout.duration} min
        </Button>
      </div>
    </div>
  );
}
