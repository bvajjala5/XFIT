import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import MealTracker from '@/components/nutrition/MealTracker';
import { Footprints, Heart, Moon, Flame, Wind, Plus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { localDateStr } from '@/lib/utils';
import { toast } from 'sonner';

const today = () => localDateStr();

// ── METRIC CARD — bigger ring, better visual ──────────────────────────────
function HealthMetricCard({ metric, onClick }) {
  const { label, icon: Icon, color, colorClass, value, target, format, subtitle } = metric;
  const progress = target ? Math.min((value / target) * 100, 100) : 0;
  const size = 56, strokeW = 6, r = (size - strokeW) / 2, circ = 2 * Math.PI * r;

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-all hover:border-white/15 min-h-[140px]"
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>

      {/* Middle: ring + value side by side */}
      <div className="flex items-center gap-3">
        {/* Ring */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="hsl(var(--secondary))" strokeWidth={strokeW} />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke={color} strokeWidth={strokeW} strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ - (progress / 100) * circ}
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          {/* Percentage inside ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold" style={{ color }}>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Value */}
        <div className="flex-1 min-w-0">
          <p className={`text-2xl font-black leading-none ${colorClass}`}>{format(value)}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{subtitle}</p>}
          {target && <p className="text-[10px] text-muted-foreground mt-0.5">of {target.toLocaleString()} goal</p>}
        </div>
      </div>
    </button>
  );
}

