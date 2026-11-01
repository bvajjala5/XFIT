import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const label = (t = '') => t.replace(/_/g, ' ');

export default function WorkoutCard({ workout, index = 0 }) {
  let minutes = workout.duration;
  try { const saved = localStorage.getItem('xfit_total_duration_' + workout.id); if (saved) minutes = saved; } catch (e) {}
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.3 }}>
      <Link to={`/workouts/${workout.id}`}
        className="block h-full bg-card/75 backdrop-blur-md border border-border/50 rounded-2xl p-4 hover:border-primary/40 transition-colors active:scale-[0.98]">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label(workout.type)}</p>
        <h3 className="font-semibold leading-snug mt-1 line-clamp-2">{workout.title}</h3>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{minutes}m</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{workout.calories_estimate || '—'}</span>
          </div>
        {workout.difficulty && <p className="text-xs text-muted-foreground capitalize mt-1">{workout.difficulty}</p>}
      </Link>
    </motion.div>
  );
}
