import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Dumbbell, Download, Clock, CheckCircle2 } from 'lucide-react';
import { importWorkout } from '@/lib/shareWorkout';
import { toast } from 'sonner';

export default function Community() {
  const { user, userDoc } = useAuth();
  const qc = useQueryClient();
  const [importing, setImporting] = useState(null);

  const { data: sharedWorkouts = [], isLoading } = useQuery({
    queryKey: ['shared-workouts'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'sharedWorkouts'), orderBy('sharedAt', 'desc'), limit(50))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
  });

  const { data: myImports = [] } = useQuery({
    queryKey: ['custom-workouts', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(collection(db, 'users', user.uid, 'customWorkouts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  const importedIds = new Set(myImports.map(w => w.importedFrom).filter(Boolean));

  async function handleImport(workout) {
    if (!user) return;
    setImporting(workout.id);
    try {
      await importWorkout(user.uid, workout);
      qc.invalidateQueries({ queryKey: ['custom-workouts', user.uid] });
      toast.success(`"${workout.name}" added to your workouts!`);
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Community
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Workouts shared by XFit users</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse bg-card rounded-2xl border border-border/60" />
          ))}
        </div>
      )}

      {!isLoading && sharedWorkouts.length === 0 && (
        <div className="bg-card border border-border/60 rounded-3xl p-8 text-center space-y-2">
          <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="font-semibold text-sm">No workouts shared yet</p>
          <p className="text-xs text-muted-foreground">Build a custom workout and share it with the community!</p>
        </div>
      )}

      <div className="space-y-3">
        {sharedWorkouts.map((w, i) => {
          const alreadyImported = importedIds.has(w.id) || w.sharedBy === user?.uid;
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{w.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  by {w.sharedByName} · {w.exercises?.length ?? 0} exercises
                </p>
                <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  {w.estimated_duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {w.estimated_duration} min
                    </span>
                  )}
                  {w.importCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" /> {w.importCount}
                    </span>
                  )}
                </div>
              </div>
              {alreadyImported ? (
                <div className="flex items-center gap-1 text-green-400 text-xs font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </div>
              ) : (
                <button
                  onClick={() => handleImport(w)}
                  disabled={importing === w.id}
                  className="flex items-center gap-1 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-xl hover:bg-primary/25 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  {importing === w.id ? '…' : 'Add'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
