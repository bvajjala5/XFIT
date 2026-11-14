# Uttar Fitness (XFIT)

An AI-powered fitness tracker for workouts, weekly plans, nutrition, health
metrics, and progress. The web app ships as an installable PWA and is built on
React + Vite with Firebase for auth and data.

## Stack

- **React 18 + Vite 6** — SPA with route-level code splitting.
- **Firebase** — Auth, Firestore, Cloud Messaging (push). Security rules live in
  [`firestore.rules`](./firestore.rules) and [`storage.rules`](./storage.rules).
- **Tailwind CSS + Radix UI** — design system under `src/components/ui`.
- **Recharts** — charts on the Insights page.
- **Leaflet / react-leaflet** — route maps for outdoor runs.
- **@zxing/browser** — barcode scanning (dynamically imported on demand).
- **Cloudflare Pages + Workers** — static hosting and the AI proxy (see
  [`worker/README.md`](./worker/README.md)).

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev            # http://localhost:5173
```

### Environment

`.env` is git-ignored — never commit it. See [`.env.example`](./.env.example)
for the full list. The important groups:

- `VITE_FIREBASE_*` — Firebase web config (project settings → Your apps). These
  identify the project; they are protected by the Firestore rules, not secrecy.
- `VITE_FIREBASE_VAPID_KEY` — web push certificate. Leave blank to disable push.
- `VITE_DEV_UID` — your own Auth UID, used only for dev tools / seeding. Real
  admin access is enforced in `firestore.rules`.
- `VITE_AI_PROXY_URL` — URL of the deployed AI proxy Worker. No Gemini key ever
  goes in this app.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Production build (`vite build` + CSS inlining). |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the Node test runner suite (see below). |
| `npm run lint` | ESLint over `src`, `worker`, and `scripts`. |

## Testing

Unit tests use the built-in Node test runner (`node:test`) and live next to the
code as `*.test.mjs`:

- Logic under `src/lib/*.test.mjs`
- Worker auth under `worker/*.test.mjs`

```bash
npm test
```

CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) runs `npm ci`,
`npm test`, `npm run build`, and `npm run lint` on every push to `main` and on
every pull request.

## Project layout

```
src/
  components/   UI grouped by feature (workout, nutrition, run, stats, ...)
  hooks/        Shared React hooks (theme, page meta, focus trap, ...)
  lib/          Pure logic + Firebase/queue helpers (unit-tested)
  pages/        Route components (lazy-loaded from App.jsx)
  data/         Generated datasets (foods, exercise index)
worker/         Cloudflare Worker AI proxy
scripts/        Build-time data generators and post-build steps
public/         Static assets, PWA icons, headers/redirects
```

## Deploy

Production is Cloudflare Pages, deployed by pushing to `main` (roughly a
minute or two to roll out). Firebase Hosting config is in `firebase.json` for
Firestore/Storage rules.

> **Firestore rules** are deployed separately with
> `firebase deploy --only firestore:rules`. Changes to `firestore.rules` should
> be reviewed before deploying — the default is deny-all.

## License

Private / all rights reserved.
