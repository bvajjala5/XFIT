# Uttar Fitness AI proxy

Holds your Gemini and Stripe keys on the server so they never ship in the app. The app sends the
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

## Uttar AI allowances / upgrades

The proxy keeps the abuse limiter (10 requests/min per user) separate from a monthly allowance.
Without extra setup, the existing app behavior is unchanged and the reported allowance is
informational only.

To enforce allowances and enable purchases:

1. Create two KV namespaces and uncomment their bindings in `wrangler.toml`:

   ```bash
   npx wrangler kv namespace create AI_USAGE
   npx wrangler kv namespace create AI_ENTITLEMENTS
   ```

2. Set Stripe secrets:

   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

3. Create three Stripe products/prices (a recurring Pro plan and two one-time top-up packs), then
   set `STRIPE_PRO_PRICE_ID`, `STRIPE_TOPUP_SMALL_PRICE_ID`, and `STRIPE_TOPUP_LARGE_PRICE_ID`.
   Exact prices and pack sizes are product decisions; request/token defaults live in `wrangler.toml`.

4. Add a Stripe webhook endpoint pointing to
   `https://xfit-ai-proxy.<you>.workers.dev/stripe/webhook` and subscribe to:

   - `checkout.session.completed`
   - `customer.subscription.deleted`

5. Redeploy the Worker. Web purchases use Stripe hosted checkout on the web/PWA. Android/Play
   builds show an informational upgrade screen until Google Play Billing is added.

The Worker returns `usage` on successful `/` and `/usage` responses:
`plan`, `requestsUsed/Limit/Remaining`, `tokensUsed/Limit/Remaining`, `periodEnd`, `byMode`, and
`persisted`. A 402 response with `code: "AI_LIMIT_REACHED"` means the monthly allowance is spent;
the UI shows the upgrade path.

## Test

```bash
node --test worker/auth.test.mjs worker/quota.test.mjs
```

## Notes

- The built-in rate limit (10 requests/min per user) is best-effort per Worker instance.
  For hard limits add a Cloudflare Rate Limiting rule on the Worker route in the dashboard.
- Also set a daily quota / budget alert on the key in Google AI Studio / Cloud Console.
- Admin analytics uses count-only product telemetry in user-owned `analyticsDays` docs. Exact
  Stripe revenue and Gemini billing remain in those vendor dashboards.
- Bringing the AI chat feature back later: add a chat page that calls `callAI()` from `src/lib/ai.js`
  with a system prompt — no new server work needed.
