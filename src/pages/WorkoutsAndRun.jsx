import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firestore';
import { deleteDoc, doc } from 'firebase/firestore/lite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Dumbbell, Footprints, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { fetchCustomWorkouts, fetchWorkoutLibrary } from '@/lib/workoutCache';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TYPES = ['All','hiit','strength','cardio','yoga','mobility'];
const DIFFICULTIES = ['All','beginner','intermediate','advanced'];
const MUSCLE_GROUPS = ['All','Chest','Back','Shoulders','Arms','Core','Legs','Glutes'];

// Compact filter chip shared by the collapsible panel.
const chipClass = (active) => `rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
  active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
}`;

export default function WorkoutsAndRun() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [difficulty, setDifficulty] = useState('All')
  const [muscleGroup, setMuscleGroup] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: fetchWorkoutLibrary,
  });

  const { data: customWorkouts = [], isLoading: customLoading } = useQuery({
    queryKey: ['custom-workouts', user?.uid],
    queryFn: () => fetchCustomWorkouts(user.uid),
    enabled: !!user,
  });

  const allWorkouts = [...workouts, ...customWorkouts];
  const isLoading = workoutsLoading || customLoading;

  const MUSCLE_MAP = {
    Chest: ['chest','push','press','fly'],
    Back: ['back','row','pull','lat','deadlift'],
    Shoulders: ['shoulder','overhead','lateral','delt'],
    Arms: ['bicep','tricep','curl','arm'],
    Core: ['core','ab','plank','crunch','twist'],
    Legs: ['squat','lunge','leg','quad','hamstring'],
    Glutes: ['glute','hip raise','bridge','bulgarian'],
  }

  const filtered = allWorkouts.filter(w => {
    const title = w.title || w.name || '';
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All' || w.type === type;
    const matchDiff = difficulty === 'All' || w.difficulty === difficulty;
    const matchMuscle = muscleGroup === 'All' || (MUSCLE_MAP[muscleGroup] || []).some(kw =>
      title.toLowerCase().includes(kw) ||
      w.category?.toLowerCase().includes(kw) ||
      w.exercises?.some(e => e.name?.toLowerCase().includes(kw))
    );
    return matchSearch && matchType && matchDiff && matchMuscle;
  });

  // Report matches rather than library size so the header and grid never
  // disagree, and surface the active filters with a one-tap reset.
  const activeFilters = [];
  if (search.trim()) activeFilters.push({ key: 'search', label: `“${search.trim()}”`, clear: () => setSearch('') });
  if (type !== 'All') activeFilters.push({ key: 'type', label: type, clear: () => setType('All') });
  if (difficulty !== 'All') activeFilters.push({ key: 'difficulty', label: difficulty, clear: () => setDifficulty('All') });
  if (muscleGroup !== 'All') activeFilters.push({ key: 'muscle', label: muscleGroup, clear: () => setMuscleGroup('All') });
  const isFiltered = activeFilters.length > 0;
  // Counts the panel filters only; the search box has its own control.
  const filterCount = (type !== 'All' ? 1 : 0) + (difficulty !== 'All' ? 1 : 0) + (muscleGroup !== 'All' ? 1 : 0);
  const resetFilters = () => { setSearch(''); setType('All'); setDifficulty('All'); setMuscleGroup('All'); };

  async function handleDeleteWorkout(workout) {
    if (!workout.isCustom) return;

    if (!confirm(`Are you sure you want to delete "${workout.title || workout.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'customWorkouts', workout.id));
      qc.invalidateQueries({ queryKey: ['custom-workouts', user.uid] });
      toast.success('Workout deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete workout');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-4">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary"/> Workouts
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isLoading
              ? 'Loading workouts…'
              : isFiltered
                ? `${filtered.length} of ${allWorkouts.length} workouts match`
                : `${allWorkouts.length} workouts available`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/plan" className="inline-flex min-h-[36px] items-center rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground">
            Plan
          </Link>
          <Link to="/builder" className="inline-flex min-h-[36px] items-center rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
            + Build
          </Link>
        </div>
      </div>

      {/* ── Run tracker (kept above the fold) ────────────────── */}
      <Link to="/run" className="flex items-center gap-3 rounded-2xl glass p-3 transition-transform active:scale-[0.99]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <Footprints className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Run Tracker</span>
          <span className="block text-[11px] text-muted-foreground">GPS tracking &amp; pace</span>
        </span>
        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
      </Link>

      {/* ── Search + filter toggle ───────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workouts..."
            className="pl-9 bg-card border-border/60 h-10"/>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(open => !open)}
          aria-expanded={filtersOpen}
          aria-controls="workout-filters"
          className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${
            filtersOpen || filterCount
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {filterCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filters */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              aria-label={`Remove filter ${f.label}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary transition-colors hover:bg-primary/20"
            >
              {f.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Collapsible filters — hidden by default so the grid fits the screen */}
      {filtersOpen && (
        <div id="workout-filters" className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button key={t} type="button" aria-pressed={type===t} onClick={() => setType(t)} className={chipClass(type===t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Level</p>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map(d => (
                <button key={d} type="button" aria-pressed={difficulty===d} onClick={() => setDifficulty(d)} className={chipClass(difficulty===d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Muscle group</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map(mg => (
                <button key={mg} type="button" aria-pressed={muscleGroup===mg} onClick={() => setMuscleGroup(mg)} className={chipClass(muscleGroup===mg)}>
                  {mg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card border border-border/60 rounded-2xl overflow-hidden">
              <div className="w-full h-36 animate-pulse bg-secondary/60" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse bg-secondary/60 rounded-xl" />
                <div className="h-3 w-1/2 animate-pulse bg-secondary/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Workout grid */}
      {!isLoading && filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p>No workouts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((w, i) => <WorkoutCard key={w.id} workout={w} index={i} isCustom={w.isCustom} onDelete={handleDeleteWorkout}/>)}
        </div>
      )}
    </div>
  );
}