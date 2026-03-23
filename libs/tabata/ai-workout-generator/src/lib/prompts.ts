import type { GenerateWorkoutInput } from './types';
import { getTargetMusclesForRegions } from '@silver/tabata/helpers';

/**
 * Builds the system + user prompt for the AI to generate a Tabata workout.
 * Uses only the provided exercises (by exerciseId). Target muscles are derived from body regions;
 * exercises are matched by main or secondary muscles. Name and description express user goals.
 */
export function buildGenerateWorkoutPrompt(input: GenerateWorkoutInput): string {
    const { muscles: targetMuscles, isFullBody } = getTargetMusclesForRegions(input.mainTargetBodypart, input.secondaryTargetBodyparts);
    const targetMusclesList = targetMuscles.length > 0 ? targetMuscles.join(', ') : '';

    const primaryGoalToCategorySlug = (goal: string): string => {
        switch (goal) {
            case 'Strength':
                return 'strength';
            case 'Cardio':
                return 'cardio';
            case 'Explosion':
                return 'plyometrics';
            default:
                return goal.toLowerCase();
        }
    };
    const goalCategorySlug = primaryGoalToCategorySlug(input.primaryGoal);

    const exerciseList = input.exercises
        .map(
            (e) =>
                `- ${e.exerciseId}: ${e.name} | main: ${(e.targetMuscles ?? []).join(', ')} | secondary: ${(e.secondaryMuscles ?? []).join(', ')} | equipment: ${(e.equipments ?? []).join(', ')} | category: ${(e.category ?? []).join(', ')} | level: ${e.level ?? 'unknown'}`
        )
        .join('\n');

    const equipmentList = ['body only', ...input.availableEquipments.filter((e) => e !== 'Bodyweight')].join(', ');

    const fullBodyInstruction = isFullBody
        ? `
FULL BODY: The target includes all muscle groups (Upper Body, Lower Body, Core). You MUST balance the workout across body parts: include a mix of exercises that target upper body, lower body, and core. Do not cluster all blocks in one region; spread them so the workout is balanced.`
        : '';

    return `You are an expert Tabata workout designer.
Design a workout that STRICTLY follows the user's brief and uses ONLY the exercise IDs from the list below. Do not invent any exercise IDs.
If the user explicitly specifies a constraint (e.g. number of blocks, warmup/cooldown duration, “no warmup”, total duration, or any specific structure), you MUST follow it even if it deviates from the “typical” guidelines below.
Do NOT add extra blocks or extra phases beyond what the user asked for. When the brief conflicts with default recommendations, the brief wins.

TRAINING DIFFICULTY & GOAL:
- Workout level: ${input.level}
- Primary goal: ${input.primaryGoal} (prefer exercise category: ${goalCategorySlug})

WORKOUT BRIEF (honor these in every phase):
- Name: ${input.name}
- Description: ${input.description}
- Use the name and description as the user's goals: the workout should reflect the intent (e.g. strength, cardio, beginner, quick, full body burn).

TARGET BODY REGIONS & MUSCLES:
- Main target body part: ${input.mainTargetBodypart}
- Secondary target body parts: ${input.secondaryTargetBodyparts.join(', ') || 'none'}
- Target muscles for this workout (choose exercises whose main OR secondary muscles overlap with these): ${targetMusclesList || 'all regions'}
${fullBodyInstruction}

AVAILABLE EQUIPMENT: ${equipmentList}
Note: body only is always available. Pick exercises that match the target muscles above and the listed equipment.

EXERCISE SELECTION RULE: For each phase (warmup, blocks, cooldown), select exercises where at least one of the exercise's main muscles (targetMuscles) or secondary muscles (secondaryMuscles) is in the target muscles list above. Prefer exercises whose main muscles match; secondary muscle match is also valid. Additionally, prefer exercises whose category includes "${goalCategorySlug}" to match the primary goal. Use the exercise name, category, equipment, and level to align with the workout name and description.

AVAILABLE EXERCISES (use only these exerciseId values; format: exerciseId | main muscles | secondary muscles | equipment | category):
${exerciseList}

---

WARMUP (5–10 minutes):
Purpose: Low-intensity joint and muscle preparation (safe “beginner level” warmup).
Technical Constraints (STRICT):
- Warmup MUST be built ONLY from exercises where category includes "cardio" OR category includes "stretching".
- Warmup MUST use exercise level "beginner" for every movement (ignore the workout’s main level).
- Warmup MUST NOT use exercises with category "plyometrics" or category "strength".
- Total warmup duration must be between 300–600 seconds (5–10 min). A usual target is ~5 minutes, but it may be shorter/longer as long as it stays <= 10 minutes.
- Pick 2–4 UNIQUE movements from the list (no exerciseId reuse anywhere in the workout). Each movement can be 60–120 seconds.

MAIN PHASE – TABATA BLOCKS:
- Each block = one exercise only, 8 rounds of 20 seconds work + 10 seconds rest (4 minutes per block).
- Default recommendation (ONLY if the user did not specify otherwise): Use 4–5 blocks for a full workout (~20 min of work).
- If the user says “one block” (or any specific number), output EXACTLY that many blocks.
- Rest between blocks: 1 minute (interBlockRestSeconds: 60) unless the user specifies a different rest.
- Choose blocks from exercises that match the workout targets and equipment, with category/level constraints below.
- STRICT UNIQUENESS: do not reuse any exerciseId across warmup, blocks, or cooldown.
- Category mix (3-category mix):
  - Allowed block categories are "strength", "cardio", and "plyometrics" ONLY (exclude "stretching" category entirely from the main blocks).
  - Prefer blocks whose category includes "${goalCategorySlug}" (primary goal bias).
- Primary goal bias: choose the majority of blocks from category "${goalCategorySlug}" (at least ceil(blockCount * 0.5)), when possible.
  - If the workout has 3 or more blocks, ensure at least one block from each of the three categories: strength + cardio + plyometrics.
- Downward Compatibility (STRICT):
  - Workout level "beginner" => ONLY exercises with level "beginner".
  - Workout level "intermediate" => exercises with level "beginner" or "intermediate".
  - Workout level "expert" => exercises with level "beginner", "intermediate", or "expert".
- Target matching: for every block, select exercises whose main OR secondary muscles overlap with the target muscles list above.
- Rounds: 8, workDurationSeconds: 20, restDurationSeconds: 10, interBlockRestSeconds: 60 for every block.

COOLDOWN (3–7 minutes):
Purpose: Lower intensity for recovery (no high-impact work).
Technical Constraints (STRICT):
- Cooldown MUST use ONLY exercises where category includes "stretching".
- Cooldown MUST use exercise level "beginner" for every movement (ignore the workout’s main level).
- Cooldown MUST exclude category "plyometrics" and exclude category "cardio" entirely.
- Total cooldown duration must be between 180–420 seconds (3–7 min).
- Pick 2–4 UNIQUE movements from the list (no exerciseId reuse anywhere in the workout). Each movement can be 60–120 seconds.

---

Return a single JSON object with this exact structure (no markdown, no code fence):
{
  "totalDurationMinutes": <number, total of warmup + all blocks + cooldown in minutes>,
  "warmup": {
    "totalDurationSeconds": <number, between 300 and 600>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  },
  "blocks": [
    {
      "rounds": 8,
      "workDurationSeconds": 20,
      "restDurationSeconds": 10,
      "exerciseId": "<id from list>",
      "interBlockRestSeconds": 60
    }
  ],
  "cooldown": {
    "totalDurationSeconds": <number, between 180 and 420>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  }
}

Rules: Use only exerciseIds from the list. Warmup must be 5–10 min (300–600 s). Cooldown must be 3–7 min (180–420 s). Main phase: 4–5 blocks, one exercise per block. Output valid JSON only.`;
}
