# Uttar Fitness Admin Control Hub

A standalone **Electron + React** desktop console for the Uttar Fitness
Firebase project. It runs entirely on your own laptop, connects to your Firebase
project with a service account, and lets you:

- **Overview** — total users, active / admin / suspended counts, new sign-ups per
  day (last 14 days), and a recent sign-up + sign-in activity feed.
- **Users** — search by name, email, or UID; filter by role and status; page
  through every account; open a detail drawer.
- **Manage** — view a user's profile, activity counters and recent workouts,
  **change their role** (Admin ⇄ User) and **suspend / restore** their account.

Everything is free and local: no server, no hosting, no billing.

---

## 1. Requirements

- **Node.js 20+** (this project was built with Node 20.20).
- A Firebase project with the **Blaze** (pay-as-you-go) plan enabled — the Admin
  SDK's `listUsers` API needs it, and the free tier still applies to normal use.

## 2. Install

```bash
cd admin-desktop
npm install
```

## 3. Get a service account key

The app talks to Firebase with the **Admin SDK**, which needs a *service account*
(not the public web config the mobile app uses). A service account can read every
user and change roles, so **treat it like a password**.

1. Open the [Firebase console](https://console.firebase.google.com/) and pick your
   project.
2. ⚙️ **Project settings → Service accounts → Generate new private key**.
3. Download the JSON file. It looks like:

   ```json
   {
     "project_id": "xfit-723dd",
     "client_email": "firebase-adminsdk-xxxxx@xfit-723dd.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   }
   ```

4. Copy `admin-desktop/.env.example` to `admin-desktop/.env` and fill in the values:

   ```dotenv
   FIREBASE_PROJECT_ID=xfit-723dd
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xfit-723dd.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

   Paste the private key exactly as it appears in the JSON — **keep the `\n`
   sequences and wrap the whole value in double quotes**. The app converts them
   back to real newlines.

   > Alternative: instead of the three values above you can set
   > `FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/serviceAccountKey.json` (or use
   > Application Default Credentials via `GOOGLE_APPLICATION_CREDENTIALS`).

`.env` is **git-ignored** — never commit it or paste it anywhere.

## 4. Run it

```bash
npm start          # builds the UI, then opens the desktop window
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm start` | Build the renderer and launch the Electron app. |
| `npm run dev` | Hot-reloading development: Vite dev server + Electron together. |
| `npm run build` | Build the renderer into `dist/` (no window). |
| `npm run preview:web` | Serve the UI in a normal browser using **sample data** (no Firebase). |
| `npm run smoke` | Check that the privileged data layer loads and reads `.env`. |
| `npm run dist` | Package a distributable with electron-builder (`release/`). |

If `.env` is missing or incomplete, the app opens a **"Connect Firebase"** screen
with the exact steps above instead of failing.

## 5. Preview without credentials

`npm run preview:web` opens the UI at <http://127.0.0.1:5173> with an in-memory
**sample data** backend, so you can explore every screen before wiring up the
service account. A "Sample data" badge is shown in that mode. Inside Electron the
real Firebase backend is always used.

---

## 6. Install it as a Mac app (no terminal)

You can build a real double-clickable `.app` so you never touch the terminal again.

```bash
cd ~/Desktop/xfit/admin-desktop
npm run dist        # builds the .app and a .dmg into ./release
npm run setup:app   # copies your credentials into the app's config folder
```

Then either:

- open `release/Uttar Fitness Admin Control Hub-1.0.0-arm64.dmg` and drag
  **Uttar Fitness Admin Control Hub** into **Applications**, or
- drag `release/mac-arm64/Uttar Fitness Admin Control Hub.app` into **Applications**.

Double-click it from Launchpad or Spotlight like any other app. (It's built
unsigned for local use, so if macOS ever warns, right-click → **Open** once.)

### Where the installed app keeps its credentials

The packaged app reads its config from a per-user folder, **not** from inside the
app bundle (so no secret is baked into the app):

```
~/Library/Application Support/Uttar Fitness Admin Control Hub/.env
~/Library/Application Support/Uttar Fitness Admin Control Hub/service-account.json
```

`npm run setup:app` fills those from your project's `.env` + service account.
Re-run it any time you rotate the key. To move the app to another Mac, copy both
of those files to the same folder there.



```
┌─────────────────────────── Electron ───────────────────────────┐
│  Main process (Node)                    Renderer (React)        │
│  ── firebase.js   Admin SDK init ─┐     ── App / Overview       │
│  ── data.js       users, roles    │ IPC ── Users / UserDrawer   │
│  ── ipc.js        request router  │◀───▶  src/lib/api.js         │
│  ── preload.cjs   window.admin ───┘     (contextIsolation)      │
└─────────────────────────────────────────────────────────────────┘
```

- The renderer is sandboxed (`contextIsolation: true`, `nodeIntegration: false`)
  and never touches Firebase or Node directly. The preload script exposes a tiny
  `window.admin` bridge; every call returns `{ ok, data }` or `{ ok, error }`.
- The main process merges **Firebase Auth** records with each `users/{uid}`
  Firestore profile and caches the result for 30 seconds.

### How "role" and "suspend" map to the database

| Action | Implementation |
| --- | --- |
| **Role = Admin** | Firebase Auth custom claim `admin: true`. This is exactly what `firestore.rules` checks (`request.auth.token.admin == true`). |
| **Role = User** | The `admin` claim is removed. |
| **Suspend account** | Firebase Auth `disabled: true` — the user can no longer sign in. Their data is kept. |
| **Restore account** | `disabled: false`. |

> Role changes take effect the next time the user's ID token refreshes (the app
> already forces a refresh on sign-in). Suspending takes effect immediately for
> new sign-ins.

### Schema read from your project

- `users/{uid}` — `email`, `full_name`, `profile_picture`, `fitness_goal`,
  `experience_level`, `preferred_types`, `distance_unit`, `goals`,
  `onboarding_complete`, `createdAt`.
- Subcollections counted in the detail drawer — `workouts`, `customWorkouts`,
  `healthLogs`, `runs`, `weightLogs`, `checkins`, `followers`, `customFoods`;
  recent `workouts` show `completedAt`, `duration_seconds`, `calories_burned`.

## Security notes

- The service account bypasses `firestore.rules` by design. Keep `.env` private.
- The packaged app **excludes `.env`** (see the `build.files` list in
  `package.json`); credentials are read from the file next to `package.json` at
  runtime, never bundled into the renderer.
- The renderer runs under a strict Content-Security-Policy and cannot reach the
  network or Node APIs directly.

## Troubleshooting

- **"Connect Firebase" screen** — `.env` is missing `FIREBASE_CLIENT_EMAIL` /
  `FIREBASE_PRIVATE_KEY`, or the key has broken newlines. Re-paste it quoted,
  keeping the `\n` sequences.
- **`PERMISSION_DENIED` / billing errors** — enable the Blaze plan; the Admin
  SDK's user listing requires it.
- **Nothing loads in `npm run preview:web`** — that mode intentionally shows
  sample data, not your real users.
