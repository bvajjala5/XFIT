import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import RunTracker from '@/components/run/RunTracker';
import RunSummary from '@/components/run/RunSummary';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Dumbbell, Footprints, Clock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { Input } from '@/components/ui/input';

const TYPES = ['All','hiit','strength','cardio','yoga','mobility'];
const DIFFICULTIES = ['All','beginner','intermediate','advanced'];

export default function WorkoutsAndRun() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [runSummary, setRunSummary] = useState(null);
  const [showingRun, setShowingRun] = useState(false);

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'workouts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
  });

  const filtered = workouts.filter(w => {
    const matchSearch = !search || w.title?.toLowerCase().includes(search.toLowerCase()) || w.trainer?.toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All' || w.type === type;
    const matchDiff = difficulty === 'All' || w.difficulty === difficulty;
    return matchSearch && matchType && matchDiff;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-5">

      {/* ── WORKOUTS SECTION ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary"/> Workouts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{workouts.length} workouts available</p>
        </div>
        <Link to="/builder">
          <button className="text-xs font-semibold bg-primary/10 text-primary px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors">
            + Build
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search workouts or trainers..."
          className="pl-9 bg-card border-border/60 h-11"/>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${type===t?'bg-primary text-white':'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${difficulty===d?'bg-primary/20 text-primary border border-primary/30':'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'}`}>
            {d}
          </button>
        ))}
      </div>

      {/* Workout grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p>No workouts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((w, i) => <WorkoutCard key={w.id} workout={w} index={i}/>)}
        </div>
      )}

      {/* ── DIVIDER ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-4">
        <div className="flex-1 h-px bg-border/40"/>
        <span className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Footprints className="w-3 h-3"/> Run Tracker
        </span>
        <div className="flex-1 h-px bg-border/40"/>
      </div>

      {/* ── RUN SECTION ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {runSummary ? (
          <motion.div key="summary" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <RunSummary summary={runSummary} userId={user?.uid} onClose={() => setRunSummary(null)}/>
          </motion.div>
        ) : (
          <motion.div key="tracker" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <RunTracker onComplete={setRunSummary}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
