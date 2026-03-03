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

3. **Run the app with the proxy** (Angular + `/api` on same origin). Either:

   **Option A – Local API script (recommended for `nx serve`):**
   - In a first terminal, from **repo root**:
     ```bash
     node apps/tabata-ai/scripts/local-workouts-api.cjs
     ```
     (Leave it running; it serves `/api/workouts` on port 3100 using `.env`.)
   - In a second terminal:
     ```bash
     nx serve tabata-ai
     ```
   - Open `http://localhost:4200`. The dev server proxies `/api` to port 3100.

   **Option B – Vercel CLI:**  
   From the **repo root**, run `vercel dev` and open the URL it prints. Vercel serves both the app and the API.

### 2.2 Without the proxy

If you don’t run the local API script or `vercel dev`:

- `nx serve tabata-ai` will run, but requests to `/api/workouts` will 404. Start the local proxy (Option A above) or use `vercel dev` when you need the workouts API.

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

---

## 6. Troubleshooting: 404 NOT_FOUND

If you see **404 NOT_FOUND** (e.g. when calling `GET /api/workouts` from the app or Postman):

1. **Confirm the failing URL**  
   Check the exact request URL in the browser Network tab or in the error. It should be `https://<your-deployment>.vercel.app/api/workouts` (no typo, no extra slash).  
   You can also open `https://<your-deployment>.vercel.app/api/health` in the browser: if it returns `{"ok":true}`, the `api/` folder is deployed and the issue is specific to `/api/workouts`; if it 404s, the whole API layer is missing from the deployment.

2. **Root Directory**  
   In Vercel → **Project** → **Settings** → **General** → **Root Directory**: leave **empty** (or `.`).  
   If Root Directory is set to e.g. `apps/tabata-ai`, then the `api/` folder must live under that path (i.e. `apps/tabata-ai/api/workouts.ts`). This repo has both root `api/workouts.ts` and `apps/tabata-ai/api/workouts.ts`; use **one** layout and stick to it (recommended: repo root, so Root Directory empty).

3. **Deployment logs**  
   In Vercel → **Deployments** → open the latest deployment → **Building** / **Functions**. Ensure the serverless function for `api/workouts` is listed. If only static files are deployed and no functions appear, the project root or build config may be wrong.

4. **Redeploy**  
   After changing Root Directory or `vercel.json`, trigger a new deployment. The 404 can be from an old deployment that didn’t include the API.

5. **Vercel NOT_FOUND reference**  
   [Vercel NOT_FOUND](https://vercel.com/docs/errors/NOT_FOUND): check deployment URL, deployment existence, logs, and permissions.
