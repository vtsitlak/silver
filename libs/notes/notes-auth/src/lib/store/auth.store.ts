import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { pipe, switchMap } from 'rxjs';

interface AuthState {
  user: User | null;
}

const initialState: AuthState = {
  user: null
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoggedIn: () => !!store.user(),
    isLoggedOut: () => !store.user()
  })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
    login: rxMethod<{ email: string; password: string }>(
      pipe(
        switchMap(({ email, password }) =>
          authService.login(email, password).pipe(
            tap((user) => {
              patchState(store, { user });
              localStorage.setItem('user', JSON.stringify(user));
              router.navigateByUrl('/notes');
            })
          )
        )
      )
    ),
    logout: () => {
      patchState(store, { user: null });
      localStorage.removeItem('user');
      router.navigateByUrl('/login');
    },
    setUser: (user: User) => {
      patchState(store, { user });
    }
  }))
);
