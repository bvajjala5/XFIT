import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { collection, collectionGroup, getDocs, deleteDoc, doc, query, orderBy, setDoc, where } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { applyTheme } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/shared/GlassCard';
import RankBadge, { getRank } from '@/components/shared/RankBadge';
import { User, LogOut, Settings, Dumbbell, Clock, Flame, Trash2, Sun, Moon, ChevronDown, ChevronUp, Pencil, Check, X, Palette} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { calcStreak, localDateStr } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const goalLabels = {lose_weight:'Lose Weight',build_muscle:'Build Muscle',improve_endurance:'Improve Endurance',flexibility:'Flexibility'};

const GOAL_CATEGORIES = [
  {key:'workout',label:'💪 Workout Goals',goals:[{id:'workouts_per_week',label:'Workouts per week',unit:'days/week',default:3},{id:'mins_per_session',label:'Minutes per session',unit:'min',default:30},{id:'weekly_minutes',label:'Total weekly minutes',unit:'min/week',default:150}]},
  {key:'nutrition',label:'🥗 Nutrition Goals',goals:[{id:'daily_calories',label:'Daily calories',unit:'cal',default:2200},{id:'daily_protein',label:'Daily protein',unit:'g',default:150},{id:'daily_water',label:'Daily water',unit:'glasses',default:8}]},
  {key:'sleep',label:'😴 Sleep Goals',goals:[{id:'sleep_hours',label:'Sleep duration',unit:'hrs/night',default:8},{id:'bedtime',label:'Target bedtime',unit:'PM',default:'10:30'},{id:'wake_time',label:'Target wake time',unit:'AM',default:'6:30'}]},
  {key:'activity',label:'🏃 Activity Goals',goals:[{id:'daily_steps',label:'Daily steps',unit:'steps',default:10000},{id:'weekly_distance',label:'Weekly distance',unit:'miles',default:15},{id:'active_calories',label:'Active calories/day',unit:'cal',default:500}]},
];

