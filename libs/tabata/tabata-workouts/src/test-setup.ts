import '@angular/localize/init';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Polyfill fetch for Firebase Auth in Node.js test environment
if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = jest.fn();
    globalThis.Request = jest.fn() as unknown as typeof Request;
    globalThis.Response = jest.fn() as unknown as typeof Response;
    globalThis.Headers = jest.fn() as unknown as typeof Headers;
}

setupZoneTestEnv({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
});
