import { inject, Injector, runInInjectionContext } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { isObservable, lastValueFrom } from 'rxjs';

/**
 * Delegates to the real guard inside the lazy-loaded `workouts-editor` library.
 * Keeps `tabs.routes` (and this file) free of static imports from that chunk.
 *
 * After `await import()`, execution is no longer in an injection context; the inner guard uses
 * `inject()`, so we capture {@link Injector} synchronously and run the implementation inside
 * {@link runInInjectionContext}.
 */
export const workoutEditorCanDeactivateGuard: CanDeactivateFn<unknown> = async (component, route, state, nextState) => {
    const injector = inject(Injector);
    const { workoutEditorCanDeactivateGuard: impl } = await import('@silver/tabata/workouts-editor');
    return runInInjectionContext(injector, () => {
        const result = impl(component as never, route, state, nextState);
        if (isObservable(result)) {
            return lastValueFrom(result);
        }
        return Promise.resolve(result);
    });
};
