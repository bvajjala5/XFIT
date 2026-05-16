import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, MessageCircle, TrendingUp, User, Heart, Trophy, Footprints } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';

const navItems = [
  { path: '/',         icon: Home,          label: 'Home'     },
  { path: '/health',   icon: Heart,         label: 'Health'   },
  { path: '/workouts', icon: Dumbbell,      label: 'Workouts' },
  { path: '/run',      icon: Footprints,    label: 'Run'      },
  { path: '/coach',    icon: MessageCircle, label: 'Coach'    },
  { path: '/ranks',    icon: Trophy,        label: 'Ranks'    },
  { path: '/progress', icon: TrendingUp,    label: 'Progress' },
  { path: '/profile',  icon: User,          label: 'Profile'  },
];

function applyTheme(theme) {
  document.documentElement.className = '';
  document.documentElement.classList.add(`theme-${theme}`);
  localStorage.setItem('xfit-theme', theme);
}

export { applyTheme };

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('xfit-theme') || 'midnight';
    applyTheme(saved);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 gap-1 glass-strong z-50 border-r border-border/40">
        <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center mb-6 shadow-lg">
          <span className="text-white font-black text-lg">X</span>
        </div>
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl w-16 transition-all ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
              {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary/10 rounded-2xl" />}
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="text-[9px] font-semibold relative z-10 leading-tight text-center">{label}</span>
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
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl min-w-0 relative transition-all active:scale-90">
                {isActive && (
                  <motion.div layoutId="activeMobileNav"
                    className="absolute inset-0 bg-primary/12 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon className={`w-[19px] h-[19px] transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[9px] font-semibold transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
