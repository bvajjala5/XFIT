import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firestore';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore/lite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Dumbbell, Download, Clock, CheckCircle2, Flag } from 'lucide-react';
import { importWorkout } from '@/lib/shareWorkout';
import { decodeSharedWorkout } from '@/lib/workoutShareLink';
import { toast } from 'sonner';
import { track } from '@/lib/usageAnalytics';

// Fixed buckets only — no free-text report is stored or sent anywhere.
const REPORT_REASONS = ['spam', 'unsafe', 'offensive', 'other'];

export default function Community() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [importing, setImporting] = useState(null);
  const [reportingId, setReportingId] = useState(null);

  const shareToken = searchParams.get('share');
  const sharedLinkWorkout = useMemo(() => {
    if (!shareToken) return null;
    try {
      return { workout: decodeSharedWorkout(shareToken) };
    } catch {
      return { invalid: true };
    }
  }, [shareToken]);

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

  async function handleImport(workout, source) {
    if (!user) return;
    setImporting(workout.id);
    try {
      await importWorkout(user.uid, workout);
      track('custom_workout_imported', { source });
      qc.invalidateQueries({ queryKey: ['custom-workouts', user.uid] });
      toast.success(`"${workout.name}" added to your workouts!`);
    } catch {
      // There is no import-failure event in the allowlist; don't invent one.
      toast.error('Import failed');
    } finally {
      setImporting(null);
    }
  }

  function submitReport(reason) {
    if (!REPORT_REASONS.includes(reason)) return;
    track('community_report_submitted', { reason });
    setReportingId(null);
    toast.success('Thanks — your report was noted.');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Community
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Workouts shared by Uttar Fitness users</p>
      </div>

      {sharedLinkWorkout?.invalid && (
        <div className="bg-card border border-border/60 rounded-2xl p-4 text-sm text-muted-foreground">
          This workout link isn’t valid. Ask the sender to share it again.
        </div>
      )}

      {sharedLinkWorkout?.workout && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/40 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Shared with you</p>
            <p className="font-semibold text-sm truncate mt-0.5">{sharedLinkWorkout.workout.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sharedLinkWorkout.workout.exercises?.length ?? 0} exercises
              {sharedLinkWorkout.workout.estimated_duration ? ` · ${sharedLinkWorkout.workout.estimated_duration} min` : ''}
            </p>
            <button
              onClick={() => handleImport({
                ...sharedLinkWorkout.workout,
                id: sharedLinkWorkout.workout.id || `link_${shareToken.slice(0, 12)}`,
                sharedByName: 'Shared link',
              }, 'link')}
              disabled={importing === sharedLinkWorkout.workout.id || !user}
              className="mt-2 flex items-center gap-1 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-xl hover:bg-primary/25 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {importing === sharedLinkWorkout.workout.id ? '…' : 'Add to my workouts'}
            </button>
          </div>
        </motion.div>
      )}

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
                {reportingId === w.id && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => submitReport(reason)}
                        className="rounded-full border border-border/60 bg-secondary/40 px-2 py-1 text-[10px] font-semibold capitalize text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {alreadyImported ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </div>
                ) : (
                  <button
                    onClick={() => handleImport(w, 'community')}
                    disabled={importing === w.id}
                    className="flex items-center gap-1 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-xl hover:bg-primary/25 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {importing === w.id ? '…' : 'Add'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReportingId(reportingId === w.id ? null : w.id)}
                  aria-label="Report workout"
                  aria-expanded={reportingId === w.id}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
