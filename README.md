# Silver

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

**Silver** is an [Nx monorepo](https://nx.dev) containing multiple Angular applications and shared libraries. This document describes the workspace structure, technologies, and how to run each project.

---

## Table of contents

- [Technologies](#technologies)
- [Workspace structure](#workspace-structure)
- [Projects overview](#projects-overview)
- [Getting started](#getting-started)
- [Running tasks](#running-tasks)
- [Useful Nx commands](#useful-nx-commands)
- [Useful links](#useful-links)

---

## Technologies

| Area | Stack |
|------|--------|
| **Monorepo** | [Nx](https://nx.dev) 22.x |
| **Frontend** | [Angular](https://angular.dev) 21, [Ionic](https://ionicframework.com/) 8 (tabata-ai), [Angular Material](https://material.angular.io/) (other apps) |
| **State** | [NgRx Signals](https://ngrx.io/guide/signals) (tabata), NgRx Store/Effects (notes, vehicles) |
| **Auth** | [Angular Fire](https://github.com/angular/angularfire) (Firebase Auth) in tabata-ai |
| **Mobile** | [Capacitor](https://capacitorjs.com/) 6 (tabata-ai) |
| **i18n** | [Angular localize](https://angular.dev/guide/i18n-overview) (tabata-ai: en, nl, el) |
| **Testing** | [Jest](https://jestjs.io/) (unit), [Playwright](https://playwright.dev/) (e2e for tabata-ai) |
| **Backend** | [Express](https://expressjs.com/) (notes-server, vehicles-server) |
| **Styling** | SCSS, [Tailwind CSS](https://tailwindcss.com/) where configured |

---

## Workspace structure

```
silver/
├── apps/
│   ├── tabata-ai/          # Tabata workout app (Angular + Ionic + Firebase) — in progress
│   ├── tabata-ai-e2e/      # E2E tests for tabata-ai (Playwright)
│   ├── notes-app/          # Notes Angular app
│   └── vehicles-app/       # Vehicles Angular app
├── libs/
│   ├── tabata/             # Feature libs for tabata-ai
│   │   ├── auth/           # Auth (login, register, forgot password, Firebase)
│   │   ├── home/
│   │   ├── workouts/
│   │   ├── history/
│   │   ├── profile/
│   │   ├── ui/             # Tabs, toolbar, shared UI
│   │   ├── exercises/      # Exercise DB API service, store, facade
│   │   └── utils/
│   ├── notes/              # Notes feature libs
│   │   ├── notes-auth/
│   │   ├── notes-ui/
│   │   ├── notes-store/
│   │   └── notes-server/
│   ├── vehicles/           # Vehicles feature libs
│   │   ├── vehicles-ui/
│   │   ├── vehicles-store/
│   │   └── vehicles-server/
│   └── shared/
│       └── helpers/        # Shared utilities (e.g. ToastService)
├── nx.json
├── package.json
└── README.md
```

---

## Projects overview

| Project | Type | Description |
|--------|------|-------------|
| **tabata-ai** | App | Tabata workout app with auth, tabs (Home, Workouts, History, Profile). **Still in progress — many features are missing.** See [apps/tabata-ai/README.md](apps/tabata-ai/README.md). |
| **tabata-ai-e2e** | E2E | Playwright tests for tabata-ai. Run after `npx playwright install` if needed. |
| **notes-app** | App | Notes application (Angular + Express server). |
| **vehicles-app** | App | Vehicles demo app with JSON server backend. |
| **auth** | Lib | Firebase auth, login/register/forgot-password, AuthStore/AuthFacade. |
| **home**, **workouts**, **history**, **profile** | Lib | Tabata tab feature components. |
| **ui** | Lib | Tabata shared UI (tabs, toolbar). |
| **exercises** | Lib | Exercise data (ExerciseDB API), ExercisesStore, ExercisesFacade. |
| **utils** | Lib | Tabata utilities. |
| **notes-auth**, **notes-ui**, **notes-store**, **notes-server** | Lib | Notes feature and Express server. |
| **vehicles-ui**, **vehicles-store**, **vehicles-server** | Lib | Vehicles feature and server. |
| **helpers** | Lib | Shared helpers (e.g. ToastService). |

---

## Getting started

### Prerequisites

- **Node.js** (v20+ recommended)
- **npm** or **yarn**

### Install dependencies

```sh
npm install
```

### Optional: Playwright browsers (for tabata-ai e2e)

If you plan to run e2e tests for tabata-ai:

```sh
npx playwright install
```

---

## Running tasks

### Tabata AI app

> **Note:** This app is **in progress**. Many features are still missing. See [apps/tabata-ai/README.md](apps/tabata-ai/README.md).

| Task | Command |
|------|---------|
| Serve (dev) | `npx nx serve tabata-ai` or `npm run start:tabata-ai` |
| Build | `npx nx build tabata-ai` |
| Build (localized) | `npm run build-localize:tabata-ai` |
| Unit tests | `npx nx test tabata-ai` |
| E2E tests | `npx nx run tabata-ai-e2e:e2e` |

### Notes app

Run both server and app (in separate terminals):

1. **Server:** `npm run server:notes-app` → http://localhost:9000  
2. **App:** `npm run start:notes-app` → http://localhost:4200  

### Vehicles app

| Task | Command |
|------|---------|
| Serve app | `npm run start:vehicles-app` |
| Run server | `npm run server:vehicles-app` |

### Run any project's targets

List targets for a project:

```sh
npx nx show project tabata-ai
```

Run a target:

```sh
npx nx <target> <project>
# e.g. npx nx test auth
```

---

## Useful Nx commands

| Command | Description |
|---------|-------------|
| `npx nx graph` | Visualize project and task dependencies |
| `npx nx list` | List installed Nx plugins |
| `npx nx run-many -t test -p auth,home,ui` | Run tests for multiple projects |
| `npx nx format:write` | Format code (see `npm run format`) |

---

## Add new projects

Use Nx generators instead of manual setup:

- **New Angular app:** `npx nx g @nx/angular:app my-app`
- **New library:** `npx nx g @nx/angular:lib mylib`

Use [Nx Console](https://nx.dev/getting-started/editor-setup) in your IDE to browse plugins and generators.

---

## Useful links

- [Nx docs](https://nx.dev)
- [Angular monorepo tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial)
- [Nx on CI](https://nx.dev/ci/intro/ci-with-nx)
- [Nx Console](https://nx.dev/getting-started/editor-setup)
- [Nx community (Discord, X, LinkedIn, YouTube, blog)](https://nx.dev/getting-started/community)
