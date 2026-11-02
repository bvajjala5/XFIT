// AI helper — talks to the Uttar Fitness AI proxy (see /worker). The Gemini API key lives on
// the proxy, never in this app. Requests are authenticated with the user's Firebase ID token.
import { auth } from './firebase';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL;

const MOCK_WORKOUTS = [
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
  },
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
];

export async function callAI({ system, messages, maxTokens = 1000 }) {
  if (!PROXY_URL) {
    // Mock AI response for development
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network lag
    const mock = MOCK_WORKOUTS[Math.floor(Math.random() * MOCK_WORKOUTS.length)];
    return JSON.stringify(mock);
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to use AI features.');

  const token = await user.getIdToken();
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system, messages, maxTokens }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `AI error ${res.status}`);
  if (!data.text) throw new Error('No response from AI');
  return data.text;
}
