# Deploying FAM VAULT

FAM VAULT is **two pieces**:

```
  Browser
     │
     ├── React site        ──►  Netlify   (static files: HTML/CSS/JS)
     │
     └── Laravel API  ───────►  Render / Railway / Fly  (PHP + database)
                │
                └── Cloudflare Worker ─► R2 bucket (photo bytes)
```

Netlify **cannot run PHP**, so the API is hosted separately and the frontend is
pointed at it. This guide covers both.

- **Part 1** — deploy the API (Docker image already in the repo).
- **Part 2** — deploy the frontend to Netlify.
- **Part 3** — connect them (API URL + CORS) and verify.

---

## 0. Before you start

You need:

1. The code pushed to GitHub — it already is:
   `https://github.com/Officialmunchkin/sijui`
2. A free **Render** account → https://render.com (Part 1, recommended)
   *or* a **Railway** account → https://railway.com (alternative).
3. A free **Netlify** account → https://netlify.com (Part 2).

### Generate a production APP_KEY (do this once)

On your machine, inside `backend/`:

```powershell
php artisan key:generate --show
```

It prints something like `base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=`.
**Copy it** — you'll paste it as `APP_KEY` in Part 1 and it must never change
(it encrypts the saved member passwords).

---

## 1. Deploy the API

### Option A — Render (recommended)

Render builds the included `backend/Dockerfile` for you.

1. **Create the database first** (for data that survives redeploys).
   *Dashboard → New → Postgres* → name it `famvault`, choose the **Free** plan →
   **Create**. When it's ready, open it and copy the **Internal Database URL**
   (starts with `postgres://…`).

2. **Create the web service.**
   *Dashboard → New → Web Service* → **Build and deploy from a Git repository**
   → pick `sijui`.

   | Setting | Value |
   |---|---|
   | Name | `famvault-api` |
   | Region | same region as the database |
   | Language / Runtime | **Docker** |
   | Root Directory | `backend` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | Free |

3. **Add environment variables** (expand *Advanced → Environment Variables*).
   Use `backend/.env.production.example` as the checklist:

   | Key | Value |
   |---|---|
   | `APP_KEY` | the `base64:…` value from step 0 |
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `DB_CONNECTION` | `pgsql` |
   | `DB_URL` | the **Internal** Database URL you copied |
   | `SESSION_DRIVER` | `database` |
   | `CACHE_STORE` | `database` |
   | `QUEUE_CONNECTION` | `sync` |
   | `WORKER_API_URL` | `https://famvault-r2.famvault.workers.dev` |
   | `WORKER_ROLE_HEADER` | `X-Famvault-Role` |
   | `WORKER_MEMBER_ROLE` | `member` |
   | `R2_BUCKET_NAME` | `familyvault` |
   | `FAMVAULT_ADMIN_ID` | `herman` |
   | `FAMVAULT_SESSION_DAYS` | `30` |

   Leave `CORS_ALLOWED_ORIGINS` / `APP_URL` / `FRONTEND_URL` for Part 3.

4. **Deploy.** Watch the logs. You want to see:

   ```
   [entrypoint] running migrations
   [entrypoint] seeding (idempotent…)
   [entrypoint] serving on 0.0.0.0:10000
   ```

5. **Copy your API URL** — the top of the service page, e.g.
   `https://famvault-api.onrender.com`.

> **Free-tier notes:** Render's free web service sleeps after ~15 min idle
> (the next visit takes ~30–60 s to wake) and its free Postgres expires after
> 30 days. To keep it permanently, use a small paid instance, or see
> *SQLite + volume* below.

### Option B — Railway (no Docker needed)

Railway auto-detects PHP, so it ignores the Dockerfile and uses Nixpacks.

1. *New Project → Deploy from GitHub repo →* `sijui`.
2. Service **Settings → Root Directory** = `backend`.
3. **Settings → Deploy → Start Command**:
   ```
   php artisan migrate --force && php artisan db:seed --force; php artisan serve --host=0.0.0.0 --port=$PORT
   ```
