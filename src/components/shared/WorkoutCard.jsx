import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const typeColors = {
  hiit: 'bg-red-500/20 text-red-300',
  yoga: 'bg-purple-500/20 text-purple-300',
  strength: 'bg-blue-500/20 text-blue-300',
  cardio: 'bg-green-500/20 text-green-300',
  mobility: 'bg-amber-500/20 text-amber-300',
  full_body: 'bg-pink-500/20 text-pink-300',
};

export default function WorkoutCard({ workout, index = 0 }) {
  const color = typeColors[workout.type] || 'bg-primary/20 text-primary';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link to={`/workouts/${workout.id}`} className="block group">
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-border transition-all duration-200 active:scale-[0.98]">
          {/* Image */}
          <div className="relative h-36 overflow-hidden">
            <img
              src={workout.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80'}
              alt={workout.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Type badge */}
            <div className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${color} backdrop-blur-sm`}>
              {workout.type?.replace('_', ' ')}
            </div>
            {workout.trainer === 'Bhanu Vajjala' && (
              <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 backdrop-blur-sm">
                👑 Signature
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-3">
            <h3 className="font-bold text-sm leading-tight truncate">{workout.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{workout.trainer}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{(() => {
                try {
                  const stored = localStorage.getItem('xfit_durations_' + workout.id);
                  if (stored) {
                    const d = JSON.parse(stored);
                    const total = Object.values(d).reduce((s,v) => s+(Number(v)||0), 0);
                    if (total > 60) return Math.round(total/60) + 'm';
                  }
                } catch(e) {}
                return workout.duration + 'm';
              })()}</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{workout.calories_estimate || '—'}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
