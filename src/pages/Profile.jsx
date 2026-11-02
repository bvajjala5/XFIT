import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import { User, LogOut, Dumbbell, Clock, Flame, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react';

const GOAL_CATEGORIES = [
  { key: 'workout', label: 'Workout Goals', goals: [{ id: 'workouts_per_week', label: 'Workouts per week', unit: 'days/week', default: 3 }, { id: 'mins_per_session', label: 'Minutes per session', unit: 'min', default: 30 }, { id: 'weekly_minutes', label: 'Total weekly minutes', unit: 'min/week', default: 150 }] },
  { key: 'nutrition', label: 'Nutrition Goals', goals: [{ id: 'daily_calories', label: 'Daily calories', unit: 'cal', default: 2200 }, { id: 'daily_protein', label: 'Daily protein', unit: 'g', default: 150 }, { id: 'daily_water', label: 'Daily water', unit: 'glasses', default: 8 }] },
  { key: 'sleep', label: 'Sleep Goals', goals: [{ id: 'sleep_hours', label: 'Sleep duration', unit: 'hrs/night', default: 8 }] },
  { key: 'activity', label: 'Activity Goals', goals: [{ id: 'daily_steps', label: 'Daily steps', unit: 'steps', default: 10000 }] }
];

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('xfit-theme') || 'dark');
  const [goalExpanded, setGoalExpanded] = useState({ workout: true, nutrition: false, sleep: false, activity: false });
  const [goalData, setGoalData] = useState({});

  useEffect(() => {
    if (userData) {
      const saved = userData.goals || {};
      const result = {};
      GOAL_CATEGORIES.forEach(cat => cat.goals.forEach(g => { result[g.id] = saved[g.id] || { current: g.default }; }));
      setGoalData(result);
    }
  }, [userData]);

  const { data: logs = [] } = useQuery({
    queryKey: ['workout-logs-profile', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'workouts'), orderBy('completedAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user
  });

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('xfit-theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6 text-foreground">
      {/* Profile Header */}
      <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userData?.name || user?.displayName || 'User'}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => logout()} className="flex items-center gap-2 text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-xl hover:bg-destructive/20 transition">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </GlassCard>

      {/* Main Stats Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Dumbbell /></div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Workouts</p>
            <p className="text-2xl font-bold">{totalWorkouts}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-chart-1/10 rounded-xl text-chart-1"><Clock /></div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Minutes</p>
            <p className="text-2xl font-bold">{totalMinutes}m</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-chart-2/10 rounded-xl text-chart-2"><Flame /></div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Primary Goal</p>
            <p className="text-xl font-bold capitalize">{userData?.fitness_goal?.replace('_', ' ') || 'Build Muscle'}</p>
          </div>
        </GlassCard>
      </div>

      {/* Goals Section Accordion Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Your Target Goals</h2>
        {GOAL_CATEGORIES.map(cat => (
          <GlassCard key={cat.key} className="overflow-hidden">
            <button
              onClick={() => setGoalExpanded(p => ({ ...p, [cat.key]: !p[cat.key] }))}
              className="w-full p-4 flex items-center justify-between font-semibold border-b border-border/50 hover:bg-secondary/20 transition"
            >
              <span>{cat.label}</span>
              {goalExpanded[cat.key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {goalExpanded[cat.key] && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/5">
                {cat.goals.map(g => (
                  <div key={g.id} className="p-3 bg-background/40 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{g.label}</p>
                    <p className="text-lg font-bold text-foreground">
                      {goalData[g.id]?.current || g.default} <span className="text-xs font-normal text-muted-foreground">{g.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
