import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed, getState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { exhaustMap, map, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorsStore } from './errors.store';
import { authInitialState, AuthState, LoginUser, NewUser, toProfileUser, userToState } from '@silver/tabata/helpers';

export const AuthStore = signalStore(
    { providedIn: 'root' },

    // --- STATE ---
    withState<AuthState>(authInitialState),

    // --- COMPUTED ---
    withComputed(({ user: profileUser }) => ({
        isAuthenticated: computed(() => !!profileUser())
    })),
    // --- METHODS ---
    withMethods((store, formErrorsStore = inject(ErrorsStore), authService = inject(AuthService), router = inject(Router)) => ({
        getUser: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                switchMap(() => authService.currentUser$),
                // TODO methods for usePassword, useGoogle etc to get the full store
                map((user) => userToState(user)),
                tap((state) => {
                    console.log('store get = ', getState(store));
                    if (state) {
                        patchState(store, state);
                    }

                    console.log('store user after = ', store.user());
                    console.log('store usePassword after = ', store.usePassword());
                })
            )
        ),

        sign: rxMethod<LoginUser>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap(({ email, password }) =>
                    authService.sign(email, password).pipe(
                        tapResponse({
                            next: ({ user: firebaseUser }) => {
                                const profileUser = toProfileUser(firebaseUser);
                                patchState(store, {
                                    user: profileUser,
                                    ...{ isLoading: false },
                                    ...{ usePassword: true }
                                });
                                router.navigateByUrl('/tabs/home');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),

        signWithGoogle: rxMethod<LoginUser>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap(() =>
                    authService.signInWithGoogle().pipe(
                        tapResponse({
                            next: ({ user: firebaseUser }) => {
                                const profileUser = toProfileUser(firebaseUser);
                                patchState(store, {
                                    user: profileUser,
                                    ...{ isLoading: false, useGoogle: true }
                                });
                                router.navigateByUrl('/tabs/home');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),

        register: rxMethod<NewUser>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap((newUser) =>
                    authService.signUp(newUser.email, newUser.password, newUser.displayName).pipe(
                        tapResponse({
                            next: ({ user: firebaseUser }) => {
                                const profileUser = toProfileUser(firebaseUser);
                                patchState(store, {
                                    user: profileUser,
                                    ...{ isLoading: false },
                                    ...{ usePassword: true }
                                });
                                router.navigateByUrl('/tabs/home');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),
        updateDisplayName: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap((displayName) =>
                    authService.updateDisplayName(displayName).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { isLoading: false });
                                router.navigateByUrl('/tabs/profile');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),
        updatePassword: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap((newPassword) =>
                    authService.updatePassword(newPassword).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { isLoading: false });
                                router.navigateByUrl('/tabs/profile');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),
        logout: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap(() =>
                    authService.logout().pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { user: null }, { isLoading: false });
                                router.navigateByUrl('/auth/login');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        )
    }))
);
