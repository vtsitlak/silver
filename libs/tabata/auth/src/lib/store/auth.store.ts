import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ɵ$localize as $localize } from '@angular/localize';

import { catchError, exhaustMap, finalize, map, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorsStore } from './errors.store';
import { ToastService } from '@silver/shared/helpers';
import {
    authInitialState,
    AuthErrors,
    AuthState,
    LoginUser,
    NewUser,
    ProfileUser,
    toProfileUser,
    UpdatePasswordDetails,
    userToState
} from '@silver/tabata/helpers';

export const AuthStore = signalStore(
    { providedIn: 'root' },

    // --- STATE ---
    withState<AuthState>(authInitialState),

    // --- COMPUTED ---
    withComputed(({ user: profileUser }) => ({
        isAuthenticated: computed(() => !!profileUser())
    })),
    // --- METHODS ---
    withMethods(
        (store, errorsStore = inject(ErrorsStore), authService = inject(AuthService), router = inject(Router), toastService = inject(ToastService)) => ({
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
                                    errorsStore.setErrors({ [AuthErrors.SendPasswordResetEmail]: '' });
                                    toastService.show($localize`:@@authPasswordResetEmailSent:Password reset email sent successfully`);
                                    router.navigateByUrl('/tabs/home');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.SendPasswordResetEmail]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
                            }),
                            catchError((error: any) => {
                                console.error('Auth error:', error);
                                errorsStore.setErrors({ [AuthErrors.SendPasswordResetEmail]: error.message });
                                patchState(store, { isLoading: false });
                                return of(undefined);
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
                                    errorsStore.setErrors({ [AuthErrors.Sign]: '' });
                                    toastService.show($localize`:@@authSignedIn:Signed in successfully`);
                                    router.navigateByUrl('/tabs/home');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.Sign]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
                            }),
                            catchError((error: any) => {
                                console.error('Auth error:', error);
                                errorsStore.setErrors({ [AuthErrors.Sign]: error.message });
                                patchState(store, { isLoading: false });
                                return of(undefined);
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
                                    errorsStore.setErrors({ [AuthErrors.SignWithGoogle]: '' });
                                    toastService.show($localize`:@@authSignedInWithGoogle:Signed in with Google successfully`);
                                    router.navigateByUrl('/tabs/home');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.SignWithGoogle]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
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
                                    errorsStore.setErrors({ [AuthErrors.Register]: '' });
                                    toastService.show($localize`:@@authAccountCreated:Account created successfully`);
                                    router.navigateByUrl('/tabs/home');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.Register]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
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
                                    errorsStore.setErrors({ [AuthErrors.UpdateDisplayName]: '' });
                                    toastService.show($localize`:@@authDisplayNameUpdated:Display name updated successfully`);
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.UpdateDisplayName]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
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
                            tapResponse({
                                next: () => {
                                    patchState(store, { isLoading: false });
                                    errorsStore.setErrors({ [AuthErrors.UpdatePassword]: '' });
                                    toastService.show($localize`:@@authPasswordUpdated:Password updated successfully`);
                                    router.navigateByUrl('/tabs/profile');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.UpdatePassword]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
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
                                    errorsStore.setErrors({ [AuthErrors.Logout]: '' });
                                    toastService.show($localize`:@@authLoggedOut:Logged out successfully`);
                                    router.navigateByUrl('/auth/login');
                                },
                                error: (error: Error) => {
                                    console.error('Auth error:', error);
                                    errorsStore.setErrors({ [AuthErrors.Logout]: error.message });
                                    patchState(store, { isLoading: false });
                                    return of(undefined);
                                }
                            })
                        )
                    )
                )
            )
        })
    )
);
