import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthStore } from "../store/auth.store";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";

export const authGuard = () => {
  const isUserLoaded$ = toObservable(inject(AuthStore).isLoading);
  const router = inject(Router);

  const user = inject(AuthStore).user;

  return isUserLoaded$.pipe(
    filter(Boolean),
    take(1),
    map(() => {
      return user() ? true : router.parseUrl("/auth/login");
    })
  );
};
