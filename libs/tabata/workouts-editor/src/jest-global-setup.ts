/* Polyfill for Firebase/auth in Node - must run before any imports that load Firebase */
if (typeof globalThis.fetch === 'undefined') {
    (globalThis as unknown as { fetch: unknown }).fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as unknown as Response);
}
if (typeof globalThis.Response === 'undefined') {
    (globalThis as unknown as { Response: unknown }).Response = class {
        ok = true;
        constructor() {}
    };
}
