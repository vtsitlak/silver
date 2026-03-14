import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Polyfill fetch for Firebase Auth (pulled in via auth lib) in Node.js test environment
if (typeof globalThis.fetch === 'undefined') {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn();
    (globalThis as unknown as { Request: unknown }).Request = jest.fn();
    (globalThis as unknown as { Response: unknown }).Response = jest.fn();
    (globalThis as unknown as { Headers: unknown }).Headers = jest.fn();
}

setupZoneTestEnv({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
});
