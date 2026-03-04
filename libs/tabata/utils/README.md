# utils

This library was generated with [Nx](https://nx.dev).

## Overview

The `utils` library provides shared utilities and centralized test mocks for the tabata-ai application.

## Centralized Test Mocks

The `@silver/tabata/testing` path alias exports shared mocks used across all tabata libraries:

```typescript
import { ToastService, ToastController } from '@silver/tabata/testing';
import { IonicMocks } from '@silver/tabata/testing';
```

### Available mocks

- **`shared-helpers.mock.ts`** — Mocks for `@silver/shared/helpers` (ToastService, ToastController).
- **`ionic.mock.ts`** — Mocks for Ionic modules (IonicModule, ToastController).

### Usage in Jest

Each tabata library's `jest.config.ts` uses `moduleNameMapper` to resolve `@silver/shared/helpers` to the centralized mock:

```typescript
moduleNameMapper: {
  '^@silver/shared/helpers$': '<rootDir>/../utils/src/testing/shared-helpers.mock.ts'
}
```

This ensures consistent mocking across all tests and simplifies maintenance.

## Running unit tests

Run `npm run test:tabata` to execute all tabata-related tests, or `nx test utils` for this library only.
