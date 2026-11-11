import { useCallback, useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, User, Heart, BarChart2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import InstallBanner from '@/components/shared/InstallBanner';
import UttarAILauncher, { preloadUttarAI } from '@/components/ai/UttarAILauncher';
import { UttarAIProvider } from '@/components/ai/UttarAIContext';
import BrandMark, { BrandEmblem } from '@/components/brand/BrandMark';
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme';

const navItems = [
  { path: '/home',      icon: Home,           label: 'Home'     },
  { path: '/health',    icon: Heart,          label: 'Health'   },
  { path: '/workouts',  icon: Dumbbell,       label: 'Workouts' },
  { path: '/stats',     icon: BarChart2,      label: 'Stats'    },
  { path: '/profile',   icon: User,           label: 'Profile'  },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const openAI = useCallback(() => setAiOpen(true), []);

  useEffect(() => {
    const sync = () => applyResolvedTheme(resolveTheme(getThemeMode()));
    sync();
    // Auto mode follows the clock, so keep it in sync if the app stays open
    // across the 6am or 7pm boundary (and whenever it returns to the foreground).
    const timer = window.setInterval(() => {
      if (getThemeMode() === 'auto') sync();
    }, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Support the old /ai deep link by opening the pop-up on Home instead of
  // sending people to a now-removed tab.
  useEffect(() => {
    if (!location.state?.openAI) return;
    setAiOpen(true);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.state, location.pathname, location.search, navigate]);

  const renderMobileNav = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <Link key={path} to={path}
        aria-current={isActive ? 'page' : undefined}
        className="flex flex-1 min-w-0 flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl relative transition-all active:scale-90">
        {isActive && (
          <motion.div layoutId="activeMobileNav"
            className="absolute inset-0 bg-primary/10 rounded-xl"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
        )}
        <Icon className={`w-[19px] h-[19px] transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={`truncate max-w-full text-[9px] min-[380px]:text-[10px] font-semibold transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
      </Link>
    );
  };

  // The coach lives in the app chrome on every tab: the sidebar logo on desktop
  // and the centre of the mobile tab bar. Full-screen sessions such as
  // /player/* and /run render outside this layout.
  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <InstallBanner />
      <UttarAILauncher open={aiOpen} onOpenChange={setAiOpen} />
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 gap-1 glass-strong z-50 border-r border-border/40">
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          onPointerEnter={preloadUttarAI}
          onFocus={preloadUttarAI}
          aria-label="Open Uttar AI coach"
          aria-haspopup="dialog"
          title="Ask Uttar AI"
          className="ai-logo group relative mb-6 flex h-11 w-11 items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
              className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl w-16 transition-all ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
              {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary/10 rounded-2xl" />}
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="text-[10px] font-semibold relative z-10 leading-tight text-center">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="pb-24 md:pb-0 md:pl-20">
        <UttarAIProvider onOpen={openAI}>
          <Outlet />
        </UttarAIProvider>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-end py-2 px-1">
          {navItems.slice(0, 3).map(renderMobileNav)}
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            onPointerEnter={preloadUttarAI}
            onFocus={preloadUttarAI}
            aria-label="Open Uttar AI coach"
            aria-haspopup="dialog"
            className="ai-logo ai-nav-tab group relative flex flex-1 min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--brand-tile))] ring-1 ring-[hsl(var(--brand-mark)/0.22)] transition-transform duration-300 group-hover:scale-105">
              <BrandEmblem className="w-5" />
              <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-primary" />
            </span>
            <span className="relative z-10 text-[9px] min-[380px]:text-[10px] font-semibold text-primary">AI</span>
          </button>
          {navItems.slice(3).map(renderMobileNav)}
        </div>
      </nav>

      {/* Narrow desktop windows (Chrome not maximised, split screen) are too
          cramped for a sixth tab, so the original floating orb comes back.
          Touch devices keep the centre tab instead. */}
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        onPointerEnter={preloadUttarAI}
        onFocus={preloadUttarAI}
        aria-label="Open Uttar AI coach"
        aria-haspopup="dialog"
        className="ai-logo ai-fab-narrow group fixed right-4 z-[60] h-14 w-14 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      >
        <span className="absolute inset-0 rounded-full bg-[hsl(var(--brand-tile))] shadow-[0_10px_30px_-6px_rgba(0,0,0,0.45)]" />
        <span className="absolute inset-[1.5px] rounded-full bg-gradient-to-b from-[hsl(var(--brand-mark)/0.16)] via-transparent to-transparent" />
        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-[hsl(var(--brand-mark)/0.30)]" />
        <BrandEmblem className="relative w-[30px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110" />
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-[hsl(var(--brand-tile))]">
          <Sparkles className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
