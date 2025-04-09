// // auth.reducer.ts
// import { createReducer, on } from '@ngrx/store';
// import { updateProfile, User } from 'firebase/auth';
// import {
//   login,
//   logout,
//   signUp,
//   updateUser,
//   authError,
//   loginSuccess,
//   loginFailure,
//   signUpSuccess,
//   signUpFailure,
//   logoutSuccess,
//   updateUserSuccess,
//   updateUserFailure,
//   authCheckSuccess,
//   authCheckFailure,
//   loadProfileSuccess,
//   loadProfileFailure,
// } from './auth.actions';

// export interface AuthState {
//   user: User | any;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: unknown;
// }

// const initialState: AuthState = {
//   user: null,
//   isAuthenticated: false,
//   isLoading: false,
//   error: null,
// };

// export const authReducer = createReducer(
//   initialState,

//   // Login Reducers
//   on(login, (state) => ({ ...state, isLoading: true })),
//   // on(loginWithGoogle, (state) => ({ ...state, isLoading: true, error: null })),
//   on(loginSuccess, (state, { user }) => {
//     console.log('on login success user = ', user);
//     const { uid, displayName, email, photoURL } = user; // Extract properties
//     const newUser = {
//       uid: uid,
//       displayName: displayName,
//       email: email,
//       photoURL: photoURL,
//     };
//     console.log('login success set new user', newUser);
//     return {
//       ...state,
//       user: newUser,
//       isLoading: false,
//       isAuthenticated: true,
//     };
//   }),
//   on(loginFailure, (state, { error }) => ({
//     ...state,
//     error,
//     isLoading: false,
//     isAuthenticated: false,
//   })),

//   // Signup Reducers
//   on(signUp, (state) => ({ ...state, isLoading: true })),
//   on(signUpSuccess, (state, { user }) => ({
//     ...state,
//     user: { ...state.user, ...user },
//     isLoading: false,
//     isAuthenticated: true,
//   })),
//   on(signUpFailure, (state, { error }) => ({
//     ...state,
//     error,
//     isLoading: false,
//   })),

//   // Update Reducers
//   on(updateUser, (state) => ({ ...state, isLoading: true })),
//   on(updateUserSuccess, (state, { user }) => ({
//     ...state,
//     user: { ...state.user, ...JSON.parse(JSON.stringify(user)) },
//     isLoading: false,
//   })),
//   on(updateUserFailure, (state, { error }) => ({
//     ...state,
//     error,
//     isLoading: false,
//   })),

//   // AuthCheck
//   on(authCheckSuccess, (state, { user }) => {
//     const { uid, displayName, email, photoURL } = user; // Extract properties
//     const newUser = {
//       uid: uid,
//       displayName: displayName,
//       email: email,
//       photoURL: photoURL,
//     };
//     return {
//       ...state,
//       user: { ...state.user, user: newUser },
//       isAuthenticated: true,
//       isLoading: false,
//     };
//   }),
//   on(authCheckFailure, (state) => ({
//     ...state,
//     user: null,
//     isAuthenticated: false,
//     isLoading: false,
//   })),

//   // Load Profile
//   on(loadProfileSuccess, (state, { user }) => ({
//     ...state,
//     user: JSON.parse(JSON.stringify(user)),
//     isLoading: false,
//   })),
//   on(loadProfileFailure, (state, { error }) => ({
//     ...state,
//     error,
//     isLoading: false,
//   })),

//   // Logout Reducers
//   on(logout, (state) => ({ ...state, isLoading: true })),
//   on(logoutSuccess, () => ({ ...initialState }))
// );
