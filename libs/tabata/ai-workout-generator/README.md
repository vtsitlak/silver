# ai-workout-generator

This library was generated with [Nx](https://nx.dev).

## Workout Generation Prompt (high level)

The `generate-workout` API uses a structured prompt to pick exercises and return a single JSON workout.

Key constraints (driven by `level` + `primaryGoal`):

- Uses ONLY the exercise IDs provided by the caller (never invents new IDs).
- Enforces exercise `level` downward compatibility:
  - `beginner` workouts => exercises level `beginner` only
  - `intermediate` workouts => exercises level `beginner` or `intermediate`
  - `expert` workouts => exercises level `beginner`, `intermediate`, or `expert`
- Enforces primary goal mapping to exercise category:
  - `Strength` => `strength`
  - `Cardio` => `cardio`
  - `Explosion` => `plyometrics`
- Prefers the main workout to draw the majority of blocks from the mapped primary goal category (with a best-effort 3-category mix when enough blocks exist).
- Prevents reuse: the same `exerciseId` should not be repeated across warmup, blocks, and cooldown.

Phase-specific rules:

- Warmup (5-10 min):
  - Allowed categories: `cardio` and `stretching`
  - Warmup level is always `beginner` for safety
  - Excludes categories: `strength` and `plyometrics`
- Main blocks:
  - Allowed categories: `strength`, `cardio`, `plyometrics` (no `stretching` blocks)
  - Target matching is based on overlap between workout target muscles and exercise main/secondary muscles
- Cooldown (3-7 min):
  - Allowed category: `stretching` only
  - Cooldown level is always `beginner`
  - Excludes categories: `cardio` and `plyometrics`

## Running unit tests

Run `nx test ai-workout-generator` to execute the unit tests.
