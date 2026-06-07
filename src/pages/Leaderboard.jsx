import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import RankBadge, { getRank, RANKS } from '@/components/shared/RankBadge';
import { Trophy, Flame, Dumbbell, Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { key: 'streaks', label: 'Streaks', icon: Flame },
  { key: 'weekly', label: 'This Week', icon: Dumbbell },
  { key: 'alltime', label: 'All Time', icon: Trophy },
];

export default function Leaderboard() {
  const [tab, setTab] = useState('streaks');
  const [rankUpBanner, setRankUpBanner] = useState(null);
  const { user, userData } = useAuth();
  const queryClient = useQueryClient();
  const isDev = user?.uid === import.meta.env.VITE_DEV_UID;

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['leaderboard-entries'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'leaderboard'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        return [];
      }
    },
    retry: 1,
  });

  // Real workout count — source of truth for rank display
  const { data: actualWorkoutCount = null } = useQuery({
    queryKey: ['actual-workout-count', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const snap = await getDocs(collection(db, 'users', user.uid, 'workouts'));
      return snap.size;
    },
    enabled: !!user,
  });

  const myEntry = allEntries.find(e => e.id === user?.uid);
  const myTotalWorkouts = actualWorkoutCount ?? (myEntry?.totalWorkouts || 0);

  // Sync leaderboard totalWorkouts when actual count differs (onSuccess removed in TQ v5)
  useEffect(() => {
    if (actualWorkoutCount === null || !user) return;
    const stored = myEntry?.totalWorkouts ?? -1;
    if (stored === actualWorkoutCount) return;
    const lbRef = doc(db, 'leaderboard', user.uid);
    const displayName = userData?.full_name?.split(' ')[0] || user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Athlete';
    (async () => {
      try {
        const snap = await getDoc(lbRef);
        if (snap.exists()) {
          await updateDoc(lbRef, { totalWorkouts: actualWorkoutCount, rank: getRank(actualWorkoutCount), updatedAt: new Date() });
        } else {
          await setDoc(lbRef, { displayName, email: user.email, totalWorkouts: actualWorkoutCount, weeklyWorkouts: 0, streak: 0, rank: getRank(actualWorkoutCount), updatedAt: new Date() });
        }
        queryClient.invalidateQueries({ queryKey: ['leaderboard-entries'] });
      } catch (e) { console.error('lb sync error', e); }
    })();
  }, [actualWorkoutCount, user?.uid]);
  const getDisplayName = () =>
    userData?.full_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  const ensureEntry = async () => {
    const entryRef = doc(db, 'leaderboard', user.uid);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      await setDoc(entryRef, { displayName: getDisplayName(), email: user.email, streak: 0, totalWorkouts: 0, weeklyWorkouts: 0, updatedAt: new Date() });
    }
    return entryRef;
  };

  const addDevWorkout = async () => {
    try {
      const ref = await ensureEntry();
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

  const sorted = [...allEntries].sort((a, b) =>
    tab === 'streaks' ? (b.streak||0)-(a.streak||0) :
    tab === 'weekly'  ? (b.weeklyWorkouts||0)-(a.weeklyWorkouts||0) :
                        (b.totalWorkouts||0)-(a.totalWorkouts||0)
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-24">
      <AnimatePresence>
        {rankUpBanner && (
          <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-card border border-yellow-400/40 rounded-3xl px-10 py-8 shadow-2xl text-center">
              <div className="text-6xl mb-3">{rankUpBanner.emoji}</div>
              <div className="text-2xl font-black text-yellow-400">RANK UP!</div>
              <div className="text-lg font-bold mt-1">{rankUpBanner.label}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-400"/> Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">See how you stack up</p>
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

      {(myEntry || user) && (
        <GlassCard className="flex items-center gap-4 border border-primary/30 bg-primary/5">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">{RANKS[getRank(myTotalWorkouts)]?.emoji}</div>
          <div className="flex-1">
            <p className="font-bold">{getDisplayName()} <span className="text-primary text-xs">(You)</span></p>
            <div className="flex items-center gap-3 mt-0.5">
              <RankBadge rank={getRank(myTotalWorkouts)}/>
              <span className="text-xs text-muted-foreground">{myEntry?.streak||0} day streak</span>
              <span className="text-xs text-muted-foreground">{myTotalWorkouts} workouts</span>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex gap-2">
        {TABS.map(t => (
          <Button key={t.key} size="sm" variant={tab===t.key?'default':'secondary'} className="rounded-full text-xs flex-1 gap-1" onClick={()=>setTab(t.key)}>
            <t.icon className="w-3 h-3"/>{t.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <GlassCard className="text-center py-8 text-muted-foreground text-sm">Loading...</GlassCard>}
        {!isLoading && sorted.length === 0 && (
          <GlassCard className="text-center py-12 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No entries yet</p>
            <p className="text-xs mt-1">Complete a workout to appear on the leaderboard!</p>
          </GlassCard>
        )}
        {sorted.map((entry, i) => {
          const isMe = entry.id === user?.uid;
          const val = tab==='streaks'?(entry.streak||0):tab==='weekly'?(entry.weeklyWorkouts||0):(entry.totalWorkouts||0);
          const lbl = tab==='streaks'?'day streak':tab==='weekly'?'this week':'total';
          const rank = getRank(isMe ? myTotalWorkouts : (entry.totalWorkouts||0));
          return (
            <motion.div key={entry.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
              <GlassCard className={`flex items-center gap-3 py-3 px-4 ${isMe?'border border-primary/50 bg-primary/5':''}`}>
                <div className={`text-base font-black w-6 text-center ${['text-yellow-400','text-slate-300','text-amber-600'][i]||'text-muted-foreground'}`}>
                  {i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                  {RANKS[rank]?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm truncate ${isMe?'text-primary':''}`}>{entry.displayName||'Athlete'}{isMe?' (You)':''}</span>
                    <RankBadge rank={rank}/>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{entry.totalWorkouts||0} workouts total</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-black ${tab==='streaks'?'text-orange-400':'text-primary'}`}>{val}</div>
                  <div className="text-[9px] text-muted-foreground">{lbl}</div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
