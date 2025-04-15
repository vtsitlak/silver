import { User } from '@angular/fire/auth';
import { ProfileUser } from '@silver/tabata/auth';

export function toProfileUser(user: User | null): ProfileUser | null {
    if (user) {
        const { uid, displayName, email, photoURL } = user;
        return { uid, displayName, email, photoURL } as ProfileUser;
    }
    return null;
}
