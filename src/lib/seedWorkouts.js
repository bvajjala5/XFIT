import { db } from './firebase';
import { collection, getDocs, getDoc, setDoc, doc, query, limit } from 'firebase/firestore';

const WORKOUTS = [
  { id:'hiit-cardio', title:'Athletic HIIT Cardio', trainer:'Jess Rivera', category:'full_body', type:'hiit', duration:30, difficulty:'advanced', calories_estimate:420, equipment:'None', description:'High-intensity interval training to torch calories and boost endurance.', image_url:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', exercises:[{name:'Burpees',reps:15,duration:45},{name:'Jump Squats',reps:20,duration:45},{name:'Mountain Climbers',duration:60},{name:'High Knees',duration:60},{name:'Box Jumps',reps:12,duration:45}] },
  { id:'full-body-strength', title:'Full Body Strength', trainer:'Marcus Cole', category:'full_body', type:'strength', duration:45, difficulty:'intermediate', calories_estimate:350, equipment:'Dumbbells', description:'Compound movements for total body strength and muscle building.', image_url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', exercises:[{name:'Deadlift',sets:4,reps:8,weight:'moderate'},{name:'Bench Press',sets:4,reps:10,weight:'moderate'},{name:'Pull-ups',sets:3,reps:8},{name:'Overhead Press',sets:3,reps:10,weight:'moderate'}] },
  { id:'mobility-reset', title:'Mobility Reset', trainer:'Priya Sharma', category:'recovery', type:'mobility', duration:20, difficulty:'beginner', calories_estimate:100, equipment:'Yoga mat', description:'Restore movement quality and reduce tension throughout your body.', image_url:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80', exercises:[{name:'Hip Flexor Stretch',duration:60},{name:'Thoracic Rotation',duration:60},{name:'Pigeon Pose',duration:90},{name:'Cat-Cow',reps:20,duration:60}] },
  { id:'yoga-meditation', title:'Mindful Meditation Flow', trainer:'Priya Sharma', category:'mindfulness', type:'yoga', duration:15, difficulty:'beginner', calories_estimate:50, equipment:'Yoga mat', description:'Calm the mind and center yourself with guided meditation.', image_url:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', exercises:[{name:'Seated Breathing',duration:120},{name:'Sun Salutation',reps:3,duration:180},{name:'Warrior I',duration:60},{name:'Savasana',duration:180}] },
  { id:'vinyasa-flow', title:'Vinyasa Power Flow', trainer:'Priya Sharma', category:'full_body', type:'yoga', duration:35, difficulty:'intermediate', calories_estimate:200, equipment:'Yoga mat', description:'Dynamic yoga flow to build strength and flexibility simultaneously.', image_url:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', exercises:[{name:'Sun Salutations',reps:5,duration:300},{name:'Warrior Series',duration:180},{name:'Balance Poses',duration:120},{name:'Core Work',duration:120},{name:'Final Stretch',duration:120}] },
  { id:'quick-cardio', title:'Quick Cardio Burst', trainer:'Jess Rivera', category:'full_body', type:'cardio', duration:15, difficulty:'beginner', calories_estimate:180, equipment:'None', description:'Get your heart pumping with this short, effective cardio session.', image_url:'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80', exercises:[{name:'Jumping Jacks',duration:60},{name:'High Knees',duration:60},{name:'Jump Rope',duration:60},{name:'Skaters',duration:60}] },
  { id:'inferno-hiit', title:'Inferno HIIT Burn', trainer:'Marcus Cole', category:'full_body', type:'hiit', duration:40, difficulty:'advanced', calories_estimate:480, equipment:'None', description:'Maximum intensity intervals for elite conditioning and fat burn.', image_url:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', exercises:[{name:'Sprint Intervals',duration:30},{name:'Burpee Broad Jumps',reps:10,duration:45},{name:'Plyo Push-Ups',reps:15,duration:45},{name:'Jump Lunges',reps:20,duration:45}] },
  { id:'power-strength', title:'Power Strength', trainer:'Sarah Kim', category:'upper_body', type:'strength', duration:50, difficulty:'advanced', calories_estimate:380, equipment:'Barbell, Dumbbells', description:'Heavy compound lifts for serious strength gains.', image_url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', exercises:[{name:'Back Squat',sets:5,reps:5,weight:'heavy'},{name:'Romanian Deadlift',sets:4,reps:6,weight:'heavy'},{name:'Barbell Row',sets:4,reps:8,weight:'heavy'}] },
  { id:'core-crusher', title:'Core Crusher', trainer:'Marcus Cole', category:'core', type:'strength', duration:25, difficulty:'intermediate', calories_estimate:220, equipment:'None', description:'Build a rock-solid core with this targeted abdominal routine.', image_url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', exercises:[{name:'Plank',duration:60},{name:'Russian Twists',reps:30,duration:60},{name:'Bicycle Crunches',reps:30,duration:60},{name:'Dead Bug',reps:20,duration:60},{name:'Ab Rollouts',reps:15,duration:60}] },
  { id:'recovery-flow', title:'Recovery Flow', trainer:'Priya Sharma', category:'recovery', type:'mobility', duration:30, difficulty:'beginner', calories_estimate:80, equipment:'Yoga mat, foam roller', description:'Active recovery to reduce soreness and improve next-day performance.', image_url:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80', exercises:[{name:'Foam Rolling',duration:180},{name:'Hip Flexor Stretch',duration:90},{name:'Chest Opener',duration:60},{name:'Spinal Twist',duration:90}] },
  { id:'sprint-intervals', title:'Sprint Intervals', trainer:'Jess Rivera', category:'full_body', type:'cardio', duration:20, difficulty:'intermediate', calories_estimate:280, equipment:'None', description:'Structured sprint and recovery intervals to maximize cardiovascular fitness.', image_url:'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80', exercises:[{name:'Warm-up Jog',duration:120},{name:'Sprint',duration:30},{name:'Rest',duration:60},{name:'Sprint',duration:30},{name:'Rest',duration:60}] },
  { id:'upper-body-blast', title:'Upper Body Blast', trainer:'Sarah Kim', category:'upper_body', type:'strength', duration:35, difficulty:'intermediate', calories_estimate:310, equipment:'Dumbbells, Pull-up bar', description:'Sculpt your upper body with this complete push/pull routine.', image_url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', exercises:[{name:'Push-Ups',reps:20,duration:60},{name:'Dumbbell Rows',sets:3,reps:12,weight:'moderate'},{name:'Lateral Raises',sets:3,reps:15,weight:'light'},{name:'Bicep Curls',sets:3,reps:12,weight:'moderate'}] },
];

const LOCKED_IN = {
  id: 'locked-in',
  title: 'Locked In',
  trainer: 'Bhanu Vajjala',
  trainer_bio: 'Personal routine — built for consistency and strength.',
  category: 'full_body',
  type: 'strength',
  duration: 25,
  difficulty: 'advanced',
  calories_estimate: 300,
  is_personal: true,
  is_public: true,
  equipment: 'Dumbbells',
  description: 'The Locked In routine. 105 jump warm-up, bicep curls, lateral raises, hammer curls, ground-to-overhead, push-ups or diamond push-ups, 7-round core circuit with 30s ab hold finish, squats or Bulgarian split squats. All at comfortable weight. About 25 minutes. 300 calories. Advanced.',
  image_url: '/locked-in-cover.png',
  exercises: [
    { name: '105 Jumps Warm-Up', type: 'timed', duration: 120, instructions: 'Jump continuously — jumping jacks, high knees, or rope skips.' },
    { name: 'Bicep Curls', reps: 25, sets: 1, weight: 'comfortable weight', rest: 30, instructions: 'Full range, squeeze at top.' },
    { name: 'Lateral Raises', reps: 40, sets: 1, weight: 'comfortable weight', rest: 30, instructions: 'Raise to shoulder height, slow descent.' },
    { name: 'Hammer Curls', reps: 25, sets: 1, weight: 'comfortable weight', rest: 30, instructions: 'Neutral grip, elbows pinned to sides.' },
    { name: 'Dumbbell Ground to Overhead', reps: 25, sets: 1, weight: 'comfortable weight', rest: 30, instructions: 'Squat down, drive up, press overhead.' },
    { name: 'Push-Ups or Diamond Push-Ups', reps: 50, sets: 1, rest: 45, instructions: 'Choose your variation. Chest to floor.' },
    { name: 'Core Circuit Round 1', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 2', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 3', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 4', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 5', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 6', type: 'timed', duration: 36, rest: 15, instructions: '5 squats → 5 hip raises → 5 Russian twists each side.' },
    { name: 'Core Circuit Round 7 + Ab Hold', type: 'timed', duration: 66, rest: 45, instructions: 'Final round: 5 squats → 5 hip raises → 5 Russian twists + 30s ab hold!' },
    { name: 'Squats or Bulgarian Split Squats', reps: 35, sets: 1, weight: 'comfortable weight', rest: 60, instructions: '35 standard squats OR 20 reps Bulgarian split squats each leg.' },
  ]
};

const SEEDED_KEY = 'xfit_workouts_seeded_v3';

export async function seedWorkouts(uid) {
  // Only attempt seeding for the dev account — regular users can't write to /workouts
  const devUid = import.meta.env.VITE_DEV_UID;
  if (!uid || uid !== devUid) return;
  // Only run once per browser session
  if (sessionStorage.getItem(SEEDED_KEY)) return;
  sessionStorage.setItem(SEEDED_KEY, '1');
  try {
    const allWorkouts = [...WORKOUTS, LOCKED_IN];
    for (const w of allWorkouts) {
      const ref = doc(db, 'workouts', w.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, w);
      } else if (w.id === 'locked-in') {
        // Keep the existing workout's content, but sync corrected summary metadata.
        await setDoc(ref, { image_url: w.image_url, duration: w.duration, description: w.description }, { merge: true });
      }
    }
  } catch(e) {
    console.warn('Seed workouts error:', e);
  }
}
