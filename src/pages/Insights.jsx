import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import HealthHub from '@/pages/HealthHub';
import Stats from '@/pages/Stats';

const VIEWS = [
  {
    key: 'health',
    label: 'Health',
    blurb: 'Metrics & food log',
    icon: Heart,
  },
  {
    key: 'stats',
    label: 'Stats',
    blurb: 'Totals & trends',
    icon: BarChart2,
  },
];

/**
 * Health and training stats share one tab so the bottom bar stays short.
 * `?view=stats` opens the Stats half; Health is the default.
 */
export default function Insights() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'stats' ? 'stats' : 'health';

  const selectView = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    if (key === 'stats') next.set('view', 'stats');
    else next.delete('view');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Insights</h1>
        <p className="text-sm text-muted-foreground">Your health and training, in one place.</p>
      </header>

      <div
        role="tablist"
        aria-label="Insights sections"
        className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border/60 bg-secondary/40 p-1.5"
      >
        {VIEWS.map(({ key, label, blurb, icon: Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              id={`insights-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="insights-panel"
              onClick={() => selectView(key)}
              className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors sm:gap-3 ${
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="insightsTab"
                  className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/60"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                />
              )}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-primary/15 text-primary' : 'bg-secondary/70'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="relative z-10 min-w-0">
                <span className="block text-sm font-bold leading-tight">{label}</span>
                <span className="hidden text-[10px] leading-tight text-muted-foreground min-[380px]:block">{blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="insights-panel" role="tabpanel" aria-labelledby={`insights-tab-${view}`}>
        {view === 'health' ? <HealthHub embedded /> : <Stats embedded />}
      </div>
    </div>
  );
}
