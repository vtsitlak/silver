import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { catchError, exhaustMap, finalize, map, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorsStore } from './errors.store';
import { authInitialState, AuthState, LoginUser, NewUser, ProfileUser, toProfileUser, UpdatePasswordDetails, userToState } from '@silver/tabata/helpers';

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
                map((user) => userToState(user)),
                tap((state) => {
                    if (state) {
                        patchState(store, { ...state, isLoading: false });
                    } else {
                        patchState(store, { isLoading: false });
                    }
                })
            )
        ),
        sendPasswordResetEmail: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap((email) =>
                    authService.sendPasswordResetEmail(email).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { isLoading: false });
                                router.navigateByUrl('/tabs/home');
                            },
                            error: (error: Error) => {
                                console.error('Send password reset email error:', error);
                                formErrorsStore.setErrors({ resetPassword: error.message });
                                patchState(store, { isLoading: false });
                            }
                        }),
                        catchError((error: any) => {
                            console.error('Send password reset email error:', error);
                            formErrorsStore.setErrors({ resetPassword: error.message });
                            patchState(store, { isLoading: false });
                            return of(null);
                        }),
                        finalize(() => {
                            console.log('Send password reset email process finalized');
                        })
                    )
                )
            )
        ),


        sign: rxMethod<LoginUser>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap(({ email, password }) =>
                    authService.sign(email, password).pipe(
                        tapResponse({
                            next: (userCredential) => {
                                const profileUser = toProfileUser(userCredential.user);
                                patchState(store, {
                                    user: profileUser,
                                    isLoading: false,
                                    usePassword: true
                                });
                                router.navigateByUrl('/tabs/home');
                            },
                            error: (error: Error) => {
                                console.error('Sign in error:', error);
                                formErrorsStore.setErrors({ signIn: error.message });
                                patchState(store, { isLoading: false });
                            }
                        }),
                        catchError((error: any) => {
                            console.error('Sign in error:', error);
                            formErrorsStore.setErrors({ signIn: error.message });
                            patchState(store, { isLoading: false });
                            return of(null);
                        }),
                        finalize(() => {
                            console.log('Sign-in process finalized');
                        })
                    )
                )
            )
        ),

        signWithGoogle: rxMethod(
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
                                const updatedUser = { ...store.user, displayName } as unknown as ProfileUser;
                                patchState(store, { user: updatedUser, isLoading: false });
                                // router.navigateByUrl('/tabs/profile');
                            },
                            error: ({ error }) => formErrorsStore.setErrors(error.errors)
                        })
                    )
                )
            )
        ),
        updatePassword: rxMethod<UpdatePasswordDetails>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                exhaustMap(({ email, currentPassword, newPassword }) =>
                    authService.updatePassword(email, currentPassword, newPassword).pipe(
                        tap(() => {
                            console.log('store email = ', email);
                            console.log('store currentPassword = ', currentPassword);
                            console.log('store newPassword = ', newPassword);
                        }),
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
