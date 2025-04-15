import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

interface Errors {
    [key: string]: string;
}

export const ErrorsStore = signalStore(
    { providedIn: 'root' },
    withState<{ _errors: Errors }>({
        _errors: {}
    }),
    withComputed(({ _errors }) => ({
        errors: computed(() => Object.keys(_errors() || {}).map((key) => `${key} ${_errors()[key]}`))
    })),
    withMethods((store) => ({
        setErrors(errors: Errors): void {
            patchState(store, { _errors: errors });
        }
    }))
);