4. **Variables** — same list as the table above. For the database add
   *New → Database → PostgreSQL*, then set `DB_CONNECTION=pgsql` and
   `DB_URL=${{Postgres.DATABASE_URL}}`.
5. **Settings → Networking → Generate Domain** to get the public API URL.

### Persistence: SQLite + a volume (instead of Postgres)

If you'd rather stay on SQLite, attach a persistent volume and point the DB at
it:

- **Render:** requires a paid instance → add a **Disk**, mount path `/data`,
  then set `DB_CONNECTION=sqlite` and `DB_DATABASE=/data/database.sqlite`.
- **Railway:** add a **Volume**, mount path `/data`, then set the same two
  variables.

The entrypoint creates the file and migrates on first boot. Never mount the
volume over `backend/database/` — the migrations live there.

---

## 2. Deploy the frontend to Netlify

The repo already contains `netlify.toml` at the root, which tells Netlify to
build only `frontend/`.

1. *Netlify → Add new site → Import an existing project → GitHub →* `sijui`.
2. Netlify reads `netlify.toml` (base `frontend`, command `npm run build`,
   publish `dist`). Leave the build settings as detected.
3. **Before deploying**, add one environment variable
   (*Site configuration → Environment variables*):

   | Key | Value |
   |---|---|
   | `VITE_API_BASE` | your API URL from Part 1, **no trailing slash** — e.g. `https://famvault-api.onrender.com` |

4. **Deploy site.** Netlify gives you a URL like
   `https://cheerful-cat-1234.netlify.app`.

> **Drag-and-drop instead?** Run `cd frontend && npm run build`, then drag the
> `frontend/dist` folder onto Netlify. Set `VITE_API_BASE` in the Netlify
> environment variables **before** building, otherwise it will default to
> `http://127.0.0.1:8000`.

---

## 3. Connect the two

Now tell the API about the Netlify origin (this is the CORS allow-list).

1. Back in **Render/Railway → your API service → Environment**, set:

   | Key | Value |
   |---|---|
   | `APP_URL` | `https://famvault-api.onrender.com` |
   | `FRONTEND_URL` | `https://cheerful-cat-1234.netlify.app` |
   | `CORS_ALLOWED_ORIGINS` | `https://cheerful-cat-1234.netlify.app` |

   (Exact origin, scheme included, **no trailing slash**. Multiple origins are
   comma-separated.)

2. **Redeploy/restart the API** so it picks up the new values.

3. **Verify:**

   - Open `https://YOUR-API/api/health` → should return JSON.
   - Open your Netlify URL → the login screen appears.
   - Log in as `herman` (first login sets the password), upload a photo, and
     check it renders. Then try "CONTINUE AS GUEST" and confirm the ADMIN/TRASH
     tabs are hidden.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Site loads but every action says *REQUEST FAILED* | `VITE_API_BASE` wrong, or CORS not set. Confirm the API URL and that `CORS_ALLOWED_ORIGINS` exactly matches the Netlify origin; redeploy after changing env. |
| CORS error in the browser console | The origin must be full and exact (`https://…netlify.app`, no trailing `/`). Netlify preview URLs like `https://abc--site.netlify.app` are *different* origins. |
| API container exits with *APP_KEY is NOT set* | Add `APP_KEY` from step 0 as an environment variable. |
| *Unsupported cipher or incorrect key length* | `APP_KEY` isn't a `base64:…` value — regenerate with `php artisan key:generate --show`. |
| Passwords show *— NOT SET —* after redeploy | `APP_KEY` changed (SQLite reset, or you set a new key). Keep APP_KEY stable and use a persistent DB. |
| Photos upload but don't load | The API couldn't reach the Worker. Check `WORKER_API_URL` and the API logs. |
| Free Render service very slow on first hit | It was asleep. Upgrade the instance to keep it warm. |

---

## What was added for deployment

```
netlify.toml                          # Netlify build config (frontend only)
backend/Dockerfile                    # portable API image
backend/.dockerignore
backend/docker/entrypoint.sh          # migrate + idempotent seed + serve
backend/.env.production.example       # env checklist
```
