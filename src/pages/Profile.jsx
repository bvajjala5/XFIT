import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firestore';
import { deleteUser } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore/lite';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { clearAppCaches } from '@/lib/cache';
import { getThemeMode, setThemeMode } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/shared/GlassCard';
import { User, LogOut, Settings, Dumbbell, Clock, Flame, Trash2, Palette, Trophy, ChevronRight, Check, Moon, Sun } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const goalLabels = {lose_weight:'Lose Weight',build_muscle:'Build Muscle',improve_endurance:'Improve Endurance',flexibility:'Flexibility'};

const THEME_OPTIONS = [
  { key: 'midnight', label: 'Midnight', desc: 'Always dark',  icon: Moon },
  { key: 'sunrise',  label: 'Sunrise',  desc: 'Always light', icon: Sun },
  { key: 'auto',     label: 'Auto',     desc: 'By time',      icon: Clock },
];

function ThemePreview({ mode }) {
  if (mode === 'auto') {
    return (
      <div
        className="relative h-11 w-full overflow-hidden rounded-xl border border-black/10"
        style={{ background: 'linear-gradient(135deg, #0b1020 0%, #111a33 49.5%, #fff1de 50.5%, #fff7ed 100%)' }}
      >
        <Moon className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-200" />
        <span className="absolute left-7 top-2 h-0.5 w-0.5 rounded-full bg-white/80" />
        <span className="absolute left-6 top-4 h-px w-px rounded-full bg-white/60" />
        <Sun className="absolute bottom-1.5 right-2 h-4 w-4 text-orange-500" />
      </div>
    )
  }

  const dark = mode === 'midnight'
  return (
    <div className={`relative h-11 w-full overflow-hidden rounded-xl border ${dark ? 'border-white/10 bg-[#0b1020]' : 'border-black/5 bg-[#fff7ed]'}`}>
      <span className={`absolute left-2 top-2 h-1 w-9 rounded-full ${dark ? 'bg-white/30' : 'bg-black/15'}`} />
      <span className={`absolute left-2 top-4 h-1 w-6 rounded-full ${dark ? 'bg-white/15' : 'bg-black/10'}`} />
      <span
        className={`absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full ${dark
          ? 'bg-blue-500 shadow-[0_0_12px_2px_rgba(59,130,246,0.55)]'
          : 'bg-orange-500 shadow-[0_0_12px_2px_rgba(249,115,22,0.45)]'}`}
      />
    </div>
  )
}

export default function Profile() {
  const { user, userData, updateUserData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => getThemeMode());

  // Uttar AI can deep-link to a Profile card, e.g. /profile#profile-settings.
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = location.hash.slice(1);
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    if (userData) {
      setForm({fitness_goal:userData.fitness_goal||'',experience_level:userData.experience_level||'',preferred_types:userData.preferred_types||[],distance_unit:userData.distance_unit||'miles'});
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

  const handleSave = async () => {
    setSaving(true);
    await updateUserData(form);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const colls = ['workouts','customWorkouts','goals','healthLogs','messages','schedule','foodLogs','runs','journal','preferences',
        'personalRecords','fcmTokens','customFoods','weightLogs','checkins','followers'];
      for (const c of colls) { const snap = await getDocs(collection(db,'users',user.uid,c)); for (const d of snap.docs) await deleteDoc(d.ref); }
      // Remove public community workouts this user published, so deletion is complete.
      const shared = await getDocs(query(collection(db, 'sharedWorkouts'), where('sharedBy', '==', user.uid)));
      for (const d of shared.docs) await deleteDoc(d.ref);
      await deleteDoc(doc(db,'users',user.uid));
      await clearAppCaches();
      await deleteUser(auth.currentUser);
    } catch(e) {
      console.error('Account deletion failed:', e);
      toast.error(e?.code === 'auth/requires-recent-login'
        ? 'Your data was deleted, but signing out failed for security reasons. Sign in again to finish removing the account.'
        : 'Could not finish deleting your account. Please sign in again and retry.');
      await logout();
      navigate('/', { replace: true });
    }
  };

  const totalMins = Math.round(logs.reduce((s,l)=>s+(l.duration_seconds||0),0)/60);
  const totalCals = logs.reduce((s,l)=>s+(l.calories_burned||0),0);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto overflow-hidden">
          {userData?.profile_picture ? <img src={userData.profile_picture} alt="Profile" className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-primary"/>}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{userData?.full_name||'Athlete'}</h1>
          <p className="text-sm text-muted-foreground">{userData?.email}</p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {userData?.fitness_goal && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">{goalLabels[userData.fitness_goal]||userData.fitness_goal}</span>}
          {userData?.experience_level && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full capitalize">{userData.experience_level}</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="text-center"><Dumbbell className="w-4 h-4 text-primary mx-auto mb-1"/><div className="text-xl font-bold">{logs.length}</div><div className="text-[10px] text-muted-foreground">Workouts</div></GlassCard>
        <GlassCard className="text-center"><Clock className="w-4 h-4 text-green-400 mx-auto mb-1"/><div className="text-xl font-bold">{totalMins}</div><div className="text-[10px] text-muted-foreground">Minutes</div></GlassCard>
        <GlassCard className="text-center"><Flame className="w-4 h-4 text-orange-400 mx-auto mb-1"/><div className="text-xl font-bold">{totalCals}</div><div className="text-[10px] text-muted-foreground">Calories</div></GlassCard>
      </div>
      <GlassCard id="profile-settings" className={`scroll-mt-24 transition-shadow ${location.hash === '#profile-settings' ? 'ring-2 ring-primary/60' : ''}`}>
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
      <GlassCard id="app-theme" className={`space-y-3 scroll-mt-24 transition-shadow ${location.hash === '#app-theme' ? 'ring-2 ring-primary/60' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">App Theme</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const selected = theme === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setThemeMode(key); setTheme(key) }}
                aria-pressed={selected}
                className={`relative rounded-2xl border p-2 text-left transition-all duration-200 ${
                  selected
                    ? 'border-primary/70 bg-primary/10 ring-2 ring-primary/25'
                    : 'border-border/40 bg-secondary/40 hover:bg-secondary/70'
                }`}
              >
                {selected && (
                  <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <ThemePreview mode={key} />
                <div className="mt-2 flex items-center gap-1.5 px-0.5">
                  <Icon className={`h-3 w-3 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate text-xs font-semibold">{label}</span>
                </div>
                <div className="px-0.5 text-[10px] text-muted-foreground">{desc}</div>
              </button>
            )
          })}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Auto picks Sunrise from 6am–7pm and Midnight the rest of the day.
        </p>
      </GlassCard>
          <GlassCard className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Fitness</p>
            <Link to="/history" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span className="flex items-center gap-3"><Dumbbell className="w-4 h-4 text-muted-foreground" /> Workout History</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
            <div className="border-t border-border/30" />
            <Link to="/records" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span className="flex items-center gap-3"><Trophy className="w-4 h-4 text-muted-foreground" /> Personal Records</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
          </GlassCard>
          <GlassCard className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legal</p>
            <Link to="/terms" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>Terms of Service</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
            <div className="border-t border-border/30" />
            <Link to="/privacy" className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"><span>Privacy Policy</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></Link>
          </GlassCard>
          <Button variant="secondary" className="w-full rounded-xl h-12 text-destructive hover:text-destructive" onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2"/>Sign Out</Button>
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
