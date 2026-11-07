// AI helper — talks to the Uttar Fitness AI proxy (see /worker). The Gemini API key lives on
// the proxy, never in this app. Requests are authenticated with the user's Firebase ID token.
import { auth } from './firebase';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL;

const EXERCISE_LIBRARY = {
  biceps: [
    { name: "Bicep Curls", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Control the descent" },
    { name: "Hammer Curls", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Keep palms facing each other" },
    { name: "Preacher Curls", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Full stretch at bottom" },
    { name: "Concentration Curls", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Squeeze at the top" },
  ],
  triceps: [
    { name: "Tricep Dips", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Keep elbows tucked" },
    { name: "Skull Crushers", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Lower to forehead" },
    { name: "Overhead Extension", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Stay upright" },
    { name: "Cable Pushdowns", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Lock out at the bottom" },
  ],
  chest: [
    { name: "Push Ups", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 60, notes: "Chest to floor" },
    { name: "Bench Press", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 90, notes: "Drive through heels" },
    { name: "Chest Flys", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Squeeze at the center" },
    { name: "Incline Press", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Target upper chest" },
  ],
  back: [
    { name: "Pull Ups", sets: 3, reps: "max", duration_seconds: null, rest_seconds: 90, notes: "Chest to bar" },
    { name: "Bent Over Rows", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Pull to hip" },
    { name: "Lat Pulldowns", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Pull with elbows" },
    { name: "Deadlifts", sets: 3, reps: "8", duration_seconds: null, rest_seconds: 120, notes: "Keep back flat" },
  ],
  shoulders: [
    { name: "Overhead Press", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Core tight" },
    { name: "Lateral Raises", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Lead with elbows" },
    { name: "Front Raises", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Don't swing" },
    { name: "Face Pulls", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Pull to forehead" },
  ],
  quads: [
    { name: "Squats", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 90, notes: "Depth is key" },
    { name: "Leg Press", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 60, notes: "Controlled descent" },
    { name: "Leg Extensions", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Squeeze at top" },
    { name: "Step Ups", sets: 3, reps: "10 per leg", duration_seconds: null, rest_seconds: 60, notes: "Drive through heel" },
  ],
  hamstrings: [
    { name: "Leg Curls", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Squeeze hamstrings" },
    { name: "Romanian Deadlifts", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 90, notes: "Hinge at hips" },
    { name: "Good Mornings", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Back flat" },
  ],
  glutes: [
    { name: "Hip Thrusts", sets: 4, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Squeeze at the top" },
    { name: "Glute Bridges", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Drive through heels" },
    { name: "Bulgarian Split Squats", sets: 3, reps: "10 per leg", duration_seconds: null, rest_seconds: 60, notes: "Lean forward for glutes" },
    { name: "Cable Kickbacks", sets: 3, reps: "12 per leg", duration_seconds: null, rest_seconds: 45, notes: "Controlled movement" },
  ],
  core: [
    { name: "Plank", sets: 3, reps: "1", duration_seconds: 60, rest_seconds: 30, notes: "Tighten core" },
    { name: "Russian Twists", sets: 3, reps: "20", duration_seconds: null, rest_seconds: 30, notes: "Rotate from waist" },
    { name: "Leg Raises", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 30, notes: "Lower slowly" },
    { name: "Crunches", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 30, notes: "Upper back only" },
  ],
  stretches: [
    { name: "Child's Pose", sets: 1, reps: "1", duration_seconds: 30, rest_seconds: 0, notes: "Breathe deeply" },
    { name: "Cobra Stretch", sets: 1, reps: "1", duration_seconds: 30, rest_seconds: 0, notes: "Stretch abs" },
    { name: "Cat-Cow", sets: 1, reps: "10", duration_seconds: null, rest_seconds: 0, notes: "Fluid movement" },
    { name: "Quad Stretch", sets: 1, reps: "30s per leg", duration_seconds: 30, rest_seconds: 0, notes: "Hold balance" },
    { name: "Hamstring Stretch", sets: 1, reps: "30s per leg", duration_seconds: 30, rest_seconds: 0, notes: "Reach for toes" },
    { name: "Pigeon Pose", sets: 1, reps: "30s per leg", duration_seconds: 30, rest_seconds: 0, notes: "Opens hips" },
  ],
  fullbody: [
    { name: "Burpees", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Full chest to floor" },
    { name: "Mountain Climbers", sets: 3, reps: "30", duration_seconds: 30, rest_seconds: 30, notes: "High intensity" },
    { name: "Jump Squats", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Explosive jump" },
    { name: "Kettlebell Swings", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 60, notes: "Hinge, don't squat" },
  ]
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getMockResponse(prompt = '') {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const p = prompt.toLowerCase();

  if (p.includes('plan') || p.includes('weekly') || p.includes('schedule')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = {};

    days.forEach(day => {
      if (Math.random() < 0.3) {
        plan[day] = { type: 'rest', label: 'Rest Day' };
      } else {
        const themes = ['legs', 'upper', 'core', 'fullbody'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const targetCat = theme === 'upper' ? 'chest' : theme;

        const lib = EXERCISE_LIBRARY[targetCat] || EXERCISE_LIBRARY.fullbody;
        const count = 3 + Math.floor(Math.random() * 3);
        const shuffled = [...lib].sort(() => 0.5 - Math.random());

        const dayExercises = shuffled.slice(0, count).map((ex, i) => ({
          ...ex, id: `ex-${day}-${i}-${Date.now()}`
        }));

        plan[day] = {
          type: 'workout',
          workout_title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Focus`,
          workout_duration: 30 + Math.floor(Math.random() * 20),
          exercises: dayExercises
        };
      }
    });

    return JSON.stringify({ type: 'plan', plan });
  }

  const targets = [];
  if (p.includes('bicep') || p.includes('arm')) targets.push('biceps');
  if (p.includes('tricep')) targets.push('triceps');
  if (p.includes('chest') || p.includes('push')) targets.push('chest');
  if (p.includes('back') || p.includes('pull')) targets.push('back');
  if (p.includes('shoulder')) targets.push('shoulders');
  if (p.includes('leg') || p.includes('quad')) targets.push('quads');
  if (p.includes('hamstring')) targets.push('hamstrings');
  if (p.includes('glute')) targets.push('glutes');
  if (p.includes('core') || p.includes('ab')) targets.push('core');

  if (targets.length === 0 || p.includes('full body') || p.includes('fullbody')) {
    targets.push('fullbody');
  }

  const exercises = [];
  targets.forEach(cat => {
    const lib = EXERCISE_LIBRARY[cat];
    const count = Math.min(lib.length, 2 + Math.floor(Math.random() * 2));
    const shuffled = [...lib].sort(() => 0.5 - Math.random());
    shuffled.slice(0, count).forEach((ex, i) => {
      exercises.push({ ...ex, id: `ex-${cat}-${i}-${Date.now()}` });
    });
  });

  // Add cool-down stretches only if requested
  if (p.includes('stretch') || p.includes('cool down') || p.includes('flexibility')) {
    const stretchLib = EXERCISE_LIBRARY.stretches;
    const stretchCount = 1 + Math.floor(Math.random() * 2);
    const shuffledStretches = [...stretchLib].sort(() => 0.5 - Math.random());
    shuffledStretches.slice(0, stretchCount).forEach((ex, i) => {
      exercises.push({ ...ex, id: `stretch-${i}-${Date.now()}` });
    });
  }

  const finalExercises = exercises.sort(() => 0.5 - Math.random());

  const workout = {
    name: p.includes('bicep') ? "Bicep Blast" : p.includes('glute') ? "Glute Growth" : "Custom AI Workout",
    estimated_duration: 20 + Math.floor(Math.random() * 20),
    estimated_calories: 200 + Math.floor(Math.random() * 200),
    difficulty: "intermediate",
    exercises: finalExercises,
  };

  return JSON.stringify(workout);
}

// allowMock: workout building can fall back to the local generator, but the conversational
// coach must never pretend a failed request was answered, so chat passes false.
export async function callAI({ system, messages, maxTokens = 1000, allowMock = true }) {
  const userPrompt = messages?.find(m => m.role === 'user')?.content || '';

  if (!PROXY_URL || PROXY_URL.includes('your-proxy-url')) {
    if (allowMock) return getMockResponse(userPrompt);
    throw new Error('The AI coach is not configured. Add VITE_AI_PROXY_URL.');
  }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Please sign in to use AI features.');

    const token = await user.getIdToken();
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ system, messages, maxTokens }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `AI error ${res.status}`);
    }

    const data = await res.json();
    if (!data.text) throw new Error('No response from AI');

    return data.text;
  } catch (err) {
    if (err.message?.includes('sign in')) throw err;
    if (!allowMock) throw err;
    console.warn('AI request failed, falling back to mock:', err);
    return getMockResponse(userPrompt);
  }
}