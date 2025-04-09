// // auth.effects.ts
// import { inject, Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
// import { of } from 'rxjs';
// import { catchError, exhaustMap, map, takeUntil, tap } from 'rxjs/operators';
// import { Router } from '@angular/router';

// import * as AuthActions from './auth.actions';
// import { AuthService } from '../services/auth.service';

// @Injectable()
// export class AuthEffects {
//   private actions$ = inject(Actions);
//   private authService = inject(AuthService);
//   private router = inject(Router);



//   // login$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.login), // Assuming you have a loginRequest action
//   //     switchMap(({ email, password }) =>
//   //       from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
//   //         map((userCredential) =>
//   //           AuthActions.loginSuccess({ user: userCredential.user })
//   //         ),
//   //         catchError((error) =>
//   //           of(AuthActions.loginFailure({ error: error.message }))
//   //         )
//   //       )
//   //     )
//   //   )
//   // );

//   // logout$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.logout), // Assuming you have a logoutRequest action
//   //     switchMap(() =>
//   //       from(this.afAuth.signOut()).pipe(
//   //         map(() => AuthActions.logoutSuccess()),
//   //         tap(() => this.router.navigate(['/auth/login'])), // Redirect to login page
//   //         catchError((error) => of(AuthActions.authError({ error })))
//   //       )
//   //     )
//   //   )
//   // );

//   // signUp$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.signUp), // Assuming you have a registerRequest action
//   //     switchMap(({ email, password }) =>
//   //       from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
//   //         map((userCredential) =>
//   //           AuthActions.signUpSuccess({ user: userCredential.user })
//   //         ),
//   //         map(user => ),
//   //         catchError((error) => of(AuthActions.authError({ error })))
//   //       )
//   //     )
//   //   )
//   // );

//   // updateUser$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.updateUser), // Assuming you have a updateUser action
//   //     switchMap(({ profileData }) =>
//   //       from(this.afAuth.currentUser.then(user => {
//   //         if (user) {
//   //           return from(this.afAuth.updateCurrentUser(profileData));
//   //         } else {
//   //           throw new Error('User not found');
//   //         }
//   //       })).pipe(
//   //         map((user) =>
//   //           AuthActions.updateUserSuccess({ user })
//   //         ),
//   //         catchError((error) => of(AuthActions.updateUserFailure({ error })))
//   //       )
//   //     )
//   //   )
//   // );

//   // updateUser$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.updateUserProfile),
//   //     exhaustMap(({ userData }) =>
//   //       this.afAuth.updateCurrentUser(this.afAuth.getAuth().currentUser!.uid, userData).pipe( // Use non-null assertion as we know there is a user in the context
//   //         map(() => AuthActions.updateUserProfileSuccess({ user: userData })), // Pass back the updated data
//   //         catchError(error => of(AuthActions.updateUserProfileFailure({ error })))
//   //       )
//   //     )
//   //   )
//   // );



//   // Example of persisting the auth state.
//   // Check if a user is authenticated on app initialization
//   // initAuth$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType('@ngrx/store/init'), // NgRx initialization action
//   //     switchMap(() =>
//   //       this.afAuth.authState.pipe(
//   //         map((user) => {
//   //           if (user) {
//   //             // User is authenticated, dispatch the loginSuccess action
//   //             return AuthActions.loginSuccess({ user });
//   //           } else {
//   //             // User is not authenticated, dispatch the logoutSuccess action or a specific action for initial state
//   //             return AuthActions.logoutSuccess();
//   //           }
//   //         }),
//   //         catchError((error) => {
//   //           console.error('Authentication state error:', error);
//   //           return of(AuthActions.authError({ error }));
//   //         })
//   //       )
//   //     )
//   //   )
//   // );

//   initAuth$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.initAuth),
//       exhaustMap(() => {
//         return this.authService.authStateReady$.pipe( // Wait for auth state to be ready
//           takeUntil(this.actions$.pipe(ofType(AuthActions.login, AuthActions.signUp))), // Stop if login or signup occurs
//           exhaustMap(() => { // Switch to the currentUser observable
//             return of(this.authService.currentUser()).pipe(

//               map(user => {
//                 console.log('user init = ', user);
//                 if (user) {
//                   const { uid, displayName, email, photoURL } = user;
//                   const newUser = {
//                     uid: uid,
//                     displayName: displayName,
//                     email: email,
//                     photoURL: photoURL,
//                   }
//                   console.log('if = ');
//                   return AuthActions.authCheckSuccess({ user: newUser });
//                 } else {
//                   return AuthActions.authCheckFailure();
//                 }
//               }),
//               catchError(() => of(AuthActions.authCheckFailure()))
//             );
//           })
//         );
//       })
//     )
//   );


