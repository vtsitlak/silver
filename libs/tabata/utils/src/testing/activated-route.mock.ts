/**
 * Factory for mock ActivatedRoute used in unit tests.
 */

export interface MockActivatedRouteOverrides {
    paramMap?: { get: (k: string) => string | null };
    routeConfig?: { path: string };
}

/**
 * Creates a mock ActivatedRoute snapshot.
 * @param overrides - Optional paramMap getter and/or routeConfig (path).
 */
export function createMockActivatedRoute(overrides: MockActivatedRouteOverrides = {}): {
    snapshot: { paramMap: { get: (k: string) => string | null }; routeConfig?: { path: string } };
} {
    return {
        snapshot: {
            paramMap: { get: (k: string) => overrides.paramMap?.get(k) ?? null },
            routeConfig: overrides.routeConfig ?? { path: 'warmup' }
        }
    };
}
