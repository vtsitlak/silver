import { inject, Injectable } from '@angular/core';
import {
    Auth,
    signInWithEmailAndPassword,
    authState,
    createUserWithEmailAndPassword,
    UserCredential,
    updateProfile,
    EmailAuthProvider,
    updatePassword,
    reauthenticateWithCredential,
    signInWithPopup,
    GoogleAuthProvider
} from '@angular/fire/auth';
import { catchError, from, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    currentUser$ = authState(this.auth);

    signUp(email: string, password: string, displayName: string): Observable<UserCredential> {
        return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
            switchMap((userCredential) => this.updateDisplayName(displayName).pipe(switchMap(() => from(Promise.resolve(userCredential))))),
            catchError((error) => {
                // Handle errors during user creation
                console.error('Error creating user:', error);
                return throwError(() => error); // Re-throw the error
            })
        );
    }

    sign(email: string, password: string): Observable<UserCredential> {
        return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
            catchError((error) => {
                // Handle errors during login user
                console.error('Error login user:', error);
                return throwError(() => error); // Re-throw the error
            })
        );
    }

    signInWithGoogle(): Observable<UserCredential> {
        const provider = new GoogleAuthProvider();

        // Optional: Add custom parameters (e.g., language)
        // provider.setCustomParameters({ prompt: 'select_account' });

        return from(signInWithPopup(this.auth, provider)).pipe(
            catchError((error) => {
                // Handle errors during login user
                console.error('Error login user:', error);
                return throwError(() => error); // Re-throw the error
            })
        );
    }

    updateDisplayName(displayName: string): Observable<void> {
        if (this.auth.currentUser) {
            return from(updateProfile(this.auth.currentUser, { displayName: displayName })).pipe(
                catchError((error) => {
                    // Handle errors during profile update
                    console.error('Error updating profile:', error);
                    return throwError(() => error); // Re-throw the error
                })
            );
        } else {
            // Handle the case where there's no user signed in.
            console.warn('No user signed in.');
            return of(undefined); // Or return an error Observable, depending on your needs
        }
    }

    updatePassword(newPassword: string): Observable<void> {
        const user = this.auth.currentUser;

        if (!user) {
            console.warn('No user signed in.');
            return of(undefined); // Or return an error Observable
        }

        // **Important: Re-authentication Required**
        // Firebase requires the user to have recently signed in before
        // changing their password for security reasons.

        // 1. Get the user's email address (you might need to store this)
        const userEmail = user.email;

        if (!userEmail) {
            console.warn('User has no email address, cannot re-authenticate.');
            return throwError(() => new Error('User has no email address, cannot re-authenticate.'));
        }

        // 2. Prompt the user to re-enter their password
        const currentPassword = prompt('Please enter your current password to confirm:');

        if (!currentPassword) {
            console.warn('User did not enter their current password.');
            return of(undefined); // Or return an error Observable
        }

        // 3. Create a credential with the user's email and current password
        const credential = EmailAuthProvider.credential(userEmail, currentPassword);

        // 4. Re-authenticate the user with the credential
        return from(reauthenticateWithCredential(user, credential)).pipe(
            switchMap(() => {
                return from(updatePassword(user, newPassword));
            }),
            catchError((error) => {
                console.error('Error updating password:', error);
                return throwError(() => error); // Re-throw the error for the component to handle
            })
        );
    }

    logout(): Observable<unknown> {
        return from(this.auth.signOut());
    }
}
