import React from 'react';
import ExerciseDemo from '@/components/workout/ExerciseDemo';

/** One combined view: animated exercise demo with the muscles it works shown beside it. */
export default function WorkoutDemo({ exerciseName, nextExerciseName }) {
  return <ExerciseDemo exerciseName={exerciseName} nextExerciseName={nextExerciseName} />;
}
