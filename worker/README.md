# XFit AI proxy

Holds your Gemini key on the server so it never ships in the app. The app sends the
signed-in user's Firebase ID token; the Worker verifies it, then calls Gemini.

## Deploy (Cloudflare Workers, free tier is fine)

```bash
cd worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY      # paste your NEW Gemini key (see SECURITY note below)
# edit wrangler.toml → ALLOWED_ORIGINS = your real site URL(s)
npx wrangler deploy
```

Wrangler prints a URL like `https://xfit-ai-proxy.<you>.workers.dev`. Put that in the app:

- locally: `VITE_AI_PROXY_URL=<that url>` in `.env`
- production: same variable in your Cloudflare Pages project → Settings → Environment variables, then redeploy

## Test

```bash
node --test worker/auth.test.mjs
```

## Notes
- The built-in rate limit (10 requests/min per user) is best-effort per Worker instance.
  For hard limits add a Cloudflare Rate Limiting rule on the Worker route in the dashboard.
- Also set a daily quota / budget alert on the key in Google AI Studio / Cloud Console.
- Bringing Coach X back later: add a chat page that calls `callAI()` from `src/lib/ai.js`
  with a system prompt — no new server work needed.
