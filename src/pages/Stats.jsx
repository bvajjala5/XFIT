import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, Flame, Calendar, Clock, TrendingUp, Zap, Award, Target, Plus, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { localDateStr, calcStreak } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import Badges from '@/components/shared/Badges';
import RankBadge, { getRank, RANKS } from '@/components/shared/RankBadge';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// ── RANGE OPTIONS ─────────────────────────────────────────────────────────
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

const LEADERBOARD_TABS = [
  { key: 'streaks', label: 'Streaks', icon: Flame },
  { key: 'weekly',  label: 'This Week', icon: Zap },
  { key: 'alltime', label: 'All Time', icon: Trophy },
];

function buildDailyData(logs, days) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * 86400000);
    const key = localDateStr(d);
    const dayLogs = logs.filter(l => {
      const raw = l.completedAt?.toDate ? l.completedAt.toDate() : new Date(l.completedAt || 0);
      return localDateStr(raw) === key;
    });
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
    .map(w => ({ ...w, label: new Date(w.key + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) }));
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{payload[0]?.payload?.label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>{p.value} {p.dataKey}</p>
      ))}
    </div>
  );
};

export default function Stats() {
  const { user, userData } = useAuth();
  const [range, setRange] = useState('1M');
  const [metric, setMetric] = useState('workouts');
  const [lbTab, setLbTab] = useState('streaks');
  const [rankUpBanner, setRankUpBanner] = useState(null);
  const queryClient = useQueryClient();
  const isDev = user?.uid === import.meta.env.VITE_DEV_UID;

  const { data: logs = [] } = useQuery({
    queryKey: ['workout-logs-stats', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'workouts'), orderBy('completedAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user,
  });

  const { data: allEntries = [], isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard-entries'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'leaderboard'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch { return []; }
    },
  });

  const streak = calcStreak(logs);
  const days = RANGE_OPTIONS.find(r => r.key === range)?.days || 30;
  const dailyData = buildDailyData(logs, days);
  const weeklyData = buildWeeklyData(logs);
  const totalMins = Math.round(logs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60);
  const totalCals = logs.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const bestWeek = Math.max(...weeklyData.map(w => w.workouts), 0);

  const typeCounts = {};
  logs.forEach(l => { const t = l.workout_type || 'other'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = Math.max(...typeEntries.map(e => e[1]), 1);

  const myEntry = allEntries.find(e => e.id === user?.uid);
  const getDisplayName = () => userData?.full_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Athlete';

  const sorted = [...allEntries].sort((a, b) =>
    lbTab === 'streaks' ? (b.streak||0)-(a.streak||0) :
    lbTab === 'weekly'  ? (b.weeklyWorkouts||0)-(a.weeklyWorkouts||0) :
                          (b.totalWorkouts||0)-(a.totalWorkouts||0)
  );

  const ensureEntry = async () => {
    const ref = doc(db, 'leaderboard', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { displayName: getDisplayName(), email: user.email, streak: 0, totalWorkouts: 0, weeklyWorkouts: 0, updatedAt: new Date() });
    }
    return ref;
  };

  const addDevWorkout = async () => {
    try {
      const ref = await ensureEntry();
      const snap = await getDoc(ref);
      const cur = snap.data()?.totalWorkouts || 0;
      const next = cur + 1;
      if (getRank(next) !== getRank(cur)) {
        setRankUpBanner({ ...RANKS[getRank(next)] });
        setTimeout(() => setRankUpBanner(null), 4000);
      }
      await updateDoc(ref, { totalWorkouts: increment(1), weeklyWorkouts: increment(1) });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-entries'] });
    } catch (err) { console.error(err); }
  };

  const addDevStreak = async () => {
    try {
      const ref = await ensureEntry();
      await updateDoc(ref, { streak: increment(1) });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-entries'] });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-7 pb-28 space-y-6">

      {/* Rank-up banner */}
      {rankUpBanner && (
        <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card border border-yellow-400/40 rounded-3xl px-10 py-8 shadow-2xl text-center">
            <div className="text-6xl mb-3">{rankUpBanner.emoji}</div>
            <div className="text-2xl font-black text-yellow-400">RANK UP!</div>
            <div className="text-lg font-bold mt-1">{rankUpBanner.label}</div>
          </div>
        </motion.div>
      )}

      {/* ── LEADERBOARD SECTION ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400"/> Ranks & Stats</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your performance at a glance</p>
        </div>
        {isDev && (
          <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Wrench className="w-2.5 h-2.5"/> Dev</p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" className="rounded-lg text-[10px] h-7 px-2" onClick={addDevWorkout}><Plus className="w-2.5 h-2.5 mr-1"/>Workout</Button>
              <Button size="sm" variant="secondary" className="rounded-lg text-[10px] h-7 px-2" onClick={addDevStreak}><Plus className="w-2.5 h-2.5 mr-1"/>Streak ({myEntry?.streak||0})</Button>
            </div>
          </div>
        )}
      </div>

      {/* My rank card */}
      {myEntry && (
        <GlassCard className="flex items-center gap-4 border border-primary/30 bg-primary/5">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">{RANKS[getRank(myEntry.totalWorkouts||0)]?.emoji}</div>
          <div className="flex-1">
            <p className="font-bold">{getDisplayName()} <span className="text-primary text-xs">(You)</span></p>
            <div className="flex items-center gap-3 mt-0.5">
              <RankBadge rank={getRank(myEntry.totalWorkouts||0)}/>
              <span className="text-xs text-muted-foreground">{myEntry.streak||0} day streak</span>
              <span className="text-xs text-muted-foreground">{myEntry.totalWorkouts||0} workouts</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Leaderboard tabs */}
      <div className="flex gap-2">
        {LEADERBOARD_TABS.map(t => (
          <Button key={t.key} size="sm" variant={lbTab===t.key?'default':'secondary'} className="rounded-full text-xs flex-1 gap-1" onClick={()=>setLbTab(t.key)}>
            <t.icon className="w-3 h-3"/>{t.label}
          </Button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {!lbLoading && sorted.length === 0 && (
          <GlassCard className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30"/>
            <p className="text-sm">Complete a workout to appear here!</p>
          </GlassCard>
        )}
        {sorted.map((entry, i) => {
          const isMe = entry.id === user?.uid;
          const val = lbTab==='streaks'?(entry.streak||0):lbTab==='weekly'?(entry.weeklyWorkouts||0):(entry.totalWorkouts||0);
          const lbl = lbTab==='streaks'?'day streak':lbTab==='weekly'?'this week':'total';
          const rank = getRank(entry.totalWorkouts||0);
          return (
            <motion.div key={entry.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
              <GlassCard className={`flex items-center gap-3 py-3 px-4 ${isMe?'border border-primary/50 bg-primary/5':''}`}>
                <div className={`text-base font-black w-6 text-center ${['text-yellow-400','text-slate-300','text-amber-600'][i]||'text-muted-foreground'}`}>
                  {i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">{RANKS[rank]?.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm truncate ${isMe?'text-primary':''}`}>{entry.displayName||'Athlete'}{isMe?' (You)':''}</span>
                    <RankBadge rank={rank}/>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{entry.totalWorkouts||0} workouts total</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-black ${lbTab==='streaks'?'text-orange-400':'text-primary'}`}>{val}</div>
                  <div className="text-[9px] text-muted-foreground">{lbl}</div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-border/40"/>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Your Progress</span>
        <div className="flex-1 h-px bg-border/40"/>
      </div>

      {/* ── PROGRESS SECTION ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Workouts', value: logs.length,  color: 'text-primary',    icon: Calendar },
          { label: 'Streak',   value: streak,        color: 'text-orange-400', icon: Flame    },
          { label: 'Best Week',value: bestWeek,      color: 'text-green-400',  icon: Trophy   },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-1">
            <Icon className={`w-4 h-4 ${color} mb-1`} />
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Minutes',  value: totalMins,  color: 'text-blue-400',   icon: Clock      },
          { label: 'Total Calories', value: totalCals,  color: 'text-orange-400', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-1">
            <Icon className={`w-4 h-4 ${color} mb-1`} />
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm">Activity</h3>
            <p className="text-[11px] text-muted-foreground">Workouts per day</p>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
            {RANGE_OPTIONS.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${range===r.key?'bg-primary text-white':'text-muted-foreground hover:text-foreground'}`}>
                {r.key}
              </button>
            ))}
          </div>
        </div>
        {logs.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Complete a workout to see your activity here</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="workouts" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#actGrad)" dot={false} activeDot={{r:5,fill:'hsl(var(--primary))',strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly chart */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm">Weekly Volume</h3>
            <p className="text-[11px] text-muted-foreground">Workouts per week</p>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
            {['workouts','calories','minutes'].map(m => (
              <button key={m} onClick={() => setMetric(m)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold capitalize transition-all ${metric===m?'bg-primary text-white':'text-muted-foreground hover:text-foreground'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {weeklyData.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No data yet!</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{top:4,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[6,6,0,0]} maxBarSize={40}/>
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
                  <span className="capitalize font-medium">{type.replace('_',' ')}</span>
                  <span className="text-muted-foreground">{count} session{count!==1?'s':''}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{width:0}} animate={{width:`${(count/maxTypeCount)*100}%`}}
                    transition={{duration:0.8,ease:'easeOut'}} className="h-full rounded-full"
                    style={{backgroundColor:TYPE_COLORS[type]||'#94a3b8'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {logs.slice(0,5).length > 0 && (
        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-sm">Recent Workouts</h3>
          <div className="space-y-2">
            {logs.slice(0,5).map(log => {
              const date = log.completedAt?.toDate ? log.completedAt.toDate() : new Date(log.completedAt||0);
              return (
                <div key={log.id} className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{backgroundColor:(TYPE_COLORS[log.workout_type]||'#94a3b8')+'25'}}>
                    <Zap className="w-4 h-4" style={{color:TYPE_COLORS[log.workout_type]||'#94a3b8'}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{log.workout_title||'Workout'}</p>
                    <p className="text-[11px] text-muted-foreground">{date.toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="font-semibold">{Math.round((log.duration_seconds||0)/60)} min</p>
                    <p className="text-muted-foreground">{log.calories_burned||0} cal</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges */}
      <Badges logs={logs} streak={streak} />
    </div>
  );
}