export default function Profile() {
  const { user, userData, updateUserData, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('xfit-theme') || 'auto');
  const [lbPrivacy, setLbPrivacy] = useState({ joined: true, name: null });
  const [lbNameInput, setLbNameInput] = useState('');
  const saveLbPrivacy = async (update) => {
    const next = { ...lbPrivacy, ...update };
    setLbPrivacy(next);
    localStorage.setItem('xfit_lb_privacy', JSON.stringify(next));
    // Save to Firestore so it's user-specific
    await updateUserData({ lbPrivacy: next });
    // Sync with Firestore
    if (user) {
      const lbRef = doc(db, 'leaderboard', user.uid);
      if (next.joined === false) {
        // Remove from leaderboard
        try { await deleteDoc(lbRef); } catch(e) {}
      } else if (next.name !== undefined) {
        // Update display name
        try { await setDoc(lbRef, { displayName: next.name || user.displayName?.split(' ')[0] || 'Athlete' }, { merge: true }); } catch(e) {}
      }
    }
  };
  const [recentOpen, setRecentOpen] = useState(false);
  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [goalExpanded, setGoalExpanded] = useState({workout:false,nutrition:false,sleep:false,activity:false});
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalVal, setEditGoalVal] = useState('');
  const [goalData, setGoalData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userData) {
      setForm({fitness_goal:userData.fitness_goal||'',experience_level:userData.experience_level||'',preferred_types:userData.preferred_types||[],distance_unit:userData.distance_unit||'miles'});
      // Load leaderboard privacy from Firestore (user-specific)
      if (userData.lbPrivacy) {
        setLbPrivacy(userData.lbPrivacy);
        setLbNameInput(userData.lbPrivacy.name || '');
        localStorage.setItem('xfit_lb_privacy', JSON.stringify(userData.lbPrivacy));
      }
      const saved = userData.goals||{};
      const result = {};
      GOAL_CATEGORIES.forEach(cat=>cat.goals.forEach(g=>{result[g.id]=saved[g.id]||{current:g.default,history:[]}}));
      setGoalData(result);
    }
  }, [userData]);

  const { data: logs=[] } = useQuery({
    queryKey: ['workout-logs-profile', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db,'users',user.uid,'workouts'),orderBy('completedAt','desc')));
      return snap.docs.map(d=>({id:d.id,...d.data()}));
    },
    enabled: !!user
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['following-count', user?.uid],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'following'));
      return snap.size;
    },
    enabled: !!user,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ['follower-count', user?.uid],
    queryFn: async () => {
      // Query all users' 'following' subcollections for docs where uid == this user
      // (each following doc has uid = the person being followed)
      const snap = await getDocs(query(collectionGroup(db, 'following'), where('uid', '==', user.uid)));
      return snap.size;
    },
    enabled: !!user,
  });

  const toggleTheme = () => {
    const next = theme==='dark'?'light':'dark';
    setTheme(next);
    localStorage.setItem('xfit-theme',next);
    document.documentElement.classList.remove('dark','light');
    document.documentElement.classList.add(next);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateUserData(form);
    setSaving(false);
    setEditing(false);
  };

  const saveGoal = async (id, newVal) => {
    const prev = goalData[id]?.current;
    const history = [...(goalData[id]?.history||[]),{value:prev,updatedAt:new Date().toISOString()}];
    const updated = {...goalData,[id]:{current:newVal,history}};
    setGoalData(updated);
    setEditingGoal(null);
    await updateUserData({goals:updated});
    // Sync to localStorage so WaterTracker, MealTracker, HealthHub pick up changes
    const v = Number(newVal);
    if (id === 'daily_water') localStorage.setItem('xfit_water_goal', String(v));
    if (id === 'daily_steps') localStorage.setItem('xfit_steps_goal', String(v));
    if (id === 'workouts_per_week') localStorage.setItem('xfit_goals_workouts_per_week', String(v));
    if (id === 'active_calories') localStorage.setItem('xfit_goals_weekly_calories', String(v * 7));
    if (id === 'weekly_minutes') localStorage.setItem('xfit_goals_weekly_minutes', String(v));
    if (id === 'mins_per_session') localStorage.setItem('xfit_goals_mins_per_session', String(v));
    if (id === 'sleep_hours') localStorage.setItem('xfit_sleep_goal', String(v));
    if (id === 'active_calories') localStorage.setItem('xfit_calories_goal', String(v));
    if (['daily_calories','daily_protein','daily_carbs','daily_fat'].includes(id)) {
      const ng = JSON.parse(localStorage.getItem('xfit_nutrition_goals') || '{"calories":2000,"protein":150,"carbs":250,"fat":65}');
      const km = {daily_calories:'calories',daily_protein:'protein',daily_carbs:'carbs',daily_fat:'fat'};
      ng[km[id]] = v;
      localStorage.setItem('xfit_nutrition_goals', JSON.stringify(ng));
      window.dispatchEvent(new Event('storage'));
    }
    if (id === 'daily_water') window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const colls = ['workouts','customWorkouts','goals','healthLogs','messages','schedule','foodLogs','runs','journal','preferences'];
      for (const c of colls) { const snap = await getDocs(collection(db,'users',user.uid,c)); for (const d of snap.docs) await deleteDoc(d.ref); }
      await deleteDoc(doc(db,'users',user.uid));
      await deleteUser(auth.currentUser);
    } catch(e) { await logout(); }
  };

  const streak = calcStreak(logs);
  const rank = getRank(logs.length);
  const totalMins = Math.round(logs.reduce((s,l)=>s+(l.duration_seconds||0),0)/60);
  const totalCals = logs.reduce((s,l)=>s+(l.calories_burned||0),0);

  function getTrend(current, prev) {
    if (prev==null) return null;
    const c=parseFloat(current), p=parseFloat(prev);
    if (c>p) return 'up'; if (c<p) return 'down'; return 'same';
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto overflow-hidden">
          {userData?.profile_picture ? <img src={userData.profile_picture} alt="Profile" className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-primary"/>}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{userData?.full_name||'Athlete'}</h1>
          <p className="text-sm text-muted-foreground">{userData?.email}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            <span className="font-semibold text-foreground">{followingCount}</span> Following
            <span className="mx-2 opacity-40">·</span>
            <span className="font-semibold text-foreground">{followerCount}</span> Followers
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {userData?.fitness_goal && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">{goalLabels[userData.fitness_goal]||userData.fitness_goal}</span>}
          {userData?.experience_level && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full capitalize">{userData.experience_level}</span>}
          <RankBadge rank={rank}/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="text-center"><Dumbbell className="w-4 h-4 text-primary mx-auto mb-1"/><div className="text-xl font-bold">{logs.length}</div><div className="text-[10px] text-muted-foreground">Workouts</div></GlassCard>
        <GlassCard className="text-center"><Clock className="w-4 h-4 text-green-400 mx-auto mb-1"/><div className="text-xl font-bold">{totalMins}</div><div className="text-[10px] text-muted-foreground">Minutes</div></GlassCard>
        <GlassCard className="text-center"><Flame className="w-4 h-4 text-orange-400 mx-auto mb-1"/><div className="text-xl font-bold">{totalCals}</div><div className="text-[10px] text-muted-foreground">Calories</div></GlassCard>
      </div>
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4"/> Profile Settings</h2>
          {!editing && <Button variant="secondary" size="sm" className="rounded-full text-xs" onClick={()=>setEditing(true)}>Edit</Button>}
        </div>
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2"><span className="text-sm font-medium">Fitness Goal</span><Select value={form.fitness_goal} onValueChange={v=>setForm({...form,fitness_goal:v})}><SelectTrigger className="rounded-xl bg-secondary/50 border-0"><SelectValue placeholder="Select goal"/></SelectTrigger><SelectContent><SelectItem value="lose_weight">Lose Weight</SelectItem><SelectItem value="build_muscle">Build Muscle</SelectItem><SelectItem value="improve_endurance">Improve Endurance</SelectItem><SelectItem value="flexibility">Flexibility</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><span className="text-sm font-medium">Experience Level</span><Select value={form.experience_level} onValueChange={v=>setForm({...form,experience_level:v})}><SelectTrigger className="rounded-xl bg-secondary/50 border-0"><SelectValue placeholder="Select level"/></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><span className="text-sm font-medium">Distance Unit</span><Select value={form.distance_unit} onValueChange={v=>setForm({...form,distance_unit:v})}><SelectTrigger className="rounded-xl bg-secondary/50 border-0"><SelectValue placeholder="Select unit"/></SelectTrigger><SelectContent><SelectItem value="miles">Miles</SelectItem><SelectItem value="kilometers">Kilometers</SelectItem><SelectItem value="meters">Meters</SelectItem></SelectContent></Select></div>
            <div className="flex gap-2"><Button className="flex-1 rounded-xl" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save Changes'}</Button><Button variant="secondary" className="rounded-xl" onClick={()=>setEditing(false)}>Cancel</Button></div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="capitalize">{goalLabels[userData?.fitness_goal]||'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="capitalize">{userData?.experience_level||'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Preferred</span><span className="capitalize">{(userData?.preferred_types||[]).join(', ')||'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Distance Unit</span><span className="capitalize">{userData?.distance_unit||'miles'}</span></div>
          </div>
        )}
      </GlassCard>
      <GlassCard className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">🎯 My Goals</h2>
        {GOAL_CATEGORIES.map(cat=>(
          <div key={cat.key}>
            <button className="w-full flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={()=>setGoalExpanded(e=>({...e,[cat.key]:!e[cat.key]}))}>
              <span>{cat.label}</span>{goalExpanded[cat.key]?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
            </button>
            {goalExpanded[cat.key] && (
              <div className="space-y-2 pb-2">
                {cat.goals.map(g=>{
                  const gd=goalData[g.id]||{current:g.default,history:[]};
                  const prev=gd.history?.slice(-1)[0]?.value;
                  const trend=getTrend(gd.current,prev);
                  const isEdit=editingGoal===g.id;
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-2 bg-secondary/30 rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{g.label}</div>
                        {prev!=null&&<div className="text-[10px] text-muted-foreground">Previously: {prev} {g.unit}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trend==='up'&&<span className="text-green-400 text-xs font-bold">↑</span>}
                        {trend==='down'&&<span className="text-red-400 text-xs font-bold">↓</span>}
                        {isEdit ? (
                          <div className="flex items-center gap-1">
                            <Input value={editGoalVal} onChange={e=>setEditGoalVal(e.target.value)} className="w-20 h-7 text-xs bg-background border-border rounded-lg px-2" autoFocus/>
                            <button onClick={()=>saveGoal(g.id,editGoalVal)} className="text-green-400 p-1"><Check className="w-3 h-3"/></button>
                            <button onClick={()=>setEditingGoal(null)} className="text-muted-foreground p-1"><X className="w-3 h-3"/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">{gd.current} <span className="text-[10px] text-muted-foreground font-normal">{g.unit}</span></span>
                            <button onClick={()=>{setEditingGoal(g.id);setEditGoalVal(String(gd.current));}} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3 h-3"/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </GlassCard>
      {logs.length>0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors" onClick={()=>setRecentOpen(o=>!o)}>
            <h2 className="font-semibold text-sm">Recent Workouts</h2>
            {recentOpen?<ChevronUp className="w-4 h-4 text-muted-foreground"/>:<ChevronDown className="w-4 h-4 text-muted-foreground"/>}
          </button>
          <div style={{maxHeight:recentOpen?'600px':'0',overflow:'hidden',transition:'max-height 0.3s ease'}}>
            <div className="px-4 pb-4 space-y-2">
              {logs.slice(0,10).map((log,i)=>(
                <motion.div key={log.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{log.workout_title}</div>
                    <div className="text-[11px] text-muted-foreground">{log.completedAt?.toDate?format(log.completedAt.toDate(),'MMM d, yyyy'):'—'} · {Math.round((log.duration_seconds||0)/60)} min</div>
                  </div>
                  <div className="text-xs text-primary font-semibold">{log.calories_burned||0} cal</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">App Theme</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'midnight', label: 'Midnight', bg: 'bg-slate-900', accent: 'bg-blue-500',   desc: 'Dark' },
            { key: 'sunrise',  label: 'Sunrise',  bg: 'bg-orange-50', accent: 'bg-orange-500', desc: 'Light' },
            { key: 'auto',     label: 'Auto',     bg: 'bg-gradient-to-r from-slate-900 to-orange-50', accent: 'bg-yellow-400', desc: 'By time' },
          ].map(t => (
            <button key={t.key} onClick={() => {
              if (t.key === 'auto') {
                localStorage.removeItem('xfit-theme');
                const hour = new Date().getHours();
                const autoTheme = (hour >= 6 && hour < 19) ? 'sunrise' : 'midnight';
                applyTheme(autoTheme);
                setTheme('auto');
              } else {
                setTheme(t.key);
                applyTheme(t.key);
                localStorage.setItem('xfit-theme', t.key);
              }
            }}
              className={`rounded-2xl p-3 flex flex-col items-center gap-2 border-2 transition-all ${theme === t.key ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary/50 hover:bg-secondary'}`}>
              <div className={`w-12 h-8 rounded-lg ${t.bg} flex items-end justify-end p-1.5 border border-white/10`}>
                <div className={`w-3 h-3 rounded-full ${t.accent}`} />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold">{t.label}</div>
                <div className="text-[10px] text-muted-foreground">{t.desc}</div>
              </div>
              {theme === t.key && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Join Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show your stats on the Ranks tab</p>
              </div>
              <button onClick={() => saveLbPrivacy({ joined: !lbPrivacy.joined })}
                className={`relative w-12 h-6 rounded-full transition-colors ${lbPrivacy.joined ? 'bg-primary' : 'bg-secondary'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${lbPrivacy.joined ? 'translate-x-6' : 'translate-x-0'}`}/>
              </button>
            </div>
            {lbPrivacy.joined && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Display name (leave blank for real name)</p>
                <div className="flex gap-2">
                  <input value={lbNameInput} onChange={e => setLbNameInput(e.target.value)}
                    placeholder={user?.displayName?.split(' ')[0] || 'Your name'}
                    className="flex-1 bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                  <button onClick={() => saveLbPrivacy({ name: lbNameInput.trim() || null })}
                    className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/80 transition-colors">
                    Save
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Use a nickname to stay anonymous 🕵️</p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold">Support XFit 💪</p><p className="text-xs text-muted-foreground mt-0.5">Help keep the app free & growing</p></div>
              <button onClick={() => setShowSupportInfo(s => !s)} className="w-6 h-6 rounded-full bg-secondary/60 text-muted-foreground text-xs font-bold flex items-center justify-center hover:bg-secondary transition-colors">i</button>
            </div>
            {showSupportInfo && (
              <div className="bg-secondary/30 rounded-2xl p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">About XFit</p>
                <p>XFit is an independently developed fitness platform built to give everyone access to premium fitness tools. Your support helps fund continued development, server costs, and new features.</p>
                <p className="mt-1">Your contribution goes toward:</p>
                <p>• Server and hosting costs</p>
                <p>• New features and improvements</p>
                <p>• Turning XFit into a full mobile app</p>
                <p className="text-primary font-medium mt-1">100% voluntary — every contribution is appreciated 🙏</p>
              </div>
            )}
            <a href="https://ko-fi.com/xfit" target="_blank" rel="noopener noreferrer"
              className="w-full h-11 rounded-2xl bg-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/30 active:scale-[0.98] transition-all">
              ❤️ Consider Supporting XFit
            </a>
          </GlassCard>
          <GlassCard className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Fitness</p>
            <Link to="/history" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>🏋️ Workout History</span><span>→</span></Link>
            <div className="border-t border-border/30" />
            <Link to="/records" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>🏆 Personal Records</span><span>→</span></Link>
            <div className="border-t border-border/30" />
            <Link to="/friends" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>👥 Friends & Following</span><span>→</span></Link>
          </GlassCard>
          <GlassCard className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legal</p>
            <Link to="/terms" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>Terms of Service</span><span>→</span></Link>
            <div className="border-t border-border/30" />
            <Link to="/privacy" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>Privacy Policy</span><span>→</span></Link>
          </GlassCard>
          <Button variant="secondary" className="w-full rounded-xl h-12 text-destructive hover:text-destructive" onClick={logout}><LogOut className="w-4 h-4 mr-2"/>Sign Out</Button>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="ghost" className="w-full rounded-xl h-12 text-destructive/60 hover:text-destructive hover:bg-destructive/10 text-sm"><Trash2 className="w-4 h-4 mr-2"/>Delete Account</Button></AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Account</AlertDialogTitle><AlertDialogDescription>This will permanently delete your account and all data. Cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>Delete Forever</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