//   // loginWithGoogle$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.loginWithGoogle),
//   //     exhaustMap(() =>
//   //       this.authService.signInWithGoogle().pipe( // Or your preferred method
//   //         map(user => AuthActions.loginSuccess({ user })),
//   //         catchError(error => of(AuthActions.loginFailure({ error })))
//   //       )
//   //     )
//   //   )
//   // );


//   // login$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.login),
//   //     exhaustMap(({ email, password }) =>
//   //       this.authService.signIn(email, password).pipe(
//   //         tap(user => console.log('effect sign user = ', user)),
//   //         exhaustMap(userCredential => {  // Use exhaustMap to chain observables
//   //           // Get the user's ID token
//   //           return from(this.authService.getAuth().currentUser.getIdToken()).pipe(
//   //             tap(idToken => console.log('ID Token:', idToken)), // Log the token
//   //             // Send the ID token to the Firebase Function
//   //             exhaustMap(idToken => {
//   //               return this.http.post('/api/sessionLogin', { idToken }).pipe( // Adjust the URL
//   //                 tap(() => console.log('Session cookie set')),
//   //                 map(() => AuthActions.loginSuccess({ user: userCredential.user })), // Dispatch success
//   //                 tap(() => this.router.navigate(['/tabs/home'])), // Redirect
//   //                 catchError(error => {
//   //                   console.error('Error setting session cookie:', error);
//   //                   return of(AuthActions.loginFailure({ error }));
//   //                 })
//   //               );
//   //             })
//   //           );
//   //         }),
//   //         catchError(error => of(AuthActions.loginFailure({ error })))
//   //       )
//   //     )
//   //   )
//   // );


//   login$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.login),
//       exhaustMap(({email, password}) =>
//         this.authService.signIn(email, password).pipe(
//           tap(user => console.log('effect sign user = ', user)),
//           map(user => {
//             const { uid, displayName, email, photoURL } = user; // Extract properties
//             return  {
//               uid: uid,
//               displayName: displayName,
//               email: email,
//               photoURL: photoURL,
//             };
//           }),
//           tap(user => console.log('effect sign user after  = ', user)),// Or your preferred method
//           map(user => AuthActions.loginSuccess({user})),
//           tap(user => console.log('effect sign success user = ', user)),
//           tap(() => this.router.navigate(['/tabs/home'])), // Redirect after logout
//           catchError(error => of(AuthActions.loginFailure({ error })))
//         )
//       )
//     )
//   );

//   // logout$ = createEffect(() =>
//   //   this.actions$.pipe(
//   //     ofType(AuthActions.logout),
//   //     exhaustMap(() =>
//   //       this.http.post('/api/sessionLogout', {}).pipe( // Call the logout function
//   //         tap(() => console.log('Session cookie cleared')),
//   //         map(() => AuthActions.logoutSuccess()), // Dispatch logoutSuccess
//   //         tap(() => this.router.navigate(['/login'])), // Redirect
//   //         catchError(() => of(AuthActions.logoutSuccess())) // Even on error, clear the state
//   //       )
//   //     )
//   //   )
//   // );


//   // Firebase Function (sessionLogout.ts)
// // import * as functions from 'firebase-functions';
// // import * as admin from 'firebase-admin';

// // admin.initializeApp();

// // export const sessionLogout = functions.https.onRequest(async (req, res) => {
// //   const sessionCookie = req.cookies.session || '';
// //   res.clearCookie('session');
// //   try {
// //     // Verify the session cookie. If the session cookie is valid
// //     // the payload contains the user claims.
// //     const decodedClaims = await admin.auth().verifySessionCookie(
// //       sessionCookie,
// //       true /** checkRevoked */
// //     );
// //     console.log('Decoded claims', decodedClaims)
// //     await admin.auth().revokeRefreshTokens(decodedClaims.sub);
// //     res.status(200).send(JSON.stringify({ status: 'success' }));
// //   } catch (error) {
// //     // Session cookie is unavailable or invalid. Force user to login.
// //     res.status(401).send(JSON.stringify({ status: 'error', message: 'Unauthorized' }));
// //   }
// //   res.redirect('/login');
// // });

//   logout$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.logout),
//       exhaustMap(() =>
//         this.authService.signOut().pipe(
//           map(() => AuthActions.logoutSuccess()),
//           tap(() => this.router.navigate(['auth/login'])), // Redirect after logout
//           catchError(() => of(AuthActions.logoutSuccess())) // Even on error, clear the state
//         )
//       )
//     )
//   );
// }
