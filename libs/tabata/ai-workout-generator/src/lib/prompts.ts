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

    const exerciseList = input.exercises
        .map(
            (e) =>
                `- ${e.exerciseId}: ${e.name} | main: ${(e.targetMuscles ?? []).join(', ')} | secondary: ${(e.secondaryMuscles ?? []).join(', ')} | equipment: ${(e.equipments ?? []).join(', ')} | category: ${(e.category ?? []).join(', ')}`
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

EXERCISE SELECTION RULE: For each phase (warmup, blocks, cooldown), select exercises where at least one of the exercise's main muscles (targetMuscles) or secondary muscles (secondaryMuscles) is in the target muscles list above. Prefer exercises whose main muscles match; secondary muscle match is also valid. Use the exercise name, category, and equipment to align with the workout name and description.

AVAILABLE EXERCISES (use only these exerciseId values; format: exerciseId | main muscles | secondary muscles | equipment | category):
${exerciseList}

---

WARMUP (5–10 minutes):
Purpose: Prepare muscles for high-intensity intervals. Total warmup duration must be 300–600 seconds (5–10 min).
- Prefer dynamic movements: e.g. jumping jacks, mountain climbers, high knees, butt kicks when body only is available.
- If equipment is available: light cardio on bike/rower or myofascial release–style movements are also suitable.
- Pick 2–4 movements from the list whose main or secondary muscles match the target muscles (and fit equipment). Each movement can be 60–120 seconds.

MAIN PHASE – TABATA BLOCKS:
- Each block = one exercise only, 8 rounds of 20 seconds work + 10 seconds rest (4 minutes per block).
- Default recommendation (ONLY if the user did not specify otherwise): Use 4–5 blocks for a full workout (~20 min of work).
- If the user says “one block” (or any specific number), output EXACTLY that many blocks.
- Rest between blocks: 1 minute (interBlockRestSeconds: 60) unless the user specifies a different rest.
- Choose different exercises per block whose main or secondary muscles align with the target muscles and available equipment. For Full Body, vary blocks across upper body, lower body, and core.
- Rounds: 8, workDurationSeconds: 20, restDurationSeconds: 10, interBlockRestSeconds: 60 for every block.

COOLDOWN (5–10 minutes):
Purpose: Gradually lower heart rate. Total cooldown duration must be 300–600 seconds (5–10 min).
- Prefer low-intensity movements and stretching for the muscle groups worked: e.g. walking-in-place style moves, then static stretches.
- If equipment allows: light pedaling or resistance-band assisted stretching from the list.
- Pick 2–4 movements from the list whose main or secondary muscles match the target muscles; each can be 60–120 seconds.

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
    "totalDurationSeconds": <number, between 300 and 600>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  }
}

Rules: Use only exerciseIds from the list. Warmup and cooldown each 5–10 min (300–600 s). Main phase: 4–5 blocks, one exercise per block. Output valid JSON only.`;
}
