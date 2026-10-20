import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Dumbbell, Footprints, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { shareWorkout, unshareWorkout, isShared } from '@/lib/shareWorkout';

const TYPES = ['All', 'hiit', 'strength', 'cardio', 'yoga', 'mobility'];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];
const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Glutes'];
const MUSCLE_MAP = {
  Chest: ['chest', 'push', 'press', 'fly'],
  Back: ['back', 'row', 'pull', 'lat', 'deadlift'],
  Shoulders: ['shoulder', 'overhead', 'lateral', 'delt'],
  Arms: ['bicep', 'tricep', 'curl', 'arm'],
  Core: ['core', 'ab', 'plank', 'crunch', 'twist'],
  Legs: ['squat', 'lunge', 'leg', 'quad', 'hamstring'],
  Glutes: ['glute', 'hip raise', 'bridge', 'bulgarian'],
};

function matchesMuscleGroup(workout, group) {
  if (group === 'All') return true;
  const terms = MUSCLE_MAP[group] || [];
  return terms.some(term => workout.title?.toLowerCase().includes(term)
    || workout.category?.toLowerCase().includes(term)
    || workout.exercises?.some(exercise => exercise.name?.toLowerCase().includes(term)));
}

export default function WorkoutsAndRun() {
  const { user, userDoc } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [muscleGroup, setMuscleGroup] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sharingId, setSharingId] = useState(null);

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'workouts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
  });

  const { data: customWorkouts = [] } = useQuery({
    queryKey: ['custom-workouts', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(collection(db, 'users', user.uid, 'customWorkouts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  const matchesFilters = workout => {
    const queryText = search.trim().toLowerCase();
    const matchesSearch = !queryText || workout.title?.toLowerCase().includes(queryText)
      || workout.name?.toLowerCase().includes(queryText)
      || workout.trainer?.toLowerCase().includes(queryText);
    return matchesSearch
      && (type === 'All' || workout.type === type)
      && (difficulty === 'All' || workout.difficulty === difficulty)
      && matchesMuscleGroup(workout, muscleGroup);
  };
  const filtered = workouts.filter(matchesFilters);
  const filteredCustomWorkouts = customWorkouts.filter(matchesFilters);
  const activeFilters = [type !== 'All', difficulty !== 'All', muscleGroup !== 'All'].filter(Boolean).length;

  async function handleShare(workout) {
    if (!user) return;
    setSharingId(workout.id);
    try {
      if (await isShared(workout.id)) {
        await unshareWorkout(workout.id);
        toast.success('Workout removed from community');
      } else {
        await shareWorkout(user.uid, userDoc?.full_name || user.displayName || 'Anonymous', workout);
        toast.success('Workout shared with community');
      }
      queryClient.invalidateQueries({ queryKey: ['shared-workouts'] });
    } catch {
      toast.error('Could not update sharing');
    } finally {
      setSharingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-7 pb-28 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">{workouts.length} routines</p>
        </div>
        <Link to="/builder" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Create workout
        </Link>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Search workouts" aria-label="Search workouts"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <button type="button" onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters}
          className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${showFilters || activeFilters ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
          <Filter className="h-4 w-4" /> Filter{activeFilters ? ` · ${activeFilters}` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
          {[
            { label: 'Workout type', value: type, options: TYPES, onChange: setType },
            { label: 'Difficulty', value: difficulty, options: DIFFICULTIES, onChange: setDifficulty },
            { label: 'Muscle group', value: muscleGroup, options: MUSCLE_GROUPS, onChange: setMuscleGroup },
          ].map(filter => (
            <label key={filter.label} className="space-y-1.5 text-xs text-muted-foreground">
              <span>{filter.label}</span>
              <select value={filter.value} onChange={event => filter.onChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm capitalize text-foreground outline-none focus:border-primary">
                {filter.options.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {customWorkouts.length > 0 && (
        <section className="space-y-3" aria-labelledby="my-workouts-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="my-workouts-title" className="text-sm font-semibold">Your workouts</h2>
            <Link to="/community" className="text-xs text-muted-foreground hover:text-foreground">Community</Link>
          </div>
          {filteredCustomWorkouts.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No saved workouts match these filters.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              {filteredCustomWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center gap-3 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <Link to={`/player/custom/${workout.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{workout.name || workout.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{workout.exercises?.length || 0} exercises · {workout.duration || workout.estimated_duration || '—'} min</p>
                  </Link>
                  <button type="button" onClick={() => handleShare(workout)} disabled={sharingId === workout.id}
                    aria-label={`Share ${workout.name || workout.title} with the community`} title="Share with community"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3" aria-labelledby="browse-workouts-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="browse-workouts-title" className="text-sm font-semibold">Browse workouts</h2>
          <Link to="/run" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Footprints className="h-3.5 w-3.5" /> Run tracker
          </Link>
        </div>
        {workoutsLoading ? (
          <div className="grid grid-cols-2 gap-3" aria-label="Loading workouts">
            {[1, 2, 3, 4].map(index => <div key={index} className="h-48 animate-pulse rounded-xl bg-secondary/60" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No workouts found. Try changing your search or filters.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((workout, index) => <WorkoutCard key={workout.id} workout={workout} index={index} />)}
          </div>
        )}
      </section>
    </div>
  );
}
