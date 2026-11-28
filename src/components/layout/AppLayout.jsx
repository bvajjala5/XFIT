import { useCallback, useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, User, BarChart2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import Wallpaper from './Wallpaper';
import InstallBanner from '@/components/shared/InstallBanner';
import UttarAILauncher, { preloadUttarAI } from '@/components/ai/UttarAILauncher';
import { UttarAIProvider } from '@/components/ai/UttarAIContext';
import BrandMark, { BrandEmblem } from '@/components/brand/BrandMark';
import { applyResolvedTheme, getThemeMode, resolveTheme, THEME_KEY } from '@/lib/theme';
import { applyAccent, getAccent, ACCENT_KEY } from '@/lib/accent';
import useAutoTheme from '@/hooks/useAutoTheme';

const navItems = [
  { path: '/home',      icon: Home,           label: 'Home'     },
  { path: '/insights',  icon: BarChart2,      label: 'Insights' },
  { path: '/workouts',  icon: Dumbbell,       label: 'Workouts' },
  { path: '/profile',   icon: User,           label: 'Profile'  },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [aiOpen, setAiOpen] = useState(false);
  const openAI = useCallback(() => setAiOpen(true), []);

  // Auto mode only schedules work when it is the saved preference.
  useAutoTheme();

  // Completed workouts are queued locally when the network is unavailable.
  // Flush them on launch, when the browser comes back online, and periodically
  // while the app stays open (signal in a gym basement comes and goes).
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    let syncing = false;
    const sync = async () => {
      if (cancelled || syncing || navigator.onLine === false) return;
      syncing = true;
      try {
        const { flushWorkoutLogQueue } = await import('@/lib/workoutLogQueue');
        const count = await flushWorkoutLogQueue(user.uid);
        if (cancelled || count === 0) return;
        toast.success(`${count} offline workout${count === 1 ? '' : 's'} synced`);
        ['workout-logs', 'workout-logs-stats', 'workout-logs-profile'].forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key, user.uid] });
        });
      } catch (error) {
        console.warn('Could not sync offline workouts yet; will retry.', error);
      } finally {
        syncing = false;
      }
    };
    sync();
    window.addEventListener('online', sync);
    const timer = window.setInterval(sync, 60_000);
    return () => {
      cancelled = true;
      window.removeEventListener('online', sync);
      window.clearInterval(timer);
    };
  }, [user?.uid, queryClient]);

  useEffect(() => {
    // Apply the saved mode on mount and when another tab changes it. Auto is
    // resolved to one of the two static wallpapers; useAutoTheme owns the timer
    // that re-resolves it at the next 7am/7pm boundary.
    const sync = () => {
      applyResolvedTheme(resolveTheme(getThemeMode()));
      applyAccent(getAccent());
    };
    sync();
    const onStorage = (event) => {
      if (!event.key || event.key === THEME_KEY || event.key === ACCENT_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Support the old /ai deep link by opening the pop-up on Home instead of
  // sending people to a now-removed tab. A new navigation gets a new location
  // key, so this opens the panel during render and then clears the one-shot
  // navigation state in an effect.
  const [prevLocationKey, setPrevLocationKey] = useState(location.key);
  if (location.key !== prevLocationKey) {
    setPrevLocationKey(location.key);
    if (location.state?.openAI) setAiOpen(true);
  }
  useEffect(() => {
    if (!location.state?.openAI) return;
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.state, location.pathname, location.search, navigate]);

  const renderMobileNav = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <Link key={path} to={path}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 py-1.5 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isActive ? 'border-primary/35 bg-primary/15' : 'border-border/50 bg-secondary/45 hover:bg-secondary/70'}`}>
        {isActive && (
          <motion.div layoutId="activeMobileNav"
            className="absolute inset-0 rounded-2xl bg-primary/10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
        )}
        <Icon className={`w-[19px] h-[19px] transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={`truncate max-w-full text-[9px] min-[380px]:text-[10px] font-semibold transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
      </Link>
    );
  };

  const bottomNavStyle = { bottom: 'calc(1rem + env(safe-area-inset-bottom))' };

  // The coach lives in the app chrome on every tab: the sidebar logo on desktop
  // and the first slot of the mobile tab bar, before Home. Full-screen sessions
  // such as /player/* and /run render outside this layout.
  // No opaque background on the root: the fixed wallpaper paints at -z-10,
  // behind all page content, with the html element supplying the fallback colour.
  return (
    <div className="min-h-screen">
      <Wallpaper />
      <InstallBanner />
      <UttarAILauncher open={aiOpen} onOpenChange={setAiOpen} />
      {/* Desktop sidebar */}
      <nav aria-label="Main navigation" className="hidden md:flex fixed left-4 top-4 bottom-4 w-[76px] flex-col items-center gap-2 rounded-[28px] border border-border/40 bg-card/55 px-2 py-4 shadow-[0_20px_60px_-38px_rgba(0,0,0,0.75)] backdrop-blur-xl z-50">
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          onPointerEnter={preloadUttarAI}
          onFocus={preloadUttarAI}
          aria-label="Open Uttar AI coach"
          aria-haspopup="dialog"
          title="Ask Uttar AI"
          className="ai-logo group relative mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 outline-none transition-all hover:bg-primary/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <BrandMark className="relative h-11 w-11 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105" emblemClassName="w-7" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-[hsl(var(--brand-tile))]">
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        </button>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition-all ${isActive ? 'border-primary/35 bg-primary/15 text-primary shadow-sm' : 'border-border/50 bg-secondary/45 text-muted-foreground hover:border-primary/30 hover:bg-secondary/70 hover:text-foreground'}`}>
              {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 rounded-2xl bg-primary/10" />}
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="text-[10px] font-semibold relative z-10 leading-tight text-center">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="pb-28 md:pb-0 md:pl-28">
        <UttarAIProvider onOpen={openAI}>
          <Outlet />
        </UttarAIProvider>
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="Main navigation" className="fixed left-3 right-3 z-50 mx-auto max-w-md rounded-[28px] border border-border/50 bg-card/60 px-1.5 py-1.5 shadow-[0_20px_60px_-38px_rgba(0,0,0,0.75)] backdrop-blur-xl md:hidden"
        style={bottomNavStyle}>
        <div className="flex items-center gap-1">
          {/* AI is the leftmost item on mobile, before Home. */}
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            onPointerEnter={preloadUttarAI}
            onFocus={preloadUttarAI}
            aria-label="Open Uttar AI coach"
            aria-haspopup="dialog"
            className="ai-logo group relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-primary/30 bg-primary/10 px-1 py-1 outline-none transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--brand-tile))] ring-1 ring-[hsl(var(--brand-mark)/0.22)] transition-transform duration-300 group-hover:scale-105">
              <BrandEmblem className="w-5" />
              <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-primary" />
            </span>
            <span className="relative z-10 text-[9px] min-[380px]:text-[10px] font-semibold text-primary">AI</span>
          </button>
          {navItems.map(renderMobileNav)}
        </div>
      </nav>
    </div>
  );
}
