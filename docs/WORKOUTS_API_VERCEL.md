# Workouts API: Vercel proxy + Upstash (token handling)

This project uses a **Vercel serverless proxy** so the Upstash token never appears in the frontend or in the public GitHub repo.

## 1. Repo layout

**Recommended (avoids 404):** API and config at **repo root** so Vercel always finds them.

```
silver/
├── api/
│   └── workouts.ts       ← Proxy: reads UPSTASH_URL + UPSTASH_TOKEN from env
├── apps/
│   └── tabata-ai/        ← Angular 21 app
├── libs/
│   └── tabata/
│       └── tabata-workouts/   ← Store + WorkoutsService (calls /api/workouts)
├── .env                  ← Local only, git-ignored (create from .env.example)
├── .env.example          ← Template (no real values)
└── vercel.json           ← Build + rewrites (used when Root Directory is empty or ".")
```

- **GitHub:** Contains `api/workouts.ts` and `vercel.json` at repo root (logic only). No token.
- **Local:** `.env` at repo root holds `UPSTASH_URL` and `UPSTASH_TOKEN`; it is in `.gitignore`.
- **Vercel:** Leave **Root Directory** empty (or set to `.`). Set `UPSTASH_URL` and `UPSTASH_TOKEN` in the project’s Environment Variables.

---

## 2. Local development

### 2.1 One-time setup

1. **Install Vercel CLI** (optional but recommended for local proxy):
   ```bash
   npm i -g vercel
   ```
   Optional: run `vercel link` in the repo root to link this directory to a Vercel project (so `vercel dev` uses the same env as production).

2. **Create `.env` at repo root** (copy from `.env.example` and fill in):
   ```bash
   cp .env.example .env
   ```
   In `.env`:
   ```env
   UPSTASH_URL=https://integral-hippo-52225.upstash.io
   UPSTASH_TOKEN=your_upstash_rest_token_here
   ```

3. **Run the app with the proxy** (Angular + `/api` on same origin). From the **repo root**:
   ```bash
   vercel dev
   ```
   Vercel CLI uses the project’s Root Directory (`apps/tabata-ai`) and finds `.env` at the repo root. Open the URL it prints (e.g. `http://localhost:3000`).  
   The frontend calls `/api/workouts`; the proxy uses `.env` and talks to Upstash.

### 2.2 Without Vercel CLI

If you don’t use `vercel dev`:

- Run the Angular app as usual: `npx nx serve tabata-ai` (or `npm run start:tabata-ai`).
- `/api/workouts` will not exist locally; only use this for UI work that doesn’t need the API, or run `vercel dev` when you need the proxy.

---

## 3. Deploy to Vercel (production)

### 3.1 Connect GitHub and Root Directory

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New** → **Project** → import the `silver` repository.
3. In **Settings** → **General**, leave **Root Directory** empty (or set to `.`). This way Vercel uses the root `vercel.json` and the root `api/` folder, which avoids 404s on `/api/workouts`.
4. Set **Framework Preset** to **Other** (so Vercel doesn’t look for `.next`).

### 3.2 Set environment variables (required)

Before deploying:

1. In the project, open **Settings** → **Environment Variables**.
2. Add:
   - **`UPSTASH_URL`** = `https://integral-hippo-52225.upstash.io` (or your Upstash REST URL).
   - **`UPSTASH_TOKEN`** = your Upstash REST token (from Upstash dashboard).
3. Apply to **Production** (and Preview if you want).

### 3.3 Deploy

- **Deploy** the project. With Root Directory at repo root, Vercel will:
  - Run `npx nx build tabata-ai` and use `dist/apps/tabata-ai` as the static output.
  - Expose `api/workouts.ts` as `https://<your-project>.vercel.app/api/workouts`.

No token is in the repo or in the browser; only the serverless function uses it.

---

## 4. How the frontend uses the API

The **tabata-workouts** lib’s `WorkoutsService` talks only to the same origin:

- **Base path:** `/api/workouts` (no token, no Upstash URL in the frontend).

**Methods:**

- `getWorkouts()` → `GET /api/workouts` → proxy → Upstash `JSON.GET/tabata_workouts`.
- `addWorkout(workout)` → `POST /api/workouts` → proxy → Upstash `JSON.ARRAPPEND/tabata_workouts/$`.

So the token is only in:

- Your local `.env` (git-ignored).
- Vercel’s Environment Variables (encrypted).

---

## 5. Summary

| Where        | Token / URL |
|-------------|-------------|
| GitHub repo | ❌ None; only proxy logic and config. |
| Local `.env` | ✅ `UPSTASH_URL`, `UPSTASH_TOKEN` (git-ignored). |
| Vercel env vars | ✅ Same variables set in project settings. |
| Frontend (browser) | ❌ Only calls `/api/workouts`; no token. |

For any new environment (e.g. a second Vercel project or a teammate’s machine), add or create `.env` with `UPSTASH_URL` and `UPSTASH_TOKEN` and never commit them.
