import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, User, Heart, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import InstallBanner from '@/components/shared/InstallBanner';
import UttarAILauncher from '@/components/ai/UttarAILauncher';
import BrandMark from '@/components/brand/BrandMark';
import { applyResolvedTheme, getThemeMode, resolveTheme } from '@/lib/theme';

const navItems = [
  { path: '/',          icon: Home,           label: 'Home'     },
  { path: '/health',    icon: Heart,          label: 'Health'   },
  { path: '/workouts',  icon: Dumbbell,       label: 'Workouts' },
  { path: '/stats',     icon: BarChart2,      label: 'Stats'    },
  { path: '/profile',   icon: User,           label: 'Profile'  },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);

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

  // The coach floats over every tab. Full-screen sessions such as /player/* and
  // /run render outside this layout, so the FAB can never sit over their controls.
  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <InstallBanner />
      <UttarAILauncher open={aiOpen} onOpenChange={setAiOpen} />
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 gap-1 glass-strong z-50 border-r border-border/40">
        <BrandMark className="mb-6 h-10 w-10 rounded-2xl shadow-lg" emblemClassName="w-7" />
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
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link key={path} to={path}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl min-w-0 relative transition-all active:scale-90">
                {isActive && (
                  <motion.div layoutId="activeMobileNav"
                    className="absolute inset-0 bg-primary/12 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon className={`w-[19px] h-[19px] transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-semibold transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
