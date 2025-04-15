import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { exhaustMap, map, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorsStore } from './errors.store';
import { LoginUser, NewUser, toProfileUser } from '@silver/tabata/helpers';
import { AuthState, authInitialState } from '../models/auth-state';

export const AuthStore = signalStore(
    { providedIn: 'root' },

    // --- STATE ---
    withState<AuthState>(authInitialState),

    // --- COMPUTED ---
    withComputed(({ user }) => ({
        isAuthenticated: computed(() => !!user())
    })),

    // --- METHODS ---
    withMethods((store, formErrorsStore = inject(ErrorsStore), authService = inject(AuthService), router = inject(Router)) => ({
        getUser: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                switchMap(() => authService.currentUser$),
                map((user) => toProfileUser(user)),
                tap((user) => {
                    patchState(store, {
                        user,
                        ...{ isLoading: false }
                    });
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
                                    ...{ isLoading: false }
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
                                    ...{ isLoading: false }
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
                                    ...{ isLoading: false }
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
