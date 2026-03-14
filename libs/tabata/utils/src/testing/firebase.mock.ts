/**
 * Mocks for Firebase / AngularFire used in unit tests.
 * Import via @silver/tabata/testing.
 */

import { of } from 'rxjs';

/** Mock for Firebase Auth (e.g. AuthService from @angular/fire/auth). */
export const mockAuth = {
    currentUser: null,
    authState: () => of(null)
};
