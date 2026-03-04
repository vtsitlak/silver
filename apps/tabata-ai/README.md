# Tabata AI

> **This project is still in progress.** Many features are missing or incomplete. The app provides a basic shell (auth, tabs, placeholder screens) and is under active development.

---

## What it is

**Tabata AI** is a Tabata-style workout application built with Angular and Ionic inside the Silver Nx monorepo. It targets web and mobile (iOS/Android) via Capacitor and uses Firebase for authentication.

---

## Status: In progress

- **Authentication** — Login, register, forgot password, and profile updates are implemented (Firebase).
- **Shell** — Tab navigation (Home, Workouts, History, Profile) and a simple home screen exist.
- **Exercises** — Backend integration with [ExerciseDB API](https://www.exercisedb.dev/docs) is in place (service, store, facade); UI to browse or use exercises is **not** fully built yet.
- **Workouts** — Workout storage via Upstash Redis (through Vercel serverless proxy) is implemented. Workout creation UI and timers are **not** implemented.
- **History** — Placeholder only; no real history or statistics.
- **Profile** — Display name and password update work; other profile features are missing.
- **i18n** — English (en), Dutch (nl), and Greek (el) are configured; coverage may be partial.

Expect breaking changes and incomplete flows until the project reaches a stable release.

---

## Tech stack

| Layer         | Technology                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| Framework     | Angular 21, Ionic 8 (standalone components)                                      |
| Auth          | Firebase (Angular Fire), AuthGuard                                               |
| State         | NgRx Signals (AuthStore, AuthFacade; ExercisesStore, ExercisesFacade; WorkoutsStore) |
| Exercises API | [ExerciseDB](https://www.exercisedb.dev) (public API)                            |
| Workouts API  | Upstash Redis via Vercel serverless proxy (`/api/workouts`)                      |
| Mobile        | Capacitor 6                                                                      |
| i18n          | Angular localize (en, nl, el)                                                    |
| Tests         | Jest (unit), Playwright (e2e)                                                    |
| Deployment    | Vercel (static + serverless functions)                                           |

---

## Prerequisites

- Node.js v20+
- Firebase project (for auth); configure environment as needed for the app.
- For e2e: `npx playwright install` (once).

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

## Project structure (high level)

- **`apps/tabata-ai/`** — App entry, routes, styles, and i18n config.
- **`api/`** — Vercel serverless functions (workouts proxy to Upstash, health check).
- **`libs/tabata/auth`** — Login, register, forgot password, profile; AuthStore; AuthFacade.
- **`libs/tabata/home`** — Home tab content.
- **`libs/tabata/workouts`** — Workouts tab (placeholder).
- **`libs/tabata/tabata-workouts`** — WorkoutsStore, WorkoutsService, WorkoutsFacade (Upstash backend).
- **`libs/tabata/history`** — History tab (placeholder).
- **`libs/tabata/profile`** — Profile tab and form.
- **`libs/tabata/ui`** — Tabs and toolbar components.
- **`libs/tabata/exercises`** — ExerciseDB client, ExercisesStore, ExercisesFacade.
- **`libs/tabata/utils`** — Helpers and centralized test mocks (`@silver/tabata/testing`).

Routes: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/tabs/home`, `/tabs/workouts`, `/tabs/history`, `/tabs/profile`. Unauthenticated users are redirected to login.

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
