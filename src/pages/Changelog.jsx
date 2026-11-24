import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import usePageMeta from '@/hooks/usePageMeta';

const RELEASES = [
  {
    date: '2026-11-24',
    title: 'Trust tools and a calmer player',
    items: [
      'Food results now show where each entry came from, and you can keep an on-device correction when a label looks wrong.',
      'You can export your Uttar Fitness data as a JSON file from Profile.',
      'Added this changelog and a status page with links to the services Uttar relies on.',
      'Workout controls moved into one gear menu; the set counter is centered and the demo/body map fits small screens properly.',
    ],
  },
  {
    date: '2026-11',
    title: 'Auto wallpaper and a shared preview theme',
    items: [
      'Added Auto mode, which switches between Light and Dark at 7am and 7pm using your device clock.',
      'The landing page and demo now share one preview wallpaper, while Login stays light.',
      'Wallpaper changes cross-fade instead of snapping.',
    ],
  },
  {
    date: '2026-10',
    title: 'Guided workout foundations',
    items: [
      'Animated exercise demos, body maps, timers, reps, rest periods and personal records are available in the full app.',
      'Added weekly planning, nutrition logging with Open Food Facts, and GPS-mapped runs.',
    ],
  },
];

export default function Changelog() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Changelog — Uttar Fitness',
    description: 'A plain-language record of what changed in Uttar Fitness and when.',
    path: '/changelog',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-xl p-2 hover:bg-secondary/50 transition-colors"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
        <h1 className="text-lg font-bold">Changelog</h1>
      </div>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8 text-sm leading-relaxed text-muted-foreground">
        <p className="text-xs">Uttar Fitness is a newer app. This page is our honest record of what shipped, not a marketing claim.</p>
        {RELEASES.map((release) => (
          <section key={release.date} className="space-y-2 rounded-2xl border border-border/60 bg-card/50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">{release.title}</h2>
              <time className="text-xs text-muted-foreground">{release.date}</time>
            </div>
            <ul className="list-disc space-y-1.5 pl-5">
              {release.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">How releases happen</h2>
          <p>Every change goes through lint, automated tests and a production build before it reaches the live site. We keep this changelog updated as features ship.</p>
        </section>
      </main>
    </div>
  );
}
