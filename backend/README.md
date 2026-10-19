# Famvault API (Laravel 11)

Private family album backend. Photo bytes never touch this server — everything
lives in the Cloudflare R2 bucket `familyvault` behind the **famvault-r2
Worker** (`https://famvault-r2.famvault.workers.dev`), which this API proxies,
exactly like the original single-file app did.

## Quick start

```bash
cd backend
composer install
copy .env.example .env     # or: cp .env.example .env
php artisan key:generate
php artisan migrate --seed # seeds the 6 family members, 6 albums, board posts
php artisan storage:link   # public/storage -> storage/app/public
php artisan serve --port=8000
```

Or just run `start.bat` in the repo root — it boots this API on :8000 and the
Vite frontend on :5173.

## API overview

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | – | includes the configured Worker URL |
| POST | `/api/auth/login` | – | `{ memberId, password }` → `{ token, member }`; first login sets the password (original behaviour) |
| POST | `/api/auth/guest` | – | ephemeral view-only guest token |
| GET | `/api/auth/me` | ✔ | current member |
| POST | `/api/auth/logout` | ✔ | revoke session |
| POST | `/api/auth/password` | ✔ | self-service password change |
| GET | `/api/members` | – | member grid (public, guests excluded) |
| GET | `/api/members/{id}` | – | single member |
| POST | `/api/members` | admin | add member |
| PUT | `/api/members/{id}` | admin/self | admin edits all; self edits bio only |
| DELETE | `/api/members/{id}` | admin | cannot delete `herman` |
| POST | `/api/members/{id}/password` | admin | set/reset a member password |
| GET | `/api/members/passwords` | admin | every member's password, decrypted (admin-only "view all") |
| GET | `/api/albums` | – | album name list |
| POST | `/api/albums` | admin | create album (first album is the default/fallback) |
| PUT | `/api/albums/{id}` | admin | rename (Worker `{from,to}` sync) |
| DELETE | `/api/albums/{id}` | member | photos go **straight to TRASH** (stamped with `deleted_by`) |
| GET | `/api/photos` | – | proxied from Worker `/photos` (trashed hidden) |
| GET | `/api/photos/trash` | admin | trash list (admins only) |
| POST | `/api/photos/upload` | member | multipart → Worker `/upload` (guests rejected, 200MB cap) |
| POST | `/api/photos/trash` | member | `{ ids, action: trash\|restore }` (any non-guest may trash) |
| POST | `/api/photos/update-album` | admin | `{ from, to }` |
| DELETE | `/api/photos/{id}` | admin | permanent delete via Worker (purges R2) |
| GET | `/api/photos/file/{key}` | – | same-origin proxy to Worker `/file/<key>` |
| GET | `/api/board` | – | family board posts |
| POST | `/api/board` | member | `{ text }` (guests rejected) |
| PUT | `/api/board` | admin | legacy bulk replace `{ posts: [...] }` |
| PUT/DELETE | `/api/board/{id}` | admin/author | edit / remove a post |

## Auth

Bearer tokens (64-char random, 30-day expiry, `api_sessions` table). Send:

```
Authorization: Bearer <token>
```

or the convenience header `X-Famvault-Token: <token>`.

## Worker bridge — `config/famvault.php`

```
WORKER_API_URL=https://famvault-r2.famvault.workers.dev
WORKER_ROLE_HEADER=X-Famvault-Role     # the Worker's write gate
WORKER_MEMBER_ROLE=member              # value that unlocks writes
WORKER_TIMEOUT=15
R2_BUCKET_NAME=familyvault
FAMVAULT_ADMIN_ID=herman
FAMVAULT_SESSION_DAYS=30
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Write calls to the Worker carry `X-Famvault-Role: member` (the Worker rejects
guests); the API only attaches that header after verifying a real member
session, so the Worker gate stays authoritative.

## Data model

- `members` — the 6 seeded family members (+ any added later); the login source
  of truth is a bcrypt hash, and an AES-encrypted copy (`password_secret`) backs
  the admin-only "view all passwords" panel.
- `albums` — album names (`SUMMER 24`, `XMAS 23`, `BIRTHDAYS`, `WEEKENDS`,
  `FAMILY BBQ`, `ARCHIVE`).
- `photos` — metadata mirror; the only locally-owned state is **trash**
  (the Worker owns everything else).
- `board_posts` — family board; mirrored to the Worker best-effort.
- `api_sessions` — bearer tokens.

## Storage link

`php artisan storage:link` creates `public/storage → storage/app/public` for
any local assets; photo serving normally goes straight to the Worker
(`photo.src`), with `/api/photos/file/{key}` as a same-origin fallback.
