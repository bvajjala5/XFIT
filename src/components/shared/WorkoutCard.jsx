import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const label = (t = '') => t.replace(/_/g, ' ');

export default function WorkoutCard({ workout, index = 0, isCustom = false, onDelete, onShare, sharing = false }) {
  const [showMenu, setShowMenu] = useState(false);
  let minutes = workout.duration;
  try { const saved = localStorage.getItem('xfit_total_duration_' + workout.id); if (saved) minutes = saved; } catch {}
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.3 }} className="relative">
      <Link to={`/workouts/${workout.id}`}
        className="card-hover block h-full bg-card/75 backdrop-blur-md border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label(workout.type)}</p>
        <h3 className="font-semibold leading-snug mt-1 line-clamp-2">{workout.title || workout.name}</h3>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{minutes}m</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{workout.calories_estimate || workout.estimated_calories || '—'}</span>
          </div>
        {workout.difficulty && <p className="text-xs text-muted-foreground capitalize mt-1">{workout.difficulty}</p>}
      </Link>

      {isCustom && (
        <div className="absolute top-2 right-2 z-10">
          <Button variant="ghost" size="icon" className="icon-button h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}>
            <MoreVertical className="h-4 w-4" />
          </Button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 mt-1 w-36 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-20"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onShare?.(workout);
                  }}
                  disabled={sharing}
                  className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:bg-secondary disabled:opacity-50"
                >
                  <Share2 className="w-3 h-3" /> {sharing ? 'Sharing…' : 'Share'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete?.(workout);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
