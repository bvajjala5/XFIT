import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, Flame, Target, Award, Zap, Calendar, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { localDateStr, calcStreak } from '@/lib/utils'
import ProgressPhotos from '@/components/shared/ProgressPhotos';

const RANGE_OPTIONS = [
  { key: '1W', days: 7 },
  { key: '1M', days: 30 },
  { key: '3M', days: 90 },
  { key: 'All', days: 365 },
];

const MILESTONES = [
  { id: 'first',   label: 'First Workout', icon: Zap,    threshold: 1 },
  { id: 'streak7', label: '7-Day Streak',  icon: Flame,  threshold: 7,  isStreak: true },
  { id: 'ten',     label: '10 Workouts',   icon: Target, threshold: 10 },
  { id: 'twenty',  label: '20 Workouts',   icon: Award,  threshold: 20 },
  { id: 'fifty',   label: '50 Workouts',   icon: Trophy, threshold: 50 },
];

const TYPE_COLORS = {
  strength: '#60a5fa', hiit: '#f87171', cardio: '#4ade80',
  yoga: '#c084fc', mobility: '#fbbf24', full_body: '#fb923c', other: '#94a3b8',
};

// Build daily data for the area chart — count workouts per day
function buildDailyData(logs, days) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * 86400000);
    const key = localDateStr(d);
    const dayLogs = logs.filter(l => {
      const raw = l.completedAt?.toDate ? l.completedAt.toDate() : new Date(l.completedAt || 0);
      return localDateStr(raw) === key;
    });
    // Label every ~7th day
    const showLabel = i % Math.max(Math.floor(days / 5), 1) === 0;
    return {
      date: key,
      label: showLabel ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '',
      workouts: dayLogs.length,
      calories: dayLogs.reduce((s, l) => s + (l.calories_burned || 0), 0),
      minutes: Math.round(dayLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60),
    };
  });
}

// Build weekly bar data
function buildWeeklyData(logs) {
  const weeks = {};
  logs.forEach(l => {
    const raw = l.completedAt?.toDate ? l.completedAt.toDate() : new Date(l.completedAt || 0);
    const d = new Date(raw);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = localDateStr(weekStart);
    if (!weeks[key]) weeks[key] = { key, workouts: 0, calories: 0, minutes: 0 };
    weeks[key].workouts++;
    weeks[key].calories += l.calories_burned || 0;
    weeks[key].minutes += Math.round((l.duration_seconds || 0) / 60);
  });
  return Object.values(weeks)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-8)
    .map(w => ({
      ...w,
      label: new Date(w.key + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    }));
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-1">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label || payload[0]?.payload?.label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.value} {p.dataKey}
        </p>
      ))}
    </div>
  );
};

export default function Progress() {
  const { user } = useAuth();
  const [range, setRange] = useState('1M');
  const [metric, setMetric] = useState('workouts');

  const { data: logs = [] } = useQuery({
    queryKey: ['workout-logs-progress', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'workouts'), orderBy('completedAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  const streak = calcStreak(logs);
  const days = RANGE_OPTIONS.find(r => r.key === range)?.days || 30;
  const dailyData = buildDailyData(logs, days);
  const weeklyData = buildWeeklyData(logs);

  const totalMins = Math.round(logs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60);
  const totalCals = logs.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const bestWeek = Math.max(...weeklyData.map(w => w.workouts), 0);

  // Type breakdown
  const typeCounts = {};
  logs.forEach(l => {
    const t = l.workout_type || 'other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = Math.max(...typeEntries.map(e => e[1]), 1);

  // Recent workouts
  const recent = logs.slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black">Progress</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your fitness journey at a glance</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Workouts" value={logs.length}  color="text-primary"    icon={Calendar} />
        <StatCard label="Day Streak" value={streak}     color="text-orange-400" icon={Flame}    />
        <StatCard label="Best Week" value={bestWeek}    color="text-green-400"  icon={Trophy}   />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Minutes" value={totalMins}  color="text-blue-400"   icon={Clock}      />
        <StatCard label="Total Calories" value={totalCals} color="text-orange-400" icon={TrendingUp}  />
      </div>

      {/* Progress Photos */}
      <ProgressPhotos userId={user?.uid} />

      {/* Activity chart */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm">Activity</h3>
            <p className="text-[11px] text-muted-foreground">Workouts logged per day</p>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
            {RANGE_OPTIONS.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${range === r.key ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {r.key}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            Complete a workout to see your activity here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="workouts" stroke="hsl(var(--primary))" strokeWidth={2.5}
                fill="url(#actGrad)" dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Weekly Volume</h3>
            <p className="text-[11px] text-muted-foreground">Workouts per week</p>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
            {['workouts', 'calories', 'minutes'].map(m => (
              <button key={m} onClick={() => setMetric(m)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold capitalize transition-all ${metric === m ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {weeklyData.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">
            No data yet — complete some workouts!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Workout type breakdown */}
      {typeEntries.length > 0 && (
        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-sm">Workout Types</h3>
          <div className="space-y-2.5">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">{count} session{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxTypeCount) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[type] || '#94a3b8' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {recent.length > 0 && (
        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-sm">Recent Workouts</h3>
          <div className="space-y-2">
            {recent.map(log => {
              const date = log.completedAt?.toDate ? log.completedAt.toDate() : new Date(log.completedAt || 0);
              return (
                <div key={log.id} className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (TYPE_COLORS[log.workout_type] || '#94a3b8') + '25' }}>
                    <Zap className="w-4 h-4" style={{ color: TYPE_COLORS[log.workout_type] || '#94a3b8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{log.workout_title || 'Workout'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="font-semibold">{Math.round((log.duration_seconds || 0) / 60)} min</p>
                    <p className="text-muted-foreground">{log.calories_burned || 0} cal</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-sm">Milestones</h3>
        <div className="grid grid-cols-5 gap-2">
          {MILESTONES.map((m, i) => {
            const unlocked = m.isStreak ? streak >= m.threshold : logs.length >= m.threshold;
            const MIcon = m.icon;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${unlocked ? 'bg-primary/10' : 'opacity-35'}`}>
                <MIcon className={`w-5 h-5 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-[9px] text-center font-medium leading-tight">{m.label}</p>
                {unlocked && <div className="w-1 h-1 rounded-full bg-primary" />}
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
