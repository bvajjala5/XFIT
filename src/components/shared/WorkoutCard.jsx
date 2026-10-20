import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { getWorkoutDurationMinutes } from '@/lib/workoutDuration';

export default function WorkoutCard({ workout }) {
  return (
    <Link to={`/workouts/${workout.id}`} className="group flex h-full min-h-28 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] capitalize text-muted-foreground">{workout.type?.replace('_', ' ') || 'Workout'}</p>
        <h3 className="mt-1 truncate text-sm font-semibold">{workout.title}</h3>
        {workout.trainer && <p className="mt-0.5 truncate text-xs text-muted-foreground">{workout.trainer}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {getWorkoutDurationMinutes(workout)} min
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
