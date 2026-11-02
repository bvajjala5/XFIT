// AI helper — talks to the Uttar Fitness AI proxy (see /worker). The Gemini API key lives on
// the proxy, never in this app. Requests are authenticated with the user's Firebase ID token.
import { auth } from './firebase';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL;

const MOCK_WORKOUTS = {
  legs: [
    {
      name: "Glute & Leg Power",
      estimated_duration: 40,
      estimated_calories: 400,
      difficulty: "intermediate",
      exercises: [
        { name: "Bulgarian Split Squats", sets: 3, reps: "10 per leg", duration_seconds: null, rest_seconds: 60, notes: "Keep torso slightly leaned forward" },
        { name: "Hip Thrusts", sets: 4, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Squeeze glutes at the top" },
        { name: "Walking Lunges", sets: 3, reps: "20 steps", duration_seconds: null, rest_seconds: 45, notes: "Step wide for more glute focus" },
        { name: "Goblet Squats", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Drive through your heels" },
        { name: "Glute Bridge", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 45, notes: "Hold for 1 second at top" },
      ]
    }
  ],
  upper: [
    {
      name: "Upper Body Sculpt",
      estimated_duration: 35,
      estimated_calories: 300,
      difficulty: "intermediate",
      exercises: [
        { name: "Dumbbell Press", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Full range of motion" },
        { name: "Overhead Press", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 60, notes: "Keep core tight" },
        { name: "Bent Over Rows", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 60, notes: "Squeeze shoulder blades" },
        { name: "Bicep Curls", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "No swinging" },
        { name: "Tricep Dips", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 45, notes: "Keep elbows tucked" },
      ]
    }
  ],
  core: [
    {
      name: "Core Crusher",
      estimated_duration: 15,
      estimated_calories: 150,
      difficulty: "beginner",
      exercises: [
        { name: "Russian Twists", sets: 3, reps: "20", duration_seconds: null, rest_seconds: 20, notes: "Touch the floor" },
        { name: "Leg Raises", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 20, notes: "Don't arch back" },
        { name: "Bicycle Crunches", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 20, notes: "Slow and controlled" },
        { name: "Plank", sets: 3, reps: "1", duration_seconds: 45, rest_seconds: 20, notes: "Hold steady" },
      ]
    }
  ],
  fullbody: [
    {
      name: "Full Body Burn",
      estimated_duration: 25,
      estimated_calories: 300,
      difficulty: "intermediate",
      exercises: [
        { name: "Jump Squats", sets: 3, reps: "15", duration_seconds: null, rest_seconds: 30, notes: "Keep your back straight" },
        { name: "Push Ups", sets: 3, reps: "12", duration_seconds: null, rest_seconds: 30, notes: "Chest to floor" },
        { name: "Mountain Climbers", sets: 3, reps: "30", duration_seconds: 30, rest_seconds: 30, notes: "Fast pace" },
        { name: "Plank", sets: 3, reps: "1", duration_seconds: 60, rest_seconds: 30, notes: "Tighten core" },
        { name: "Burpees", sets: 3, reps: "10", duration_seconds: null, rest_seconds: 30, notes: "Explosive jump" },
      ]
    }
  ]
};

async function getMockResponse(prompt = '') {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const p = prompt.toLowerCase();

  let category = 'fullbody';
  if (p.includes('leg') || p.includes('glute') || p.includes('quad') || p.includes('hamstring')) category = 'legs';
  else if (p.includes('upper') || p.includes('chest') || p.includes('arm') || p.includes('shoulder') || p.includes('back')) category = 'upper';
  else if (p.includes('core') || p.includes('ab') || p.includes('stomach')) category = 'core';

  const options = MOCK_WORKOUTS[category];
  const mock = options[Math.floor(Math.random() * options.length)];
  return JSON.stringify(mock);
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
}
