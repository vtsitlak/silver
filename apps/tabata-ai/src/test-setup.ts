import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import '@angular/localize/init';
import { TextEncoder, TextDecoder } from 'util';

// Provide TextEncoder/TextDecoder for the JSDOM environment.
// Jest on Node lacks these globals by default.
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

setupZoneTestEnv({
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
});
