import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { db } from '@/lib/firestore';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore/lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import MealTracker from '@/components/nutrition/MealTracker';
import { Footprints, Heart, Moon, Flame, Wind, Plus, Activity, Scale, TrendingDown, TrendingUp, Minus, BarChart3, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { localDateStr } from '@/lib/utils';
import { toast } from 'sonner';
import useFocusTrap from '@/hooks/useFocusTrap';

const today = () => localDateStr();

// ── WEIGHT TRACKER ────────────────────────────────────────────────────────
function WeightTracker({ userId }) {
  const [input, setInput] = useState('');
  const [unit, setUnit] = useState(() => localStorage.getItem('xfit_weight_unit') || 'lbs');
  const qc = useQueryClient();

  const { data: weightLogs = [], isLoading } = useQuery({
    queryKey: ['weight-logs', userId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'users', userId, 'weightLogs'), orderBy('date', 'desc'), limit(30))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    },
    enabled: !!userId,
  });

  async function logWeight() {
    const val = parseFloat(input);
    if (!val || val < 50 || val > 700) { toast.error('Enter a valid weight'); return; }
    try {
      await addDoc(collection(db, 'users', userId, 'weightLogs'), {
        value: val, unit, date: today(),
      });
      qc.invalidateQueries({ queryKey: ['weight-logs', userId] });
      setInput('');
      toast.success('Weight logged!');
    } catch (error) {
      console.error('Could not log weight:', error);
      toast.error("Couldn't log weight — check your connection");
    }
  }

  const chartData = weightLogs.map(l => ({
    date: l.date ? new Date(l.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '',
    weight: l.value,
  }));

  const latest = weightLogs[weightLogs.length - 1];
  const prev = weightLogs[weightLogs.length - 2];
  const diff = latest && prev ? (latest.value - prev.value).toFixed(1) : null;
  const TrendIcon = diff === null ? null : diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff === null ? '' : diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Body Weight</h3>
        </div>
        {latest && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black">{latest.value}</span>
            <span className="text-xs text-muted-foreground">{latest.unit}</span>
            {TrendIcon && diff !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />{Math.abs(diff)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Log input */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-1">
          <Input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Weight in ${unit}`}
            className="rounded-xl bg-secondary/40 border-border/40 h-10 text-sm"
            onKeyDown={e => e.key === 'Enter' && logWeight()}
          />
          <button onClick={() => { const next = unit === 'lbs' ? 'kg' : 'lbs'; setUnit(next); localStorage.setItem('xfit_weight_unit', next); }}
            className="h-10 px-3 rounded-xl bg-secondary/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {unit}
          </button>
        </div>
        <button onClick={logWeight}
          className="h-10 px-4 rounded-xl primary-gradient text-white text-sm font-bold shrink-0">
          Log
        </button>
      </div>

      {/* Chart */}
      {isLoading && <div className="h-36 animate-pulse bg-secondary/40 rounded-2xl" />}
      {!isLoading && chartData.length === 0 && (
        <div className="h-28 flex items-center justify-center text-muted-foreground text-xs">
          Log your first weigh-in to see the trend
        </div>
      )}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
              formatter={v => [`${v} ${unit}`, 'Weight']}
            />
            <Line type="monotone" dataKey="weight" stroke="url(#weightGrad)" strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

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
  const contentRef = useRef(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setForm(existing || {});
  }
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = k => form[k] || '';
  useFocusTrap(contentRef, open, onClose);
  if (!open) return null;

  // Portal to <body> so this sheet sits above the app nav instead of inside the page's stacking context.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={contentRef} role="dialog" aria-modal="true" aria-labelledby="health-log-title"
        className="w-full bg-card rounded-t-3xl border border-border focus:outline-none sm:max-w-md sm:rounded-2xl"
        style={{ maxHeight: '90dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}
        tabIndex={-1}>
        
        {/* Sticky header */}
        <div className="sticky top-0 bg-card border-b border-border/50 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 id="health-log-title" className="text-lg font-bold">Log Today's Health</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg">×</button>
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
                  <label htmlFor="health-bedtime" className="text-xs font-medium text-muted-foreground">Bedtime</label>
                  <Input id="health-bedtime" type="time" value={form.sleep_bedtime || ''} onChange={e => set('sleep_bedtime', e.target.value)}
                    className="bg-secondary/40 border-0 h-12" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="health-wake-time" className="text-xs font-medium text-muted-foreground">Wake Time</label>
                  <Input id="health-wake-time" type="time" value={form.sleep_wake_time || ''} onChange={e => {
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
                  <label htmlFor="health-sleep-duration" className="text-xs font-medium text-muted-foreground">Duration (hrs)</label>
                  <Input id="health-sleep-duration" type="number" step="0.5" value={num('sleep_duration_hours')} onChange={e => set('sleep_duration_hours', +e.target.value)}
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
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
const HEALTH_TABS = ['overview', 'weight', 'nutrition'];

export default function HealthHub({ embedded = false } = {}) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    HEALTH_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );
  const queryClient = useQueryClient();

  // Deep links such as /insights?tab=weight from Uttar AI (or a shared URL).
  const [prevParams, setPrevParams] = useState(searchParams);
  if (searchParams !== prevParams) {
    setPrevParams(searchParams);
    const next = searchParams.get('tab');
    setActiveTab(HEALTH_TABS.includes(next) ? next : 'overview');
  }

  const selectTab = (key) => {
    setActiveTab(key);
    // Keep the URL reload-safe without adding history entries for every tap,
    // and preserve the parent Insights view while switching Health sections.
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (key === 'overview') next.delete('tab');
      else next.set('tab', key);
      return next;
    }, { replace: true });
  };

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

  const tabSwitcher = (
    <div className="flex gap-1.5 rounded-2xl bg-secondary/50 p-1.5">
      {[{ key:'overview', label:'Overview', Icon:BarChart3 },{ key:'weight', label:'Weight', Icon:Scale },{ key:'nutrition', label:'Nutrition', Icon:Utensils }].map(t => (
        <button key={t.key} type="button" onClick={() => selectTab(t.key)}
          aria-pressed={activeTab === t.key}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all sm:text-sm ${activeTab===t.key?'bg-primary text-primary-foreground shadow-sm':'text-muted-foreground hover:text-foreground'}`}>
          <span className="inline-flex items-center justify-center gap-1.5"><t.Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t.label}</span>
        </button>
      ))}
    </div>
  );

  const overview = activeTab === 'overview' && (
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
  );

  const sections = (
    <>
      {overview}
      {activeTab === 'weight' && <WeightTracker userId={user?.uid} />}
      {activeTab === 'nutrition' && <MealTracker userId={user?.uid} />}
    </>
  );

  const logModal = (
    <HealthLogModal
      open={logModalOpen}
      onClose={() => setLogModalOpen(false)}
      existing={todayLog}
      onSave={data => saveMutation.mutate(data)}
      saving={saveMutation.isPending}
    />
  );

  // Embedded inside the Insights page: no page heading or outer padding, and a
  // compact Log action beside the Health section tabs.
  if (embedded) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{tabSwitcher}</div>
          {activeTab === 'overview' && (
            <Button onClick={() => setLogModalOpen(true)} size="sm" className="h-10 shrink-0 gap-1.5 rounded-xl px-3">
              <Plus className="w-4 h-4" /> Log
            </Button>
          )}
        </div>
        {sections}
        {logModal}
      </section>
    );
  }

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

      {tabSwitcher}
      {sections}
      {logModal}
    </div>
  );
}
