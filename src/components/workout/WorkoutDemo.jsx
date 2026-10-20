import React, { useState } from 'react';
import KabiWorkoutDemo from '@/components/workout/KabiWorkoutDemo';
import ExerciseDemo from '@/components/workout/ExerciseDemo';

/** Kabi (same cartoon coach for every exercise) by default; "Real form" shows photo demo + muscle map. */
export default function WorkoutDemo({ exerciseName, nextExerciseName }) {
  const [mode, setMode] = useState('kabi');
  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-1 text-xs">
        {[['kabi', 'Coach Kabi'], ['real', 'Real form · Muscles']].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} className={`px-3 min-h-[32px] rounded-full ${mode === k ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground'}`}>{l}</button>
        ))}
      </div>
      {mode === 'kabi'
        ? <KabiWorkoutDemo exerciseName={exerciseName} />
        : <ExerciseDemo exerciseName={exerciseName} nextExerciseName={nextExerciseName} />}
    </div>
  );
}
