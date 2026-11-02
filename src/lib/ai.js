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

  // Identify targets
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

  // Generate exercises based on targets
  const exercises = [];
  targets.forEach(cat => {
    const lib = EXERCISE_LIBRARY[cat];
    // Pick 2-3 exercises per target category
    const count = Math.min(lib.length, 2 + Math.floor(Math.random() * 2));
    const shuffled = [...lib].sort(() => 0.5 - Math.random());
    shuffled.slice(0, count).forEach((ex, i) => {
      exercises.push({ ...ex, id: `ex-${cat}-${i}-${Date.now()}` });
    });
  });

  // Shuffle the final list
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

export async function callAI({ system, messages, maxTokens = 1000 }) {
  const userPrompt = messages?.find(m => m.role === 'user')?.content || '';

  if (!PROXY_URL || PROXY_URL.includes('your-proxy-url')) {
    return getMockResponse(userPrompt);
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
    console.warn('AI request failed, falling back to mock:', err);
    if (err.message.includes('sign in')) throw err;
    return getMockResponse(userPrompt);
  }
}.role === 'user')?.content || '';

  if (!PROXY_URL || PROXY_URL.includes('your-proxy-url')) {
    return getMockResponse(userPrompt);
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
    console.warn('AI request failed, falling back to mock:', err);
    if (err.message.includes('sign in')) throw err;
    return getMockResponse(userPrompt);
  }
}
