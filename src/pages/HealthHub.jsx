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

function HealthMetricCard({ metric, onClick }) {
  const { label, icon: Icon, color, colorClass, value, target, format, subtitle } = metric;
  const progress = target ? Math.min((value / target) * 100, 100) : 0;
  const r = 14, circ = 2 * Math.PI * r;
  return (
    <GlassCard className="cursor-pointer hover:border-white/10 transition-all active:scale-95 p-4" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${colorClass}`}>{format(value)}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
      <div className="flex items-center gap-2">
        <svg width="28" height="28" className="-rotate-90">
          <circle cx="14" cy="14" r={r} fill="none" stroke="hsl(0,0%,15%)" strokeWidth="3" />
          <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (progress / 100) * circ}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <span className="text-[10px] text-muted-foreground">{Math.round(progress)}% of goal</span>
      </div>
    </GlassCard>
  );
}

function HealthLogModal({ open, onClose, existing, onSave, saving }) {
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm(existing || {}); }, [open, existing]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = k => form[k] || '';
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-card rounded-t-3xl md:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Log Today's Health</h2>
          <button onClick={onClose} className="text-muted-foreground text-xl leading-none">×</button>
        </div>
        <Tabs defaultValue="activity">
          <TabsList className="w-full">
            <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
            <TabsTrigger value="heart" className="flex-1 text-xs">Heart</TabsTrigger>
            <TabsTrigger value="sleep" className="flex-1 text-xs">Sleep</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {[['steps', 'Steps', '8500'], ['distance_miles', 'Distance (mi)', '3.5'], ['floors', 'Floors Climbed', '10'], ['spo2', 'SpO2 (%)', '98']].map(([k, l, p]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs">{l}</label>
                  <Input type="number" value={num(k)} onChange={e => set(k, +e.target.value)} placeholder={p} className="bg-secondary/40 border-0" />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="heart" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {[['heart_rate_current', 'Current (bpm)', '72'], ['heart_rate_resting', 'Resting (bpm)', '60'], ['heart_rate_max', 'Max Today (bpm)', '150']].map(([k, l, p]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs">{l}</label>
                  <Input type="number" value={num(k)} onChange={e => set(k, +e.target.value)} placeholder={p} className="bg-secondary/40 border-0" />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sleep" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs">Bedtime</label>
                <Input type="time" value={form.sleep_bedtime || ''} onChange={e => set('sleep_bedtime', e.target.value)} className="bg-secondary/40 border-0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs">Wake Time</label>
                <Input type="time" value={form.sleep_wake_time || ''} onChange={e => {
                  const wake = e.target.value; set('sleep_wake_time', wake);
                  if (form.sleep_bedtime && wake) {
                    const [bH, bM] = form.sleep_bedtime.split(':').map(Number);
                    const [wH, wM] = wake.split(':').map(Number);
                    let diff = (wH * 60 + wM) - (bH * 60 + bM);
                    if (diff < 0) diff += 1440;
                    set('sleep_duration_hours', Math.round(diff / 6) / 10);
                  }
                }} className="bg-secondary/40 border-0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs">Duration (hrs)</label>
                <Input type="number" step="0.5" value={num('sleep_duration_hours')} onChange={e => set('sleep_duration_hours', +e.target.value)} placeholder="7.5" className="bg-secondary/40 border-0" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs">Sleep Quality: {form.sleep_quality || 3}/5</label>
              <Slider min={1} max={5} step={1} value={[form.sleep_quality || 3]} onValueChange={([v]) => set('sleep_quality', v)} />
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 rounded-xl" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}

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
    { key: 'steps', label: 'Steps', icon: Footprints, color: 'hsl(211,100%,52%)', colorClass: 'text-blue-400', value: todayLog.steps || 0, target: 10000, format: v => v?.toLocaleString() || '0' },
    { key: 'heart', label: 'Heart Rate', icon: Heart, color: 'hsl(0,84%,60%)', colorClass: 'text-red-400', value: todayLog.heart_rate_current || todayLog.heart_rate_resting || 0, target: 80, format: v => v || '—', subtitle: todayLog.heart_rate_resting ? `Resting: ${todayLog.heart_rate_resting} bpm` : null },
    { key: 'sleep', label: 'Sleep', icon: Moon, color: 'hsl(270,65%,60%)', colorClass: 'text-purple-400', value: todayLog.sleep_duration_hours || 0, target: 8, format: v => v ? `${v}h` : '—', subtitle: todayLog.sleep_quality ? `Quality: ${todayLog.sleep_quality}/5 ★` : null },
    { key: 'calories', label: 'Cal Burned', icon: Flame, color: 'hsl(35,100%,55%)', colorClass: 'text-orange-400', value: todayLog.calories_burned || 0, target: 500, format: v => v?.toLocaleString() || '0' },
    { key: 'spo2', label: 'Blood Oxygen', icon: Wind, color: 'hsl(175,70%,45%)', colorClass: 'text-teal-400', value: todayLog.spo2 || 0, target: 100, format: v => v ? `${v}%` : '—' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Health Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Today's overview</p>
        </div>
        {activeTab === 'overview' && (
          <Button onClick={() => setLogModalOpen(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Log Stats
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'nutrition', label: '🍽️ Nutrition' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {isLoading
              ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
              : metrics.map((m, i) => (
                <motion.div key={m.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <HealthMetricCard metric={m} onClick={() => setLogModalOpen(true)} />
                </motion.div>
              ))
            }
          </div>

          {/* Manual sync info */}
          <GlassCard className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Connect a Fitness Device</p>
              <p className="text-xs text-muted-foreground mt-1">Apple Health, Fitbit, and Garmin integrations require a published app. For now, log your stats manually above or use the Run tracker for GPS-based step counting.</p>
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'nutrition' && (
        <MealTracker userId={user?.uid} />
      )}

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
