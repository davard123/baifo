# fopusha-api — Cloudflare Worker

Replaces the Render-hosted FastAPI backend (`/backend`). Same 4 endpoints,
backed by the **existing** Supabase tables (`users`, `ancestor_wishes`) — no
schema changes, no data migration. Runs on Cloudflare's edge: no cold start.

## Endpoints (identical contract to the old FastAPI app)

| Method | Path               | Notes |
|--------|--------------------|-------|
| GET    | `/`                | `{ "status": "ok" }` |
| GET    | `/wishes`          | `?limit=1..50` (default 15), optional `?username=`, ordered `id DESC` |
| POST   | `/wishes`          | `{ username, age=30, wish, buddha, blessing, target }` → `{ "status": "success" }` |
| GET    | `/ancestor-wishes` | `?limit=1..50` (default 15), optional `?username=`, ordered `id DESC` |
| POST   | `/ancestor-wishes` | `{ username, age=30, ancestor, ancestor_name, relationship, wish }` → `{ "status": "success" }` |

Validation mirrors the old Pydantic rules: `username`/`wish` must be non-empty
after trimming (else `422`); `limit` clamped to 1..50; `age` defaults to 30.

## One-time setup

```bash
cd worker
npm install

# Set secrets (NEVER commit these). The service_role key is server-side only.
npx wrangler secret put SUPABASE_URL          # e.g. https://xxxx.supabase.co
npx wrangler secret put SUPABASE_SERVICE_KEY  # Supabase service_role key
```

Find both values in Supabase → Project Settings → API
(`Project URL` and `service_role` secret).

## Local test

```bash
# Put the same two values in worker/.dev.vars (gitignored) for local dev:
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_KEY=...
npx wrangler dev
curl http://127.0.0.1:8787/wishes?limit=1
```

## Deploy

```bash
npx wrangler deploy
```

This is a **standalone Worker** (separate from the `baifo` Pages project), so
`wrangler deploy` is correct here — it does NOT conflict with the Git-connected
Pages site. After deploy you get a URL like
`https://fopusha-api.<your-subdomain>.workers.dev`.

### Optional: custom domain `api.fopusha.com`

Uncomment the `[[routes]]` block in `wrangler.toml`, then `wrangler deploy`.
Requires the `fopusha.com` zone to be on this Cloudflare account.

## Point the frontend at the Worker

Update `frontend/.env.production`:

```
VITE_API_BASE=https://fopusha-api.<your-subdomain>.workers.dev
```

Then rebuild + push (`git push origin master`) so Cloudflare Pages redeploys.

## Decommission Render (only after verifying the Worker)

1. Confirm reads/writes work against the Worker URL.
2. Delete the `.github/workflows/render-keepalive.yml` keepalive cron.
3. Suspend/delete the Render service. Keep `/backend` in git as reference.
