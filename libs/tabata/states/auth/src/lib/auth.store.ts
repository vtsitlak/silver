import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { catchError, exhaustMap, finalize, map, of, pipe, switchMap, tap } from 'rxjs';
import { Subject } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AuthService } from './auth.service';
import { authInitialState, AuthState, LoginUser, NewUser, ProfileUser, toProfileUser, UpdatePasswordDetails, userToState } from './auth.models';

export const AuthStore = signalStore(
    { providedIn: 'root' },

    // --- STATE ---
    withState<AuthState>(authInitialState),

    // --- COMPUTED ---
    withComputed(({ user: profileUser }) => ({
        isAuthenticated: computed(() => !!profileUser())
    })),
    // --- METHODS ---
    withMethods((store, authService = inject(AuthService)) => ({
        clearError(): void {
            patchState(store, { error: null });
        },

        getUser: (() => {
            const getUserTrigger = new Subject<void>();
            rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() => authService.currentUser$),
                    map((user) => userToState(user)),
                    tap((state) => {
                        if (state) {
                            patchState(store, { ...state, isLoading: false });
                        } else {
                            patchState(store, { isLoading: false });
                        }
                    })
                )
            )(getUserTrigger);
            return () => getUserTrigger.next();
        })(),

        sendPasswordResetEmail: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((email) =>
                    authService.sendPasswordResetEmail(email).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { isLoading: false, error: null });
                            },
                            error: (error: Error) => {
                                console.error('Auth error:', error);
                                patchState(store, { isLoading: false, error: error.message });
                                return of(undefined);
                            }
                        }),
                        catchError((error: unknown) => {
                            console.error('Auth error:', error);
                            patchState(store, { isLoading: false, error: error instanceof Error ? error.message : String(error) });
                            return of(undefined);
                        }),
                        finalize(() => {
                            console.log('Send password reset email process finalized');
                        })
                    )
                )
            )
        ),

        sign: (() => {
            const signTrigger = new Subject<LoginUser>();
            rxMethod<LoginUser>(
                pipe(
                    tap((credentials) => {
                        console.debug('[AuthStore.sign] Triggered', { email: credentials.email });
                    }),
                    tap(() => {
                        console.debug('[AuthStore.sign] Setting isLoading=true');
                        patchState(store, { isLoading: true, error: null });
                    }),
                    exhaustMap(({ email, password }) => {
                        console.debug('[AuthStore.sign] Calling authService.sign', { email });
                        return authService.sign(email, password).pipe(
                            tapResponse({
                                next: (userCredential) => {
                                    const profileUser = toProfileUser(userCredential.user);
                                    console.debug('[AuthStore.sign] Success', { uid: profileUser?.uid, email: profileUser?.email });
                                    patchState(store, {
                                        user: profileUser,
                                        isLoading: false,
                                        usePassword: true
                                    });
                                },
                                error: (error: Error) => {
                                    console.error('[AuthStore.sign] Error', error);
                                    patchState(store, { isLoading: false, error: error.message });
                                    return of(undefined);
                                }
                            }),
                            catchError((error: unknown) => {
                                console.error('[AuthStore.sign] CatchError', error);
                                patchState(store, { isLoading: false, error: error instanceof Error ? error.message : String(error) });
                                return of(undefined);
                            }),
                            finalize(() => {
                                console.debug('[AuthStore.sign] Finalized');
                            })
                        );
                    })
                )
            )(signTrigger);
            return (credentials: LoginUser) => {
                console.debug('[AuthStore.sign] signWithCredentials called', { email: credentials.email });
                signTrigger.next(credentials);
            };
        })(),

        signWithGoogle: (() => {
            const signWithGoogleTrigger = new Subject<void>();
            rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    exhaustMap(() =>
                        authService.signInWithGoogle().pipe(
                            tapResponse({
                                next: ({ user: firebaseUser }) => {
                                    const profileUser = toProfileUser(firebaseUser);
                                    patchState(store, {
                                        user: profileUser,
                                        isLoading: false,
                                        useGoogle: true
                                    });
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    patchState(store, { isLoading: false, error: error.message });
                                    return of(undefined);
                                }
                            })
                        )
                    )
                )
            )(signWithGoogleTrigger);
            return () => signWithGoogleTrigger.next();
        })(),

        register: rxMethod<NewUser>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((newUser) =>
                    authService.signUp(newUser.email, newUser.password, newUser.displayName).pipe(
                        tapResponse({
                            next: ({ user: firebaseUser }) => {
                                const profileUser = toProfileUser(firebaseUser);
                                patchState(store, {
                                    user: profileUser,
                                    isLoading: false,
                                    usePassword: true
                                });
                            },
                            error: (error: Error) => {
                                console.error('Auth error:', error);
                                patchState(store, { isLoading: false, error: error.message });
                                return of(undefined);
                            }
                        })
                    )
                )
            )
        ),

        updateDisplayName: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((displayName) =>
                    authService.updateDisplayName(displayName).pipe(
                        tapResponse({
                            next: () => {
                                const updatedUser = { ...store.user, displayName } as unknown as ProfileUser;
                                patchState(store, { user: updatedUser, isLoading: false });
                            },
                            error: (error: Error) => {
                                console.error('Auth error:', error);
                                patchState(store, { isLoading: false, error: error.message });
                                return of(undefined);
                            }
                        })
                    )
                )
            )
        ),

        updatePassword: rxMethod<UpdatePasswordDetails>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap(({ email, currentPassword, newPassword }) =>
                    authService.updatePassword(email, currentPassword, newPassword).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { isLoading: false });
                            },
                            error: (error: Error) => {
                                console.error('Auth error:', error);
                                patchState(store, { isLoading: false, error: error.message });
                                return of(undefined);
                            }
                        })
                    )
                )
            )
        ),

        logout: (() => {
            const logoutTrigger = new Subject<void>();
            rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    exhaustMap(() =>
                        authService.logout().pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, { user: null, isLoading: false });
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    patchState(store, { isLoading: false, error: error.message });
                                    return of(undefined);
                                }
                            })
                        )
                    )
                )
            )(logoutTrigger);
            return () => logoutTrigger.next();
        })()
    }))
);
