import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { clearAppCaches } from '@/lib/cache';
import { applyTheme } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/shared/GlassCard';
import { User, LogOut, Settings, Dumbbell, Clock, Flame, Trash2, Palette, Trophy, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const goalLabels = {lose_weight:'Lose Weight',build_muscle:'Build Muscle',improve_endurance:'Improve Endurance',flexibility:'Flexibility'};

export default function Profile() {
  const { user, userData, updateUserData, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('xfit-theme') || 'auto');

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
