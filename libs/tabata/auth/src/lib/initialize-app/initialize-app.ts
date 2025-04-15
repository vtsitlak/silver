// import {
//   APP_INITIALIZER,
//   ApplicationRef,
//   inject,
//   Injector,
//   runInInjectionContext,
// } from '@angular/core';

// import { toObservable } from '@angular/core/rxjs-interop';
// import { take } from 'rxjs/operators';
// import { AuthService } from '../services/auth.service';

// export function initializeAppFactory(appRef: ApplicationRef): () => Promise<any> {
//   console.log("APP_INITIALIZER: initializeAppFactory called");
//   return () => {
//     console.log("APP_INITIALIZER: Returning promise");
//     const injector = appRef.injector; // Get the injector from ApplicationRef
//     return runInInjectionContext(injector, () => { // Explicit injection context
//       const authService = inject(AuthService);
//       return new Promise<any>((resolve) => {
//         toObservable(authService.isAuthenticatedInitialized).pipe(
//           take(1)
//         ).subscribe(() => {
//           console.log("APP_INITIALIZER: isAuthenticatedInitialized emitted");
//           resolve(true);
//         });
//         console.log("APP_INITIALIZER: Subscription to isAuthenticatedInitialized set up");
//       });
//     });
//   };
// }

// export const appConfig = {
//   providers: [
//     // ... other providers
//     {
//       provide: APP_INITIALIZER,
//       useFactory: initializeAppFactory,
//       deps: [ApplicationRef], // Inject ApplicationRef
//       multi: true,
//     },
//   ],
// };
