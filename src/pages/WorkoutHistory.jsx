import { useState } from "react";
import { db } from "@/lib/firestore";
import { collection, getDocs, query, orderBy } from "firebase/firestore/lite";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Clock, Flame, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/shared/GlassCard";
import { Link } from "react-router-dom";

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WorkoutHistory() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["workout-history", user?.uid],
    queryFn: async () => {
      const q = query(collection(db, "users", user.uid, "workouts"), orderBy("completedAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  const filtered = filter === "All" ? logs : logs.filter(l => l.workout_type === filter.toLowerCase());
  const types = ["All", ...new Set(logs.map(l => l.workout_type).filter(Boolean).map(t => t.charAt(0).toUpperCase() + t.slice(1)))];

  const grouped = filtered.reduce((acc, log) => {
    const date = log.completedAt?.toDate ? log.completedAt.toDate().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto pb-28 px-4 pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-primary" /></div>
        <div><h1 className="text-xl font-black">Workout History</h1><p className="text-xs text-muted-foreground">{isLoading ? 'Loading workouts…' : `${logs.length} workouts completed`}</p></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`pill-button flex-shrink-0 text-xs ${filter === t ? "border-primary/30 bg-primary/20 text-primary hover:text-primary" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <GlassCard className="py-12" aria-label="Loading workout history">
          <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-secondary/60" />
          <div className="mx-auto mt-3 h-3 w-24 animate-pulse rounded-full bg-secondary/40" />
          <span className="sr-only">Loading workout history…</span>
        </GlassCard>
      ) : Object.entries(grouped).length === 0 && (
        <GlassCard className="text-center py-12">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No workouts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Complete a workout to see it here!</p>
          <Link to="/workouts" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">Browse Workouts</Link>
        </GlassCard>
      )}

      {Object.entries(grouped).map(([date, dayLogs]) => (
        <div key={date} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{date}</p>
          {dayLogs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="flex items-center gap-3 transition-colors hover:border-primary/30 hover:bg-secondary/30">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{log.workout_title || "Workout"}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{formatDuration(log.duration_seconds || 0)}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="w-3 h-3 text-orange-400" />{log.calories_burned || 0} cal</span>
                    {log.exercises_completed && <span className="text-xs text-muted-foreground">{log.exercises_completed} exercises</span>}
                  </div>
                </div>
                {log.workout_type && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground flex-shrink-0 capitalize">{log.workout_type}</span>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}