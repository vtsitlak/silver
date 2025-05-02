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
    GoogleAuthProvider,
    sendPasswordResetEmail,
    getAuth
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

    sendPasswordResetEmail(email: string): Observable<void> {
        const auth = getAuth();
        return from(sendPasswordResetEmail(auth, email)).pipe(
            catchError((error) => {
                // Handle errors during password reset email sending
                console.error('Error sending password reset email:', error);
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

    updatePassword(email: string, currentPassword: string, newPassword: string): Observable<void> {
        const user = this.auth.currentUser;

        if (!user) {
            console.warn('No user signed in.');
            return of(undefined); // Or return an error Observable
        }

        // Create a credential with the user's email and current password
        const credential = EmailAuthProvider.credential(email, currentPassword);
        // Re-authenticate the user with the credential
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
