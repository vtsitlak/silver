import { Injectable } from '@angular/core';
import {
  Auth,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { deleteCookie, parseCookie } from '@silver/shared/ui';
import { setPersistence, updateProfile } from 'firebase/auth';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private firebaseAuth: Auth) {
    this.setSessionStoragePersistence();
    this.user$ = user(this.firebaseAuth);
  }

  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.firebaseAuth, email, password));
  }

  register(email: string, password: string, displayName: string) {
    return from(
      createUserWithEmailAndPassword(this.firebaseAuth, email, password)
    ).pipe(
      switchMap((userCredential) => {
        return from(updateProfile(userCredential.user, { displayName }));
      })
    );
  }

  logout(): Observable<void> {
    return from(
      signOut(this.firebaseAuth).then(() => {
        sessionStorage.clear();
        deleteCookie('userInfo');
        console.log('sign out called');
      })
    );
  }

  isLoggedIn(): boolean {
    return !!parseCookie();
  }
}
