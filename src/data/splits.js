// Ready-made workouts for training splits. Equipment: a pair of dumbbells, a pull-up bar (or rows), and a floor.
// Exercise tuple: [name, sets, reps, restSeconds]  — or ['Plank', 'timed', seconds] for a hold.
const WARMUP = { name: 'Jumping Jacks', duration: 90, instructions: 'Easy pace to get warm. Loosen shoulders and hips.' }

const mk = (rows) => [WARMUP, ...rows.map((r) => {
  if (r[1] === 'timed') return { name: r[0], sets: 3, duration: r[2] * 3 + 2 * 30, reps: '', rest_seconds: 30, instructions: `3 holds of ${r[2]} seconds.` }
  const [name, sets, reps, rest] = r
  const per = String(reps).match(/\d+/) ? Number(String(reps).match(/\d+/)[0]) : 10
  return { name, sets, reps: String(reps), rest_seconds: rest, duration: sets * per * 3 + (sets - 1) * rest, instructions: `Rest ${rest}s between sets.` }
})]

export const TEMPLATES = {
  push: { id: 'split-push', label: 'Push', title: 'Push Day', category: 'upper_body', difficulty: 'intermediate', equipment: 'Dumbbells',
    description: 'Chest, shoulders and triceps.',
    exercises: mk([['Push-Ups', 3, 12, 45], ['Dumbbell Bench Press', 4, 10, 60], ['Dumbbell Shoulder Press', 3, 10, 60], ['Incline Dumbbell Press', 3, 10, 60], ['Lateral Raises', 3, 15, 45], ['Overhead Triceps Extension', 3, 12, 45]]) },
  pull: { id: 'split-pull', label: 'Pull', title: 'Pull Day', category: 'upper_body', difficulty: 'intermediate', equipment: 'Dumbbells, pull-up bar',
    description: 'Back, rear delts and biceps.',
    exercises: mk([['Pull-Ups', 4, 8, 75], ['Bent-Over Dumbbell Row', 4, 10, 60], ['Single-Arm Dumbbell Row', 3, 10, 60], ['Reverse Flyes', 3, 15, 45], ['Bicep Curls', 3, 12, 45], ['Hammer Curls', 3, 12, 45]]) },
  legs: { id: 'split-legs', label: 'Legs', title: 'Leg Day', category: 'lower_body', difficulty: 'intermediate', equipment: 'Dumbbells',
    description: 'Quads, hamstrings, glutes and calves.',
    exercises: mk([['Goblet Squats', 4, 12, 75], ['Romanian Deadlift', 4, 10, 75], ['Walking Lunges', 3, 12, 60], ['Bulgarian Split Squats', 3, 10, 60], ['Glute Bridges', 3, 15, 45], ['Standing Calf Raises', 4, 15, 30]]) },
  upper: { id: 'split-upper', label: 'Upper', title: 'Upper Body', category: 'upper_body', difficulty: 'intermediate', equipment: 'Dumbbells, pull-up bar',
    description: 'Push and pull in one session.',
    exercises: mk([['Dumbbell Bench Press', 3, 10, 60], ['Bent-Over Dumbbell Row', 3, 10, 60], ['Dumbbell Shoulder Press', 3, 10, 60], ['Pull-Ups', 3, 8, 75], ['Bicep Curls', 2, 12, 45], ['Overhead Triceps Extension', 2, 12, 45]]) },
  lower: { id: 'split-lower', label: 'Lower', title: 'Lower Body', category: 'lower_body', difficulty: 'intermediate', equipment: 'Dumbbells',
    description: 'Legs, glutes and core.',
    exercises: mk([['Goblet Squats', 4, 12, 75], ['Romanian Deadlift', 4, 10, 75], ['Walking Lunges', 3, 12, 60], ['Glute Bridges', 3, 15, 45], ['Standing Calf Raises', 3, 15, 30], ['Plank', 'timed', 40]]) },
  full: { id: 'split-full', label: 'Full body', title: 'Full Body', category: 'full_body', difficulty: 'intermediate', equipment: 'Dumbbells',
    description: 'Every major muscle in one session.',
    exercises: mk([['Goblet Squats', 3, 12, 60], ['Push-Ups', 3, 12, 45], ['Bent-Over Dumbbell Row', 3, 10, 60], ['Dumbbell Shoulder Press', 3, 10, 60], ['Romanian Deadlift', 3, 10, 60], ['Plank', 'timed', 40]]) },
  core: { id: 'split-core', label: 'Core', title: 'Core', category: 'core', difficulty: 'beginner', equipment: 'None',
    description: 'Abs and trunk stability.',
    exercises: mk([['Plank', 'timed', 40], ['Russian Twists', 3, 20, 30], ['Leg Raises', 3, 12, 30], ['Bicycle Crunches', 3, 20, 30], ['Dead Bug', 3, 12, 30]]) },
}

export const DAYS = [
  ['monday', 'Mon', 'Monday'], ['tuesday', 'Tue', 'Tuesday'], ['wednesday', 'Wed', 'Wednesday'], ['thursday', 'Thu', 'Thursday'],
  ['friday', 'Fri', 'Friday'], ['saturday', 'Sat', 'Saturday'], ['sunday', 'Sun', 'Sunday'],
]

// Mon → Sun. null = rest day.
export const PRESETS = [
  { id: 'ppl6', name: 'Push / Pull / Legs', sub: '6 days', week: ['push', 'pull', 'legs', 'push', 'pull', 'legs', null] },
  { id: 'ppl3', name: 'Push / Pull / Legs', sub: '3 days', week: ['push', null, 'pull', null, 'legs', null, null] },
  { id: 'split5', name: '5-day split', sub: 'Push, Pull, Legs, Upper, Lower', week: ['push', 'pull', 'legs', 'upper', 'lower', null, null] },
  { id: 'ul4', name: 'Upper / Lower', sub: '4 days', week: ['upper', 'lower', null, 'upper', 'lower', null, null] },
  { id: 'fb3', name: 'Full body', sub: '3 days', week: ['full', null, 'full', null, 'full', null, null] },
]

export const templateById = (workoutId) => Object.values(TEMPLATES).find((t) => t.id === workoutId) || null
