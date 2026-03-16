# Tabata AI

> **Demo app** — for learning and example code only. Not for commercial use. **Tested only on web and Android (OnePlus 10 Pro).** When viewed from web, switch to **mobile view** (browser DevTools or responsive mode) for the best experience.

---

## What it is

**Tabata AI** is a Tabata-style workout application built with Angular and Ionic inside the Silver Nx monorepo. It targets web and mobile (iOS/Android) via Capacitor and uses Firebase for authentication. Use it to explore Tabata workout flows, AI-generated workouts, and modern Angular patterns.

---

## Live demo

- **Deployed app**: [https://silver-tabata-ai.vercel.app/](https://silver-tabata-ai.vercel.app/)

---

## Status

- **Authentication** — Login, register, forgot password, profile updates (Firebase).
- **Shell** — Tab navigation (Dashboard, Workouts, History, Profile), toolbar with About modal.
- **Exercises** — [ExerciseDB API](https://www.exercisedb.dev/docs) integration (service, store, facade); exercise selector and details modals.
- **Workouts** — Create/edit workouts; “Generate with AI” (Google Gemini); workout storage via Upstash Redis through Vercel serverless proxy.
- **History** — History, Most Used, Favorites segments.
- **Profile** — Display name, email, password update; logout with confirm.
- **i18n** — English (en), Dutch (nl), Greek (el) configured.
- **Testing** — Tested only on web and Android (OnePlus 10 Pro); iOS and other devices have not been tested.

---

## Tech stack

| Layer            | Technology                                                                            |
| ---------------- | ------------------------------------------------------------------------------------- |
| Framework        | Angular 21, Ionic 8 (standalone components, Signals, control flow)                    |
| Auth             | Firebase (Angular Fire), AuthGuard                                                    |
| State            | NgRx-style facades and stores; Angular Signals for reactive UI and computed values    |
| Exercises API    | [ExerciseDB](https://www.exercisedb.dev) (public API)                                 |
| Workouts / AI    | REST API generate-workout serverless function (Google Gemini); secret API keys in env |
| Workouts storage | Upstash Redis via Vercel serverless proxy (`/api/workouts`)                           |
| Deployment       | Vercel (static + serverless functions)                                                |
| Environment      | Secret API keys via env vars (e.g. `GEMINI_API_KEY`)                                  |
| Mobile           | Capacitor 6 (iOS / Android)                                                           |
| i18n             | Angular localize (en, nl, el)                                                         |
| Tests            | Jest (unit), Playwright (e2e)                                                         |

---

## How to use

- **Dashboard** — Last and popular workouts, quick play.
- **Workouts** — Browse, create, or edit. Use “Generate with AI” on the create flow for an AI-generated structure.
- **History** — Workout history, Most Used, and Favorites.
- **Profile** — Display name, email, password. Log out from here.
- **Toolbar (ℹ)** — About modal with demo disclaimer, technologies, and state management overview.

---

## Prerequisites

- Node.js v20+
- Firebase project (for auth); configure environment as needed for the app.
- For e2e: `npx playwright install` (once).

**Web preview:** When running in the browser, use Chrome DevTools device toolbar (or responsive mode) and select a mobile device for the intended layout.

---

## Commands

From the **monorepo root** (`silver/`):

| Task                         | Command                                               |
| ---------------------------- | ----------------------------------------------------- |
| Development server           | `npx nx serve tabata-ai` or `npm run start:tabata-ai` |
| Build                        | `npx nx build tabata-ai`                              |
| Localized build (en, nl, el) | `npm run build-localize:tabata-ai`                    |
| Unit tests (all tabata libs) | `npm run test:tabata`                                 |
| E2E tests                    | `npm run e2e:tabata-ai`                               |
| Extract i18n                 | `npm run xi18n:tabata-ai`                             |
| Lint                         | `npx nx lint tabata-ai`                               |

Default dev URL: http://localhost:4200 (or as shown in the terminal).

---

## Screenshots

> Note: Layout is optimized for mobile view. Screenshots are indicative; use DevTools responsive mode to match the intended size.

- **Login**  
  ![Tabata AI Login](./docs/screenshots/login.png)

- **Dashboard**  
  ![Tabata AI Dashboard](./docs/screenshots/dashboard.png)

- **Workouts**  
  ![Tabata AI Workouts](./docs/screenshots/workouts.png)

---

## Project structure (high level)

- **`apps/tabata-ai/`** — App entry, routes, styles, and i18n config.
- **`api/`** — Vercel serverless functions (workouts proxy to Upstash, health check).
- **`libs/tabata/auth`** — Login, register, forgot password, profile; AuthStore; AuthFacade.
- **`libs/tabata/dashboard`** — Dashboard tab content.
- **`libs/tabata/workouts`** — Workouts tab (list, create, details).
- **`libs/tabata/workouts-editor`** — Workout create/edit flow, AI preview modal.
- **`libs/tabata/tabata-workouts`** — WorkoutsStore, WorkoutsService, WorkoutsFacade (Upstash backend).
- **`libs/tabata/history`** — History tab (History, Most Used, Favorites).
- **`libs/tabata/profile`** — Profile tab and form.
- **`libs/tabata/ui`** — Tabs and toolbar components.
- **`libs/tabata/exercises`** — ExerciseDB client, ExercisesStore, ExercisesFacade.
- **`libs/tabata/utils`** — Helpers and centralized test mocks (`@silver/tabata/testing`).

Routes: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/tabs/dashboard`, `/tabs/workouts`, `/tabs/history`, `/tabs/profile`. Unauthenticated users are redirected to login.

## Deployment (Vercel)

The app is deployed to Vercel with serverless functions for the workouts API. See [docs/WORKOUTS_API_VERCEL.md](../../docs/WORKOUTS_API_VERCEL.md) for setup instructions.

Key points:

- **Root Directory** in Vercel should be **empty** (repo root).
- Environment variables `UPSTASH_URL` and `UPSTASH_TOKEN` must be set in Vercel.
- The `/api/workouts` endpoint proxies requests to Upstash Redis.
- Use `/api/health` to verify the API is deployed correctly.

---

## E2E and test users

E2E tests (in `apps/tabata-ai-e2e/`) assume a running app and optional `.env` with:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Create a test user in your Firebase project if you want the auth e2e test to succeed.

---

## Main README

For monorepo-wide setup, technologies, and all projects, see the root [README.md](../../README.md).
