/**
 * Mock for @silver/tabata/helpers (ToastService) used in unit tests.
 */
export const ToastServiceMock = class {};
export const ToastControllerMock = class {};

// Some tabata components/stores import `@silver/shared/helpers` utilities.
// Jest maps that module to this mock, so we provide lightweight equivalents
// for the bits we need during unit tests.
export function deepEqual<T>(a: T, b: T): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export const isDeepEqual = (valueA: object, valueB: object): boolean => {
    // For tests we only need a stable equality check; match `deepEqual`.
    return JSON.stringify(valueA) === JSON.stringify(valueB);
};

export const cloneDeep = <T>(value: T): T => {
    // Avoid structuredClone compatibility issues across test environments.
    return JSON.parse(JSON.stringify(value)) as T;
};

export function isNonNullish<T>(item: T): item is NonNullable<T> {
    return item !== null && item !== undefined;
}
