# auth

This library was generated with [Nx](https://nx.dev).

## Auth login / register / forgot-password vs other app forms

Why focus/scroll can feel worse on **auth** than on **Profile** or **Workout editor**:

|                   | Auth screens                                                                                                                                                 | Profile, workout editor, modals                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page layout**   | Full-viewport column: `min-h-screen` + `flex` + **`mt-auto` + `justify-end`** pins the white card to the **bottom** of the screen with flexible space above. | **Profile**: simple `flex flex-col` under `ion-content` — content starts at the **top** (no `min-h-screen` / no `mt-auto`). **Workout info**: nested under segment tabs; not bottom-anchored. |
| **Scroll + flex** | When Ionic **scroll assist** adjusts `ion-content` scroll position, the flex area above the form **recomputes**; the bottom-anchored block **moves** a lot.  | Normal top-down flow: assist may scroll slightly; layout doesn’t “re-anchor” a card from the bottom.                                                                                          |
| **Inputs**        | `fill="outline"` + `labelPlacement="floating"` (MD notch + label animation).                                                                                 | **Workout info** often uses **`labelPlacement="stacked"`** and no outline — less internal height change on focus.                                                                             |

**App-level mitigation** (see `apps/tabata-ai/src/main.ts`): `provideIonicAngular({ scrollAssist: Capacitor.isNativePlatform() })` so **browser** builds disable scroll assist; **native** keeps it.

## Running unit tests

Run `nx test auth` to execute the unit tests.
