import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BADGE_DEFS = [
  {
    id: 'first_workout',
    label: 'First Step',
    emoji: '🏋️',
    desc: 'Complete your first workout',
    check: ({ logs }) => logs.length >= 1,
  },
  {
    id: 'streak_7',
    label: '7-Day Streak',
    emoji: '🔥',
    desc: 'Work out 7 days in a row',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'streak_30',
    label: '30-Day Streak',
    emoji: '💥',
    desc: 'Work out 30 days in a row',
    check: ({ streak }) => streak >= 30,
  },
  {
    id: 'ten_workouts',
    label: 'Getting Serious',
    emoji: '💪',
    desc: 'Log 10 total workouts',
    check: ({ logs }) => logs.length >= 10,
  },
  {
    id: 'fifty_workouts',
    label: 'Half Century',
    emoji: '🥇',
    desc: 'Log 50 total workouts',
    check: ({ logs }) => logs.length >= 50,
  },
  {
    id: 'hundred_workouts',
    label: 'Centurion',
    emoji: '🏆',
    desc: 'Log 100 total workouts',
    check: ({ logs }) => logs.length >= 100,
  },
  {
    id: 'first_run',
    label: 'Road Runner',
    emoji: '🏃',
    desc: 'Complete your first GPS run',
    check: ({ logs }) => logs.some(l => l.type === 'run' || l.workout_type === 'run'),
  },
  {
    id: 'first_custom',
    label: 'Builder',
    emoji: '🛠️',
    desc: 'Complete a custom-built workout',
    check: ({ logs }) => logs.some(l => l.is_custom || l.workout_category === 'custom'),
  },
  {
    id: 'night_owl',
    label: 'Night Owl',
    emoji: '🦉',
    desc: 'Work out after 10 PM',
    check: ({ logs }) => logs.some(l => {
      const h = new Date(l.completedAt?.toDate?.() || l.completedAt || 0).getHours();
      return h >= 22;
    }),
  },
  {
    id: 'early_bird',
    label: 'Early Bird',
    emoji: '🌅',
    desc: 'Work out before 7 AM',
    check: ({ logs }) => logs.some(l => {
      const h = new Date(l.completedAt?.toDate?.() || l.completedAt || 0).getHours();
      return h >= 1 && h < 7; // exclude midnight edge cases
    }),
  },
];

const STORAGE_KEY = 'xfit_unlocked_badges';

function getStoredBadges() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function storeBadges(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function Badges({ logs = [], streak = 0 }) {
  const ctx = { logs, streak };

  const { unlocked, newlyUnlocked } = useMemo(() => {
    const prev = getStoredBadges();
    const unlocked = new Set();
    BADGE_DEFS.forEach(b => { if (b.check(ctx)) unlocked.add(b.id); });
    const newlyUnlocked = [...unlocked].filter(id => !prev.has(id));
    return { unlocked, newlyUnlocked };
  }, [logs.length, streak]);

  // Persist newly unlocked
  const persistedRef = useRef(false);
  useEffect(() => {
    if (persistedRef.current) return;
    persistedRef.current = true;
    if (unlocked.size > 0) storeBadges(unlocked);
  }, [unlocked]);

  const unlockedCount = unlocked.size;

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Badges</h3>
          <p className="text-[11px] text-muted-foreground">{unlockedCount} / {BADGE_DEFS.length} unlocked</p>
        </div>
        {/* Progress bar */}
        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / BADGE_DEFS.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full primary-gradient rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {BADGE_DEFS.map((badge, i) => {
          const isUnlocked = unlocked.has(badge.id);
          const isNew = newlyUnlocked.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', damping: 14, stiffness: 200 }}
              title={`${badge.label} — ${badge.desc}`}
              className="relative flex flex-col items-center gap-1.5"
            >
              {/* Badge circle */}
              <motion.div
                animate={isNew ? { scale: [1, 1.3, 0.95, 1.05, 1] } : {}}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative
                  ${isUnlocked
                    ? 'bg-primary/15 ring-2 ring-primary/40 shadow-lg shadow-primary/10'
                    : 'bg-secondary/40 grayscale opacity-40'
                  }`}
              >
                {badge.emoji}
                {/* Sparkle ring for newly unlocked */}
                {isNew && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="absolute inset-0 rounded-2xl ring-2 ring-primary"
                  />
                )}
              </motion.div>

              <p className="text-[9px] text-center leading-tight font-medium px-0.5"
                style={{ color: isUnlocked ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                {badge.label}
              </p>

              {isUnlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Newly unlocked toast-style banner */}
      <AnimatePresence>
        {newlyUnlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">{BADGE_DEFS.find(b => b.id === newlyUnlocked[0])?.emoji}</span>
            <div>
              <p className="text-sm font-bold text-primary">
                {newlyUnlocked.length === 1
                  ? `New badge: ${BADGE_DEFS.find(b => b.id === newlyUnlocked[0])?.label}!`
                  : `${newlyUnlocked.length} new badges unlocked!`}
              </p>
              <p className="text-[11px] text-muted-foreground">Keep going 🔥</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