// ── LOG MODAL ─────────────────────────────────────────────────────────────
function HealthLogModal({ open, onClose, existing, onSave, saving }) {
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm(existing || {}); }, [open, existing]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = k => form[k] || '';
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card rounded-t-3xl md:rounded-2xl border border-border"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        
        {/* Sticky header */}
        <div className="sticky top-0 bg-card border-b border-border/50 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-bold">Log Today's Health</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg">×</button>
        </div>

        <div className="p-5 space-y-4">
          <Tabs defaultValue="activity">
            <TabsList className="w-full">
              <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
              <TabsTrigger value="heart" className="flex-1 text-xs">Heart</TabsTrigger>
              <TabsTrigger value="sleep" className="flex-1 text-xs">Sleep</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[['steps','Steps','8500'],['distance_miles','Distance (mi)','3.5'],['floors','Floors Climbed','10'],['spo2','SpO2 (%)','98']].map(([k,l,p]) => (
                  <div key={k} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{l}</label>
                    <Input type="number" value={num(k)} onChange={e => set(k, +e.target.value)} placeholder={p}
                      className="bg-secondary/40 border-0 h-12 text-base" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="heart" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[['heart_rate_current','Current (bpm)','72'],['heart_rate_resting','Resting (bpm)','60'],['heart_rate_max','Max Today (bpm)','150']].map(([k,l,p]) => (
                  <div key={k} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{l}</label>
                    <Input type="number" value={num(k)} onChange={e => set(k, +e.target.value)} placeholder={p}
                      className="bg-secondary/40 border-0 h-12 text-base" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sleep" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Bedtime</label>
                  <Input type="time" value={form.sleep_bedtime || ''} onChange={e => set('sleep_bedtime', e.target.value)}
                    className="bg-secondary/40 border-0 h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Wake Time</label>
                  <Input type="time" value={form.sleep_wake_time || ''} onChange={e => {
                    const wake = e.target.value; set('sleep_wake_time', wake);
                    if (form.sleep_bedtime && wake) {
                      const [bH,bM] = form.sleep_bedtime.split(':').map(Number);
                      const [wH,wM] = wake.split(':').map(Number);
                      let diff = (wH*60+wM)-(bH*60+bM);
                      if (diff < 0) diff += 1440;
                      set('sleep_duration_hours', Math.round(diff/6)/10);
                    }
                  }} className="bg-secondary/40 border-0 h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Duration (hrs)</label>
                  <Input type="number" step="0.5" value={num('sleep_duration_hours')} onChange={e => set('sleep_duration_hours', +e.target.value)}
                    placeholder="7.5" className="bg-secondary/40 border-0 h-12 text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sleep Quality: {form.sleep_quality || 3}/5</label>
                <Slider min={1} max={5} step={1} value={[form.sleep_quality || 3]} onValueChange={([v]) => set('sleep_quality', v)} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Bigger, more visible buttons */}
          <div className="flex gap-3 pt-2 pb-2">
            <Button variant="secondary" size="lg" className="flex-1 rounded-2xl h-14 text-base font-semibold" onClick={onClose}>
              Cancel
            </Button>
            <Button size="lg" className="flex-1 rounded-2xl h-14 text-base font-bold" onClick={() => onSave(form)} disabled={saving}>
              {saving ? 'Saving...' : '✓ Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function HealthHub() {
  const { user } = useAuth();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: todayLog = {}, isLoading } = useQuery({
    queryKey: ['health-log-today', user?.uid],
    queryFn: async () => {
      if (!user) return {};
      const snap = await getDoc(doc(db, 'users', user.uid, 'healthLogs', today()));
      return snap.exists() ? snap.data() : {};
    },
    enabled: !!user
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!user) return;
      await setDoc(doc(db, 'users', user.uid, 'healthLogs', today()), { ...data, date: today() }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log-today', user?.uid] });
      setLogModalOpen(false);
      toast.success('Health data saved!');
    }
  });

  const metrics = [
    { key:'steps',   label:'Steps',        icon:Footprints, color:'hsl(211,100%,52%)', colorClass:'text-blue-400',   value:todayLog.steps||0,                                       target:Number(localStorage.getItem('xfit_steps_goal')||10000), format:v=>v?.toLocaleString()||'0' },
    { key:'heart',   label:'Heart Rate',   icon:Heart,      color:'hsl(0,84%,60%)',    colorClass:'text-red-400',    value:todayLog.heart_rate_current||todayLog.heart_rate_resting||0, target:100,   format:v=>v?`${v} bpm`:'—', subtitle:todayLog.heart_rate_resting?`Resting: ${todayLog.heart_rate_resting} bpm`:null },
    { key:'sleep',   label:'Sleep',        icon:Moon,       color:'hsl(270,65%,60%)',  colorClass:'text-purple-400', value:todayLog.sleep_duration_hours||0,                         target:Number(localStorage.getItem('xfit_sleep_goal')||8),     format:v=>v?`${v}h`:'—', subtitle:todayLog.sleep_quality?`Quality: ${todayLog.sleep_quality}/5 ★`:null },
    { key:'calories',label:'Cal Burned',   icon:Flame,      color:'hsl(35,100%,55%)',  colorClass:'text-orange-400', value:todayLog.calories_burned||0,                              target:Number(localStorage.getItem('xfit_calories_goal')||500), format:v=>v?.toLocaleString()||'0' },
    { key:'spo2',    label:'Blood Oxygen', icon:Wind,       color:'hsl(175,70%,45%)',  colorClass:'text-teal-400',   value:todayLog.spo2||0,                                         target:100,   format:v=>v?`${v}%`:'—' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Health Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Today's overview</p>
        </div>
        {activeTab === 'overview' && (
          <Button onClick={() => setLogModalOpen(true)} size="lg" className="rounded-xl gap-2 h-11">
            <Plus className="w-4 h-4" /> Log Stats
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[{ key:'overview', label:'📊 Overview' },{ key:'nutrition', label:'🍽️ Nutrition' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab===t.key?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {isLoading
              ? Array(5).fill(0).map((_,i) => <Skeleton key={i} className="h-36 rounded-2xl"/>)
              : metrics.map((m,i) => (
                <motion.div key={m.key} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
                  <HealthMetricCard metric={m} onClick={() => setLogModalOpen(true)} />
                </motion.div>
              ))
            }
          </div>
          <GlassCard className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Connect a Fitness Device</p>
              <p className="text-xs text-muted-foreground mt-1">Apple Health, Fitbit, and Garmin integrations require a published app. For now, log your stats manually above or use the Run tracker for GPS-based step counting.</p>
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'nutrition' && <MealTracker userId={user?.uid} />}

      <HealthLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        existing={todayLog}
        onSave={data => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}
