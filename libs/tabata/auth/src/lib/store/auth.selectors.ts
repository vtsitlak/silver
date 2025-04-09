// // auth.selectors.ts
// import { createFeatureSelector, createSelector } from '@ngrx/store';
// import { AuthState } from './auth.reducer';

// export const selectAuthState = createFeatureSelector<AuthState>('auth'); // 'auth' is the key in your StoreModule.forRoot

// export const selectUser = createSelector(selectAuthState, (state: AuthState) => state.user);
// export const selectIsAuthenticated = createSelector(selectAuthState, (state: AuthState) => state.isAuthenticated);
// export const selectAuthError = createSelector(selectAuthState, (state: AuthState) => state.error);
// export const selectIsLoading = createSelector(selectAuthState, (state: AuthState) => state.isLoading);
