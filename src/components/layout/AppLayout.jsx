import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, User, Heart, BarChart2 } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import InstallBanner from '@/components/shared/InstallBanner';

const navItems = [
  { path: '/',          icon: Home,           label: 'Home'     },
  { path: '/health',    icon: Heart,          label: 'Health'   },
  { path: '/workouts',  icon: Dumbbell,       label: 'Workouts' },
  { path: '/stats',     icon: BarChart2,      label: 'Stats'    },
  { path: '/profile',   icon: User,           label: 'Profile'  },
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
    const saved = localStorage.getItem('xfit-theme');
    if (!saved) {
      const hour = new Date().getHours();
      const autoTheme = (hour >= 6 && hour < 19) ? 'sunrise' : 'midnight';
      applyTheme(autoTheme);
    } else {
      applyTheme(saved);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <InstallBanner />
      {/* Desktop navigation */}
      <nav className="hidden md:flex fixed inset-x-0 top-0 h-14 items-center justify-between px-6 bg-card border-b border-border z-50">
        <Link to="/" className="text-base font-semibold tracking-tight" aria-label="XFit home">XFit</Link>
        <div className="flex h-full items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
              || (path === '/workouts' && ['/run', '/builder'].includes(location.pathname));
            return (
              <Link key={path} to={path} aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="pb-24 md:pb-0 md:pt-14">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
                || (path === '/workouts' && ['/run', '/builder'].includes(location.pathname));
            return (
              <Link key={path} to={path} aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 min-w-0 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
