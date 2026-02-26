# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Tabata AI is an Ionic + Angular hybrid mobile/web application built in an Nx monorepo. There is a single app (`tabata-ai`) and its e2e test project (`tabata-ai-e2e`). No backend services or databases are required.

### Node version

This project requires **Node.js 20**. The CI uses `node: 20` and `npm ci --legacy-peer-deps`. If nvm is available, run `nvm use 20` before any npm/nx commands.

### Key commands

See `README.md` for full list. Summary:

| Task | Command |
|------|---------|
| Install deps | `npm ci --legacy-peer-deps` |
| Dev server | `npx nx serve tabata-ai` (serves on `http://localhost:4200`) |
| Lint | `npx nx lint tabata-ai` |
| Unit tests | `npx nx test tabata-ai` |
| Build (prod) | `npx nx build tabata-ai` |
| E2E tests | `npx nx e2e tabata-ai-e2e` |
| Playwright browsers | `npx playwright install --with-deps` |

### Pre-existing issues in scaffolded code

- **Lint**: 7 pre-existing ESLint errors from the Ionic scaffolding (component class suffix naming convention, empty constructors). These are in `tab1.page.ts`, `tab2.page.ts`, `tab3.page.ts`, and `tabs.page.ts`.
- **Unit tests**: 5 of 6 test suites fail due to `@stencil/core` ESM import incompatibility with Jest's `transformIgnorePatterns`. Only `explore-container.component.spec.ts` passes. This is a known Ionic/Stencil + Jest configuration gap in the scaffolded setup.
- **E2E tests**: The default Playwright test (`example.spec.ts`) expects an `h1` containing "Welcome", but the Ionic tabs template renders "Tab 1 page" etc. All 3 browser tests (chromium, firefox, webkit) fail due to this content mismatch.

### Gotchas

- `npm ci` requires `--legacy-peer-deps` due to peer dependency conflicts between Ionic/Capacitor packages.
- The Nx Cloud workspace token is expired/unclaimed, producing non-blocking warnings (`code: 401`) on every nx command. This does not affect local development.
- The production build exceeds the default 500 kB budget by ~57 kB, producing a warning (not an error).
