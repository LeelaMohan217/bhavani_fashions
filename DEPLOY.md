# Deploying Bhavani Fashion

| Part | Host | Folder |
|---|---|---|
| Database (PostgreSQL) | **Neon** — free | — |
| API (Express + Prisma) | **Render** — free web service | `backend/` |
| Storefront + admin (Next.js) | **Vercel** — Hobby | `frontend/` |

Do the steps **in this order**: the API needs the database, and the storefront needs the API's URL.

---

## 1. Database — Neon

1. Sign up at **neon.tech** and create a project (region: **Asia Pacific (Singapore)** is closest to India).
2. Copy the **connection string** from the dashboard. It looks like
   `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   Keep it private — it's the database password.

## 2. API — Render

1. Sign up at **render.com** and connect your GitHub account.
2. **New → Blueprint** → choose `LeelaMohan217/bhavani_fashions`. Render reads `render.yaml` and sets up
   `bhavani-fashion-api` (root `backend/`, build, start, health check, and database migrations).
3. When asked for environment variables, enter:
   - `DATABASE_URL` — the Neon connection string from step 1
   - `CORS_ORIGINS` — leave as `http://localhost:3000` for now (update in step 4)
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — leave empty for cash on delivery only (test keys later)
4. Deploy. The first build creates all tables in Neon (`prisma migrate deploy`).
5. Open `https://<your-service>.onrender.com/api/health` — you should see `{"status":"ok", …}`.

### Load the catalogue and create an admin (once, from your computer)

In `backend/`, run these with the **Neon** connection string (it never needs to be saved in a file):

```powershell
$env:DATABASE_URL = "<your Neon connection string>"
npm run db:seed
npm run admin:create -- you@example.com "Your Name"
Remove-Item Env:DATABASE_URL
```

`db:seed` adds the 3 categories and sample products. `admin:create` asks for a password (10+ characters) —
use a strong one for the live site, not the local test password.

> Free Render services sleep after ~15 minutes idle; the first visit afterwards takes ~30–50 seconds.
> Upgrade the Render plan when the store goes live.

## 3. Storefront — Vercel

1. **New Project** → import `LeelaMohan217/bhavani_fashions`.
2. **Root Directory:** `frontend` · **Preset:** Next.js.
3. **Environment Variables:** add `API_URL` = `https://<your-service>.onrender.com` (no trailing slash).
4. Deploy.

The build does not need the API to be reachable — pages fetch their data when visitors arrive — but the site
only shows products once `API_URL` points at a running API.

## 4. Finish up

1. Copy your Vercel URL (e.g. `https://bhavani-fashions.vercel.app`).
2. In Render → the API service → **Environment**, set `CORS_ORIGINS` to that URL and save (it redeploys).
3. Visit the site, then `/admin` and sign in with the admin you created.

## Updating later

Push to `main` on GitHub — Vercel and Render both redeploy automatically. New database migrations are applied by
Render's build step.
