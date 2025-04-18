import { User } from "@angular/fire/auth";
import { AuthState, ProfileUser, PROVIDER_ID } from "./models/user";

export function toProfileUser(user: User | null): ProfileUser | null {
  if (user) {
    const { uid, displayName, email, photoURL } = user;
    return { uid, displayName, email, photoURL } as ProfileUser;
  }
  return null;
}

export function userToState(
  user: User | null,
  isLoading = false
): AuthState | null {
  if (user) {
    return {
      user: toProfileUser(user),
      isLoading,
      usePassword:
        user.providerData
          .map((data) => data.providerId)
          .indexOf(PROVIDER_ID.PASSWORD) > -1,
      useGoogle:
        user.providerData
          .map((data) => data.providerId)
          .indexOf(PROVIDER_ID.GOOGLE) > -1,
      error: null,
    };
  }
  return null;
}
