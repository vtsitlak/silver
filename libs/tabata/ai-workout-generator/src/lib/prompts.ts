import type { GenerateWorkoutInput } from './types';

/**
 * Builds the system + user prompt for the AI to generate a Tabata workout.
 * Uses only the provided exercises (by exerciseId) so the output is valid.
 */
export function buildGenerateWorkoutPrompt(input: GenerateWorkoutInput): string {
    const exerciseList = input.exercises
        .map((e) => `- ${e.exerciseId}: ${e.name} (targets: ${e.targetMuscles.join(', ')}, equipment: ${e.equipments.join(', ')})`)
        .join('\n');

    const equipmentList = ['body only', ...input.availableEquipments.filter((e) => e !== 'Bodyweight')].join(', ');

    return `You are an expert Tabata workout designer.
Design a workout that STRICTLY follows the user's brief and uses ONLY the exercise IDs from the list below. Do not invent any exercise IDs.
If the user explicitly specifies a constraint (e.g. number of blocks, warmup/cooldown duration, “no warmup”, total duration, or any specific structure), you MUST follow it even if it deviates from the “typical” guidelines below.
Do NOT add extra blocks or extra phases beyond what the user asked for. When the brief conflicts with default recommendations, the brief wins.

WORKOUT BRIEF (honor these in every phase):
- Name: ${input.name}
- Description: ${input.description}
- Main target body part: ${input.mainTargetBodypart}
- Secondary target body parts: ${input.secondaryTargetBodyparts.join(', ') || 'none'}
- Available equipment: ${equipmentList}
Note: body only is always available; choose exercises that match the target body parts and the listed equipment.

AVAILABLE EXERCISES (use only these exerciseId values):
${exerciseList}

---

WARMUP (5–10 minutes):
Purpose: Prepare muscles for high-intensity intervals. Total warmup duration must be 300–600 seconds (5–10 min).
- Prefer dynamic movements: e.g. jumping jacks, mountain climbers, high knees, butt kicks when body only is available.
- If equipment is available: light cardio on bike/rower or myofascial release–style movements are also suitable.
- Pick 2–4 movements from the list that fit the main/secondary targets and equipment. Each movement can be 60–120 seconds.

MAIN PHASE – TABATA BLOCKS:
- Each block = one exercise only, 8 rounds of 20 seconds work + 10 seconds rest (4 minutes per block).
- Default recommendation (ONLY if the user did not specify otherwise): Use 4–5 blocks for a full workout (~20 min of work).
- If the user says “one block” (or any specific number), output EXACTLY that many blocks.
- Rest between blocks: 1 minute (interBlockRestSeconds: 60) unless the user specifies a different rest.
- Choose different exercises per block that align with the main and secondary target body parts and available equipment.
- Rounds: 8, workDurationSeconds: 20, restDurationSeconds: 10, interBlockRestSeconds: 60 for every block.

COOLDOWN (5–10 minutes):
Purpose: Gradually lower heart rate. Total cooldown duration must be 300–600 seconds (5–10 min).
- Prefer low-intensity movements and stretching for the muscle groups worked: e.g. walking-in-place style moves, then static stretches.
- If equipment allows: light pedaling or resistance-band assisted stretching from the list.
- Pick 2–4 movements from the list; each can be 60–120 seconds.

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
