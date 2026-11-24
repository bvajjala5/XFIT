import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import usePageMeta from '@/hooks/usePageMeta';

const SERVICES = [
  { name: 'Uttar Fitness hosting', detail: 'Cloudflare Pages serves the app and installable PWA.', url: 'https://www.cloudflarestatus.com/' },
  { name: 'Accounts and storage', detail: 'Firebase handles Google sign-in and your saved data.', url: 'https://status.firebase.google.com/' },
  { name: 'Uttar AI', detail: 'Google Cloud powers AI-generated plans and chat.', url: 'https://status.cloud.google.com/' },
  { name: 'Food and barcode data', detail: 'Open Food Facts supplies product and barcode information.', url: 'https://status.openfoodfacts.org/' },
];

const HABITS = [
  'Automated lint, tests and production builds run before a release reaches the live site.',
  'The installable PWA caches the app shell so a brief network drop does not blank the screen.',
  'Personal preferences and corrections are versioned so older saved values keep working.',
  'A visible error boundary catches UI failures instead of leaving a blank page.',
  'You can export your own data from Profile at any time.',
];

export default function Status() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Status & reliability — Uttar Fitness',
    description: 'What Uttar Fitness depends on, where to check live service status, and how we reduce breakage.',
    path: '/status',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-xl p-2 hover:bg-secondary/50 transition-colors"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
        <h1 className="text-lg font-bold">Status & reliability</h1>
      </div>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">A note on this page</h2>
          <p>Uttar Fitness is newer, so we would rather be honest than show a decorative green “all systems go” light. This page lists the services we depend on and links to their live status pages. We will post known incidents here when they affect the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Service status</h2>
          <div className="space-y-2">
            {SERVICES.map((service) => (
              <a
                key={service.name}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-foreground/20"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{service.name}</span>
                  <span className="block text-xs text-muted-foreground">{service.detail}</span>
                </span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">How we reduce breakage</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            {HABITS.map((habit) => <li key={habit}>{habit}</li>)}
          </ul>
          <p>Long-term reliability is earned over time. This page is where we keep that record visible.</p>
        </section>
      </main>
    </div>
  );
}
